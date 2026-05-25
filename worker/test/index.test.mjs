import assert from 'node:assert/strict';
import test from 'node:test';

import worker from '../src/index.js';

const baseEnv = {
  ALLOWED_ORIGIN: 'https://efnatii.github.io',
  SITE_LABEL: 'ООО B2E',
  LEAD_SUBJECT: 'Новая заявка с сайта B2E'
};

function makeRequest({ method = 'POST', origin = baseEnv.ALLOWED_ORIGIN, body } = {}) {
  const init = {
    method,
    headers: {
      Origin: origin,
      'Content-Type': 'application/json'
    }
  };

  if (body !== undefined) {
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  return new Request('https://b2e-leads.test/', init);
}

function validLead(overrides = {}) {
  return {
    name: 'Test User',
    phone: '+79650578270',
    objectType: 'Metal frame',
    source: 'test',
    page: 'https://efnatii.github.io/metallokonstrukcii-site/',
    createdAt: '2026-04-25T09:00:00.000Z',
    ...overrides
  };
}

test('OPTIONS request returns CORS preflight headers', async () => {
  const response = await worker.fetch(makeRequest({ method: 'OPTIONS' }), baseEnv);

  assert.equal(response.status, 204);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), baseEnv.ALLOWED_ORIGIN);
  assert.match(response.headers.get('Access-Control-Allow-Methods'), /POST/);
});

test('POST from unknown origin is rejected', async () => {
  const response = await worker.fetch(
    makeRequest({ origin: 'https://attacker.example', body: validLead() }),
    baseEnv
  );
  const payload = await response.json();

  assert.equal(response.status, 403);
  assert.equal(payload.error, 'Forbidden origin');
});

test('invalid JSON is rejected', async () => {
  const response = await worker.fetch(makeRequest({ body: '{not-json' }), baseEnv);
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.error, 'Invalid JSON');
});

test('lead validation rejects missing name and invalid phone', async () => {
  const noName = await worker.fetch(makeRequest({ body: validLead({ name: '' }) }), baseEnv);
  const badPhone = await worker.fetch(makeRequest({ body: validLead({ phone: '12' }) }), baseEnv);

  assert.equal(noName.status, 400);
  assert.equal((await noName.json()).error, 'Name is required');
  assert.equal(badPhone.status, 400);
  assert.equal((await badPhone.json()).error, 'Valid phone is required');
});

test('valid lead without delivery target returns explicit 503', async () => {
  const response = await worker.fetch(makeRequest({ body: validLead() }), baseEnv);
  const payload = await response.json();

  assert.equal(response.status, 503);
  assert.equal(payload.error, 'Lead destination is not configured');
});

test('webhook delivery sends sanitized JSON payload', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];

  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), body: JSON.parse(init.body) });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };

  try {
    const response = await worker.fetch(makeRequest({ body: validLead({ name: '  Alice\nSmith  ' }) }), {
      ...baseEnv,
      LEAD_WEBHOOK_URL: 'https://crm.example/hook'
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://crm.example/hook');
    assert.equal(calls[0].body.lead.name, 'Alice Smith');
    assert.equal(calls[0].body.lead.phone, '+79650578270');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('SMTP delivery can be configured through Worker secrets', async () => {
  const smtpCalls = [];
  const response = await worker.fetch(makeRequest({ body: validLead({ objectType: 'Строительные металлоконструкции' }) }), {
    ...baseEnv,
    SMTP_HOST: 'smtp.test',
    SMTP_PORT: '465',
    SMTP_USERNAME: 'sender@example.test',
    SMTP_PASSWORD: 'app-password',
    SMTP_FROM: 'sender@example.test',
    SMTP_TO: 'zakaz@example.test',
    SMTP_SEND: async (lead, env) => {
      smtpCalls.push({ lead, to: env.SMTP_TO, from: env.SMTP_FROM });
      return { target: 'smtp', ok: true, status: 250 };
    }
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.deepEqual(payload.results, [{ target: 'smtp', ok: true, status: 250 }]);
  assert.equal(smtpCalls.length, 1);
  assert.equal(smtpCalls[0].lead.objectType, 'Строительные металлоконструкции');
  assert.equal(smtpCalls[0].to, 'zakaz@example.test');
});

test('Turnstile secret requires a token before delivery', async () => {
  const response = await worker.fetch(makeRequest({ body: validLead() }), {
    ...baseEnv,
    TURNSTILE_SECRET_KEY: 'secret',
    LEAD_WEBHOOK_URL: 'https://crm.example/hook'
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.error, 'Captcha validation failed');
});

test('Turnstile success allows webhook delivery', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];

  globalThis.fetch = async (url, init) => {
    calls.push(String(url));

    if (String(url).includes('/turnstile/v0/siteverify')) {
      assert.equal(init.method, 'POST');
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };

  try {
    const response = await worker.fetch(
      makeRequest({ body: validLead({ turnstileToken: 'token' }) }),
      {
        ...baseEnv,
        TURNSTILE_SECRET_KEY: 'secret',
        LEAD_WEBHOOK_URL: 'https://crm.example/hook'
      }
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.deepEqual(calls, [
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      'https://crm.example/hook'
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
