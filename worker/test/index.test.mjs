import assert from 'node:assert/strict';
import test from 'node:test';

import worker from '../src/index.js';

const baseEnv = {
  ALLOWED_ORIGIN: 'https://efnatii.github.io',
  SITE_LABEL: 'ООО B2E',
  LEAD_SUBJECT: 'Новая заявка на металлоконструкции'
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
    page: 'https://efnatii.github.io/metallokonstrukcii-site/',
    createdAt: '2026-04-25T09:00:00.000Z',
    ...overrides
  };
}

function makeSmtpConnect(responses, commands) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  return () => ({
    opened: Promise.resolve(),
    readable: new ReadableStream({
      pull(controller) {
        const response = responses.shift();
        if (response === undefined) {
          controller.close();
          return;
        }

        controller.enqueue(encoder.encode(response));
      }
    }),
    writable: new WritableStream({
      write(chunk) {
        commands.push(decoder.decode(chunk));
      }
    }),
    close: async () => {}
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

test('SMTP keeps no-reply From while using authenticated envelope sender', async () => {
  const commands = [];
  const responses = [
    '220 smtp.test ESMTP\r\n',
    '250-smtp.test\r\n250 AUTH LOGIN\r\n',
    '334 VXNlcm5hbWU6\r\n',
    '334 UGFzc3dvcmQ6\r\n',
    '235 2.7.0 Authentication successful\r\n',
    '250 2.1.0 Sender OK\r\n',
    '250 2.1.5 Recipient OK\r\n',
    '354 End data with <CR><LF>.<CR><LF>\r\n',
    '250 2.0.0 Queued\r\n',
    '221 2.0.0 Bye\r\n'
  ];

  const response = await worker.fetch(makeRequest({ body: validLead() }), {
    ...baseEnv,
    SMTP_HOST: 'smtp.test',
    SMTP_PORT: '465',
    SMTP_USERNAME: 'smtp-login@b2energy.ru',
    SMTP_PASSWORD: 'app-password',
    SMTP_FROM: 'B2E <no-reply@b2energy.ru>',
    SMTP_FROM_NAME: 'B2E',
    SMTP_TO: 'zakaz@example.test',
    SMTP_CONNECT: makeSmtpConnect(responses, commands)
  });
  const payload = await response.json();
  const dataCommand = commands.find((command) => command.includes('Content-Type: multipart/alternative'));
  const expectedSubject = Buffer.from('Новая заявка на металлоконструкции').toString('base64');

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.ok(dataCommand);
  assert.equal(commands.find((command) => command.startsWith('MAIL FROM:')), 'MAIL FROM:<smtp-login@b2energy.ru>\r\n');
  assert.match(dataCommand, new RegExp(`^Subject: =\\?UTF-8\\?B\\?${escapeRegExp(expectedSubject)}\\?=$`, 'm'));
  assert.match(dataCommand, /^From: B2E <no-reply@b2energy\.ru>/m);
  assert.match(dataCommand, /^Sender: <smtp-login@b2energy\.ru>/m);
  assert.match(dataCommand, /^Content-Type: text\/plain; charset=UTF-8$/m);
  assert.match(dataCommand, /^Content-Type: text\/html; charset=UTF-8$/m);
  assert.match(dataCommand, /<h1[^>]*>Новая заявка на металлоконструкции<\/h1>/);
  assert.match(dataCommand, /<img src="https:\/\/efnatii\.github\.io\/metallokonstrukcii-site\/assets\/logo\/logo-b2e\.png"/);
  assert.match(dataCommand, /Тип обращения: Заявка/);
  assert.match(dataCommand, />Тип обращения<\/td>/);
  assert.match(dataCommand, />Заявка<\/td>/);
  assert.match(dataCommand, />Объект или услуга<\/td>/);
  assert.match(dataCommand, /Сайт: B2E Металлоконструкции/);
  assert.match(dataCommand, /Когда отправлено: 25 апреля 2026 года, 12:00 по московскому времени/);
  assert.match(dataCommand, /Реквизиты B2E/);
  assert.match(dataCommand, /ООО «БИЗНЕС В ЭНЕРГЕТИКЕ»/);
  assert.match(dataCommand, /ИНН 7811801565 · КПП 781101001 · ОГРН 1247800091098/);
  assert.match(dataCommand, /Служебное уведомление сформировано после отправки формы на сайте/);
  assert.doesNotMatch(dataCommand, /Открыть страницу заявки/);
  assert.doesNotMatch(dataCommand, /Новая входящая заявка/);
  assert.doesNotMatch(dataCommand, /Cloudflare Worker/);
  assert.doesNotMatch(dataCommand, />Источник<\/td>/);
});

test('SMTP labels free-form callback as message and includes client comment', async () => {
  const commands = [];
  const responses = [
    '220 smtp.test ESMTP\r\n',
    '250-smtp.test\r\n250 AUTH LOGIN\r\n',
    '334 VXNlcm5hbWU6\r\n',
    '334 UGFzc3dvcmQ6\r\n',
    '235 2.7.0 Authentication successful\r\n',
    '250 2.1.0 Sender OK\r\n',
    '250 2.1.5 Recipient OK\r\n',
    '354 End data with <CR><LF>.<CR><LF>\r\n',
    '250 2.0.0 Queued\r\n',
    '221 2.0.0 Bye\r\n'
  ];

  const response = await worker.fetch(
    makeRequest({
      body: validLead({
        objectType: 'Общая заявка',
        message: 'Нужно изготовить лестницу и ограждения для склада.'
      })
    }),
    {
      ...baseEnv,
      SMTP_HOST: 'smtp.test',
      SMTP_PORT: '465',
      SMTP_USERNAME: 'smtp-login@b2energy.ru',
      SMTP_PASSWORD: 'app-password',
      SMTP_FROM: 'B2E <no-reply@b2energy.ru>',
      SMTP_FROM_NAME: 'B2E',
      SMTP_TO: 'zakaz@example.test',
      SMTP_CONNECT: makeSmtpConnect(responses, commands)
    }
  );
  const payload = await response.json();
  const dataCommand = commands.find((command) => command.includes('Content-Type: multipart/alternative'));
  const expectedSubject = Buffer.from('Новое сообщение на металлоконструкции').toString('base64');

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.ok(dataCommand);
  assert.match(dataCommand, new RegExp(`^Subject: =\\?UTF-8\\?B\\?${escapeRegExp(expectedSubject)}\\?=$`, 'm'));
  assert.match(dataCommand, /Тип обращения: Сообщение/);
  assert.match(dataCommand, />Сообщение<\/td>/);
  assert.match(dataCommand, /Комментарий клиента/);
  assert.match(dataCommand, /Нужно изготовить лестницу и ограждения для склада\./);
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
