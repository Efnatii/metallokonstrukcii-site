import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { build } from './build.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(rootDir, 'dist');

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.geojson': 'application/geo+json; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

let localVisitCount = 0;

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  response.end(JSON.stringify(body));
}

function resolveFilePath(requestUrl) {
  const url = new URL(requestUrl, 'http://127.0.0.1');
  const decodedPath = decodeURIComponent(url.pathname);
  const cleanPath = decodedPath === '/' ? '/index.html' : decodedPath;
  const filePath = path.normalize(path.join(distDir, cleanPath));

  if (!filePath.startsWith(distDir)) {
    return null;
  }

  return filePath;
}

async function sendFile(response, filePath) {
  try {
    const fileStat = await stat(filePath);
    const finalPath = fileStat.isDirectory() ? path.join(filePath, 'index.html') : filePath;
    const body = await readFile(finalPath);
    const ext = path.extname(finalPath).toLowerCase();

    response.writeHead(200, {
      'Content-Type': contentTypes[ext] ?? 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    response.end(body);
  } catch {
    const fallback = await readFile(path.join(distDir, 'index.html'));
    response.writeHead(200, {
      'Content-Type': contentTypes['.html'],
      'Cache-Control': 'no-store'
    });
    response.end(fallback);
  }
}

function listen(port) {
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    const pathname = url.pathname.replace(/\/$/, '') || '/';

    if (request.method === 'OPTIONS' && pathname.startsWith('/api/')) {
      sendJson(response, 204, {});
      return;
    }

    if (pathname === '/api/stats' && request.method === 'GET') {
      sendJson(response, 200, {
        ok: true,
        stats: {
          today: localVisitCount,
          week: localVisitCount,
          month: localVisitCount,
          allTime: localVisitCount
        }
      });
      return;
    }

    if (pathname === '/api/stats/visit' && request.method === 'POST') {
      localVisitCount += 1;
      sendJson(response, 200, {
        ok: true,
        stats: {
          today: localVisitCount,
          week: localVisitCount,
          month: localVisitCount,
          allTime: localVisitCount
        }
      });
      return;
    }

    const filePath = resolveFilePath(request.url ?? '/');

    if (!filePath) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }

    await sendFile(response, filePath);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      listen(port + 1);
      return;
    }

    console.error(error);
    process.exitCode = 1;
  });

  server.listen(port, '127.0.0.1', () => {
    console.log(`Server running at http://127.0.0.1:${port}/`);
  });
}

await build();
listen(Number(process.env.PORT || 4173));
