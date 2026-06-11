import { mkdir, readFile, writeFile } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { Readable, Writable } from 'node:stream';
import tls from 'node:tls';

import worker from '../../worker/src/index.js';

const DEFAULT_STATS_MOUNT = '/mnt/site-stats';
const STATS_FILE_NAME = 'b2e-site-visits.json';

function toHeaders(input = {}) {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.join(', ') : String(value)
    ])
  );
}

function requestUrl(event) {
  const headers = toHeaders(event.headers);
  const host = headers.Host || headers.host || 'api-gateway.local';
  const pathWithQuery = stripApiPrefix(event.url || event.path || '/', process.env.API_PREFIX || '/api');
  const protocol = headers['X-Forwarded-Proto'] || headers['x-forwarded-proto'] || 'https';

  return /^https?:\/\//i.test(pathWithQuery)
    ? pathWithQuery
    : `${protocol}://${host}${pathWithQuery}`;
}

function stripApiPrefix(value, prefix) {
  const source = String(value || '/');
  const normalizedPrefix = `/${String(prefix || '').replace(/^\/+|\/+$/g, '')}`;

  if (normalizedPrefix === '/' || /^https?:\/\//i.test(source)) {
    return source;
  }

  if (source === normalizedPrefix) {
    return '/';
  }

  return source.startsWith(`${normalizedPrefix}/`)
    ? source.slice(normalizedPrefix.length)
    : source;
}

function requestBody(event) {
  if (event.body === undefined || event.body === null) {
    return undefined;
  }

  return event.isBase64Encoded
    ? Buffer.from(event.body, 'base64')
    : event.body;
}

function makeRequest(event) {
  const method = event.httpMethod || event.method || 'GET';
  const init = {
    method,
    headers: toHeaders(event.headers)
  };
  const body = requestBody(event);

  if (!['GET', 'HEAD'].includes(method.toUpperCase()) && body !== undefined) {
    init.body = body;
  }

  return new Request(requestUrl(event), init);
}

function normalizeHeaderMap(headers) {
  const result = {};

  for (const [key, value] of headers.entries()) {
    result[key] = value;
  }

  return result;
}

async function toFunctionResponse(response) {
  const body = await response.text();

  return {
    statusCode: response.status,
    headers: normalizeHeaderMap(response.headers),
    body,
    isBase64Encoded: false
  };
}

function wrapSocket(socket, hostname) {
  return {
    opened: new Promise((resolve, reject) => {
      socket.once(socket.encrypted ? 'secureConnect' : 'connect', resolve);
      socket.once('error', reject);
    }),
    readable: Readable.toWeb(socket),
    writable: Writable.toWeb(socket),
    async startTls() {
      return wrapSocket(tls.connect({ socket, servername: hostname }), hostname);
    },
    async close() {
      socket.end();
    }
  };
}

function nodeSocketConnect({ hostname, port }, options = {}) {
  const secureTransport = options.secureTransport || 'on';
  const socket = secureTransport === 'on'
    ? tls.connect({ host: hostname, port, servername: hostname })
    : net.connect({ host: hostname, port });

  return wrapSocket(socket, hostname);
}

function statsPath(env) {
  return path.join(env.SITE_STATS_MOUNT || DEFAULT_STATS_MOUNT, STATS_FILE_NAME);
}

async function readStatsData(filePath) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch {
    return {};
  }
}

async function writeStatsData(filePath, data) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(data), 'utf8');
}

function makeFileKvStore(env) {
  let writeQueue = Promise.resolve();

  return {
    async get(key) {
      const data = await readStatsData(statsPath(env));
      return data[key] ?? null;
    },
    async put(key, value) {
      writeQueue = writeQueue.then(async () => {
        const filePath = statsPath(env);
        const data = await readStatsData(filePath);

        data[key] = String(value);
        await writeStatsData(filePath, data);
      });

      await writeQueue;
    }
  };
}

function makeEnv() {
  const env = {
    ...process.env,
    SOCKET_CONNECT: nodeSocketConnect
  };

  if (process.env.SITE_STATS_MOUNT || process.env.ENABLE_FILE_STATS !== 'off') {
    env.SITE_STATS_KV = makeFileKvStore(env);
  }

  return env;
}

export async function handler(event) {
  const request = makeRequest(event);
  const response = await worker.fetch(request, makeEnv());

  return toFunctionResponse(response);
}
