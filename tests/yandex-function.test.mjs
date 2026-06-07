import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { handler } from '../yandex/function/index.mjs';

const origin = 'https://example.gateway.test';

function event({ method = 'GET', path: requestPath = '/api/stats', body } = {}) {
  return {
    httpMethod: method,
    path: requestPath,
    url: requestPath,
    headers: {
      Host: 'example.gateway.test',
      Origin: origin,
      'Content-Type': 'application/json'
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    isBase64Encoded: false
  };
}

async function withEnv(next) {
  const previous = { ...process.env };
  const statsDir = await mkdtemp(path.join(os.tmpdir(), 'b2e-yandex-stats-'));

  Object.assign(process.env, {
    ALLOWED_ORIGIN: origin,
    ENABLE_FILE_STATS: 'on',
    SITE_STATS_MOUNT: statsDir,
    SITE_LABEL: 'ООО B2E',
    LEAD_SUBJECT: 'Новая заявка на металлоконструкции'
  });

  try {
    await next();
  } finally {
    for (const key of Object.keys(process.env)) {
      if (!(key in previous)) {
        delete process.env[key];
      }
    }
    Object.assign(process.env, previous);
    await rm(statsDir, { recursive: true, force: true });
  }
}

test('Yandex function adapter records and reads visit stats through file storage', async () => {
  await withEnv(async () => {
    const first = await handler(event({ method: 'POST', path: '/api/stats/visit' }));
    const second = await handler(event({ method: 'GET', path: '/api/stats' }));

    assert.equal(first.statusCode, 200);
    assert.equal(second.statusCode, 200);
    assert.equal(JSON.parse(first.body).stats.today, 1);
    assert.equal(JSON.parse(second.body).stats.allTime, 1);
    assert.equal(first.headers['access-control-allow-origin'], origin);
  });
});

test('Yandex function adapter sends leads via existing webhook delivery path', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];

  try {
    await withEnv(async () => {
      process.env.LEAD_WEBHOOK_URL = 'https://crm.example.test/hook';
      globalThis.fetch = async (url, init) => {
        calls.push({ url, body: JSON.parse(init.body) });
        return new Response('{}', { status: 200 });
      };

      const response = await handler(event({
        method: 'POST',
        path: '/api/leads',
        body: {
          name: 'Test User',
          phone: '+79650578270',
          objectType: 'Metal frame',
          page: 'https://example.gateway.test/',
          createdAt: '2026-06-07T12:00:00.000Z'
        }
      }));
      const payload = JSON.parse(response.body);

      assert.equal(response.statusCode, 200);
      assert.equal(payload.ok, true);
      assert.equal(calls.length, 1);
      assert.equal(calls[0].url, 'https://crm.example.test/hook');
      assert.equal(calls[0].body.lead.name, 'Test User');
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
