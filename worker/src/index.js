const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store'
};

function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGIN || 'https://efnatii.github.io')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = allowedOrigins(env);
  const allowOrigin = allowed.includes(origin) ? origin : allowed[0];

  return {
    ...JSON_HEADERS,
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin'
  };
}

function jsonResponse(request, env, body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      ...corsHeaders(request, env),
      ...(init.headers || {})
    }
  });
}

function cleanText(value, maxLength = 800) {
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function normalizeLead(input) {
  return {
    name: cleanText(input.name, 120),
    phone: cleanText(input.phone, 80),
    objectType: cleanText(input.objectType, 180),
    source: cleanText(input.source, 500),
    page: cleanText(input.page, 500),
    createdAt: cleanText(input.createdAt, 80) || new Date().toISOString()
  };
}

function validateLead(lead) {
  if (lead.name.length < 2) {
    return 'Name is required';
  }

  if (!/^\+?[\d\s().-]{7,}$/.test(lead.phone)) {
    return 'Valid phone is required';
  }

  return '';
}

function formatLeadText(lead, env) {
  return [
    env.LEAD_SUBJECT || 'Новая заявка с сайта B2E',
    '',
    `Name: ${lead.name}`,
    `Phone: ${lead.phone}`,
    `Object type: ${lead.objectType || '-'}`,
    `Source: ${lead.source || '-'}`,
    `Page: ${lead.page || '-'}`,
    `Date: ${lead.createdAt}`
  ].join('\n');
}

function base64Utf8(value) {
  const bytes = new TextEncoder().encode(String(value));
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  if (typeof btoa === 'function') {
    return btoa(binary);
  }

  return Buffer.from(bytes).toString('base64');
}

function encodeHeader(value) {
  const text = cleanText(value, 180);
  return /^[\x20-\x7e]*$/.test(text) ? text : `=?UTF-8?B?${base64Utf8(text)}?=`;
}

function smtpAddress(value) {
  const text = cleanText(value, 180);
  const mailbox = text.match(/<([^<>]+)>/)?.[1] || text;
  return mailbox.replace(/[<>]/g, '').trim();
}

function smtpRecipients(value) {
  return String(value || '')
    .split(',')
    .map((item) => smtpAddress(item))
    .filter(Boolean);
}

function formatEmailMessage(lead, env) {
  const from = smtpAddress(env.SMTP_FROM || env.SMTP_USERNAME);
  const envelopeFrom = smtpAddress(env.SMTP_ENVELOPE_FROM || env.SMTP_USERNAME);
  const fromName = cleanText(env.SMTP_FROM_NAME || env.SITE_LABEL || 'ООО B2E', 80);
  const to = smtpRecipients(env.SMTP_TO);
  const subject = env.LEAD_SUBJECT || 'Новая заявка с сайта B2E';
  const text = formatLeadText(lead, env);
  const headers = [
    `From: ${encodeHeader(fromName)} <${from}>`,
    `To: ${to.join(', ')}`,
    `Subject: ${encodeHeader(subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit'
  ];

  if (envelopeFrom && envelopeFrom.toLowerCase() !== from.toLowerCase()) {
    headers.splice(1, 0, `Sender: <${envelopeFrom}>`);
  }

  return [
    ...headers,
    '',
    text
  ].join('\r\n');
}

function isSmtpConfigured(env) {
  return Boolean(env.SMTP_HOST && env.SMTP_USERNAME && env.SMTP_PASSWORD && env.SMTP_TO);
}

function smtpCode(response) {
  return Number(String(response).match(/^(\d{3})/m)?.[1] || 0);
}

async function readSmtpResponse(reader) {
  const decoder = new TextDecoder();
  let response = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    response += decoder.decode(value, { stream: true });

    if (/(^|\r?\n)\d{3} [^\r\n]*(\r?\n)?$/.test(response)) {
      break;
    }
  }

  return response;
}

async function writeSmtp(writer, value) {
  await writer.write(new TextEncoder().encode(value));
}

async function smtpCommand(reader, writer, command, expectedCodes) {
  if (command) {
    await writeSmtp(writer, `${command}\r\n`);
  }

  const response = await readSmtpResponse(reader);
  const code = smtpCode(response);
  if (!expectedCodes.includes(code)) {
    throw new Error(`SMTP command failed with ${code}`);
  }

  return response;
}

async function getSocketConnect(env) {
  if (typeof env.SMTP_CONNECT === 'function') {
    return env.SMTP_CONNECT;
  }

  const sockets = await import('cloudflare:sockets');
  return sockets.connect;
}

async function sendSmtp(lead, env) {
  if (!isSmtpConfigured(env)) {
    return null;
  }

  if (typeof env.SMTP_SEND === 'function') {
    return env.SMTP_SEND(lead, env);
  }

  const connect = await getSocketConnect(env);
  const host = cleanText(env.SMTP_HOST, 160);
  const port = Number(env.SMTP_PORT || 465);
  const secureTransport = env.SMTP_SECURE === 'starttls' ? 'starttls' : 'on';
  const recipients = smtpRecipients(env.SMTP_TO);
  const from = smtpAddress(env.SMTP_ENVELOPE_FROM || env.SMTP_USERNAME);
  const message = formatEmailMessage(lead, env).replace(/^\./gm, '..');

  let socket = connect({ hostname: host, port }, { secureTransport });
  await socket.opened;

  let reader = socket.readable.getReader();
  let writer = socket.writable.getWriter();

  try {
    await smtpCommand(reader, writer, '', [220]);
    await smtpCommand(reader, writer, `EHLO ${cleanText(env.SMTP_EHLO_DOMAIN || 'b2energy.ru', 120)}`, [250]);

    if (secureTransport === 'starttls') {
      await smtpCommand(reader, writer, 'STARTTLS', [220]);
      writer.releaseLock();
      reader.releaseLock();
      socket = socket.startTls();
      await socket.opened;
      reader = socket.readable.getReader();
      writer = socket.writable.getWriter();
      await smtpCommand(reader, writer, `EHLO ${cleanText(env.SMTP_EHLO_DOMAIN || 'b2energy.ru', 120)}`, [250]);
    }

    await smtpCommand(reader, writer, 'AUTH LOGIN', [334]);
    await smtpCommand(reader, writer, base64Utf8(env.SMTP_USERNAME), [334]);
    await smtpCommand(reader, writer, base64Utf8(env.SMTP_PASSWORD), [235]);
    await smtpCommand(reader, writer, `MAIL FROM:<${from}>`, [250]);

    for (const recipient of recipients) {
      await smtpCommand(reader, writer, `RCPT TO:<${recipient}>`, [250, 251]);
    }

    await smtpCommand(reader, writer, 'DATA', [354]);
    await smtpCommand(reader, writer, `${message}\r\n.`, [250]);
    await smtpCommand(reader, writer, 'QUIT', [221]);
  } finally {
    writer.releaseLock?.();
    reader.releaseLock?.();
    await socket.close?.();
  }

  return {
    target: 'smtp',
    ok: true,
    status: 250
  };
}

async function verifyTurnstile(token, request, env) {
  if (!env.TURNSTILE_SECRET_KEY) {
    return true;
  }

  if (!token) {
    return false;
  }

  const formData = new FormData();
  formData.append('secret', env.TURNSTILE_SECRET_KEY);
  formData.append('response', token);
  formData.append('remoteip', request.headers.get('CF-Connecting-IP') || '');

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: formData
  });
  const result = await response.json();

  return Boolean(result.success);
}

async function sendTelegram(lead, env) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return null;
  }

  const response = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text: formatLeadText(lead, env),
        disable_web_page_preview: true
      })
    }
  );

  return {
    target: 'telegram',
    ok: response.ok,
    status: response.status
  };
}

async function sendWebhook(lead, env) {
  if (!env.LEAD_WEBHOOK_URL) {
    return null;
  }

  const response = await fetch(env.LEAD_WEBHOOK_URL, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({
      site: env.SITE_LABEL || 'ООО B2E',
      subject: env.LEAD_SUBJECT || 'Новая заявка с сайта B2E',
      text: formatLeadText(lead, env),
      lead
    })
  });

  return {
    target: 'webhook',
    ok: response.ok,
    status: response.status
  };
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request, env)
      });
    }

    if (request.method !== 'POST') {
      return jsonResponse(request, env, { error: 'Method not allowed' }, { status: 405 });
    }

    const origin = request.headers.get('Origin') || '';
    if (!allowedOrigins(env).includes(origin)) {
      return jsonResponse(request, env, { error: 'Forbidden origin' }, { status: 403 });
    }

    const contentLength = Number(request.headers.get('Content-Length') || '0');
    if (contentLength > 16384) {
      return jsonResponse(request, env, { error: 'Payload too large' }, { status: 413 });
    }

    let input;
    try {
      input = JSON.parse(await request.text());
    } catch {
      return jsonResponse(request, env, { error: 'Invalid JSON' }, { status: 400 });
    }

    const turnstileOk = await verifyTurnstile(input.turnstileToken, request, env);
    if (!turnstileOk) {
      return jsonResponse(request, env, { error: 'Captcha validation failed' }, { status: 400 });
    }

    const lead = normalizeLead(input);
    const validationError = validateLead(lead);
    if (validationError) {
      return jsonResponse(request, env, { error: validationError }, { status: 400 });
    }

    const results = [
      await sendTelegram(lead, env),
      await sendWebhook(lead, env),
      await sendSmtp(lead, env)
    ].filter(Boolean);
    if (results.length === 0) {
      return jsonResponse(
        request,
        env,
        { error: 'Lead destination is not configured' },
        { status: 503 }
      );
    }

    const failed = results.filter((result) => !result.ok);
    if (failed.length > 0) {
      return jsonResponse(request, env, { error: 'Lead delivery failed', results }, { status: 502 });
    }

    return jsonResponse(request, env, { ok: true, results });
  }
};
