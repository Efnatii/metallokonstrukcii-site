const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store'
};
const DEFAULT_LEAD_SUBJECT = 'Новая заявка на металлоконструкции';
const DEFAULT_MESSAGE_SUBJECT = 'Новое сообщение на металлоконструкции';
const EMAIL_BOUNDARY = 'b2e-lead-message-boundary';
const MOSCOW_TIME_ZONE = 'Europe/Moscow';
const DEFAULT_SITE_PROFILE = {
  label: 'ООО B2E',
  siteName: 'B2E Металлоконструкции',
  siteType: 'Производство металлоконструкций',
  defaultRoot: 'https://efnatii.github.io/metallokonstrukcii-site/',
  logoPath: './assets/logo/logo-b2e.png',
  legalName: 'ООО «БИЗНЕС В ЭНЕРГЕТИКЕ»',
  inn: '7811801565',
  kpp: '781101001',
  ogrn: '1247800091098',
  address: 'Санкт-Петербург, ул. Седова, 57, лит. В, помещ. 11-Н, ком. 3',
  phone: '+7 (965) 057-82-70',
  email: 'zakaz@b2energy.ru'
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
    message: cleanText(input.message, 1000),
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

function escapeHtml(value, maxLength = 800) {
  return cleanText(value, maxLength).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function safeHttpUrl(value) {
  const url = cleanText(value, 500);
  return /^https?:\/\//i.test(url) ? url : '';
}

function resolveSiteRoot(page, fallbackRoot) {
  const fallback = safeHttpUrl(fallbackRoot) || DEFAULT_SITE_PROFILE.defaultRoot;

  if (!page) {
    return fallback;
  }

  try {
    const url = new URL(page);
    if (/\/metallokonstrukcii-site(?:\/|$)/i.test(url.pathname)) {
      return `${url.origin}/metallokonstrukcii-site/`;
    }

    return `${url.origin}/`;
  } catch {
    return fallback;
  }
}

function resolveAssetUrl(root, path) {
  try {
    return new URL(path, root).href;
  } catch {
    return new URL(DEFAULT_SITE_PROFILE.logoPath, DEFAULT_SITE_PROFILE.defaultRoot).href;
  }
}

function getSiteProfile(lead, env) {
  const page = safeHttpUrl(lead.page);
  const root = resolveSiteRoot(page, env.SITE_URL || DEFAULT_SITE_PROFILE.defaultRoot);
  const logoUrl = safeHttpUrl(env.EMAIL_LOGO_URL) || resolveAssetUrl(root, DEFAULT_SITE_PROFILE.logoPath);

  return {
    ...DEFAULT_SITE_PROFILE,
    label: cleanText(env.SITE_LABEL || DEFAULT_SITE_PROFILE.label, 80),
    root,
    logoUrl
  };
}

function formatHumanDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return cleanText(value, 80) || 'Не указана';
  }

  try {
    const parts = new Intl.DateTimeFormat('ru-RU', {
      timeZone: MOSCOW_TIME_ZONE,
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(date);
    const part = (type) => parts.find((item) => item.type === type)?.value || '';

    return `${part('day')} ${part('month')} ${part('year')} года, ${part('hour')}:${part('minute')} по московскому времени`;
  } catch {
    return date.toISOString();
  }
}

function isMessageLead(lead) {
  return Boolean(lead.message) && (!lead.objectType || /^общая заявка$/i.test(lead.objectType));
}

function formatLeadKind(lead) {
  return isMessageLead(lead) ? 'Сообщение' : 'Заявка';
}

function formatLeadRequestText(lead) {
  return cleanText(lead.message || lead.objectType, 1000) || 'Не указан';
}

function formatLeadSubject(lead, env) {
  const configuredSubject = cleanText(env.LEAD_SUBJECT, 140);
  const fallbackSubject = isMessageLead(lead) ? DEFAULT_MESSAGE_SUBJECT : DEFAULT_LEAD_SUBJECT;
  const subject = /металлоконструкц/i.test(configuredSubject)
    ? configuredSubject
    : fallbackSubject;

  return isMessageLead(lead) ? subject.replace(/^Новая заявка/i, 'Новое сообщение') : subject;
}

function formatLeadText(lead, env) {
  const profile = getSiteProfile(lead, env);
  const humanDate = formatHumanDate(lead.createdAt);

  return [
    formatLeadSubject(lead, env),
    '',
    'Карточка обращения',
    `Имя: ${lead.name}`,
    `Контакт: ${lead.phone}`,
    `Текст заявки: ${formatLeadRequestText(lead)}`,
    `Сайт: ${profile.siteName}`,
    `Направление сайта: ${profile.siteType}`,
    `Страница отправки: ${lead.page || '-'}`,
    `Когда отправлено: ${humanDate}`,
    '',
    'Реквизиты B2E',
    profile.legalName,
    `ИНН ${profile.inn}, КПП ${profile.kpp}, ОГРН ${profile.ogrn}`,
    profile.address,
    `Контакты компании: ${profile.phone}, ${profile.email}`
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

function formatEmailHtml(lead, env) {
  const profile = getSiteProfile(lead, env);
  const subject = escapeHtml(formatLeadSubject(lead, env), 220);
  const siteLabel = escapeHtml(profile.label, 80);
  const siteName = escapeHtml(profile.siteName, 120);
  const siteType = escapeHtml(profile.siteType, 140);
  const legalName = escapeHtml(profile.legalName, 160);
  const companyRequisites = escapeHtml(`ИНН ${profile.inn} · КПП ${profile.kpp} · ОГРН ${profile.ogrn}`, 160);
  const companyAddress = escapeHtml(profile.address, 220);
  const companyContacts = escapeHtml(`${profile.phone} · ${profile.email}`, 160);
  const logoUrl = escapeHtml(profile.logoUrl, 500);
  const name = escapeHtml(lead.name, 120);
  const phone = escapeHtml(lead.phone, 80);
  const requestText = escapeHtml(formatLeadRequestText(lead), 1000);
  const page = safeHttpUrl(lead.page);
  const pageText = escapeHtml(page || 'Не указана', 500);
  const createdAt = escapeHtml(formatHumanDate(lead.createdAt), 120);

  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background:#f2f4f7;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;color:#151515;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#f2f4f7;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="width:100%;max-width:640px;border-collapse:separate;border-spacing:0;background:#ffffff;border:1px solid #d9dde3;">
            <tr>
              <td style="background:#070a0c;padding:26px 28px 24px 28px;border-bottom:6px solid #ffc400;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="font-size:26px;line-height:30px;font-weight:800;color:#ffffff;letter-spacing:0;">
                      <img src="${logoUrl}" width="150" height="45" alt="${siteLabel}" style="display:block;width:150px;max-width:150px;height:auto;border:0;outline:none;text-decoration:none;">
                    </td>
                    <td align="right" style="font-size:12px;line-height:16px;color:#ffc400;text-transform:uppercase;font-weight:700;">
                      Заявка с сайта
                    </td>
                  </tr>
                </table>
                <div style="height:22px;line-height:22px;font-size:22px;">&nbsp;</div>
                <div style="font-size:12px;line-height:16px;color:#9aa3ad;text-transform:uppercase;font-weight:700;">${siteName} · ${siteType}</div>
                <h1 style="margin:8px 0 0 0;font-size:28px;line-height:34px;color:#ffffff;font-weight:800;">${subject}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;background:#ffffff;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="padding:0 0 16px 0;">
                      <div style="font-size:12px;line-height:16px;color:#707983;text-transform:uppercase;font-weight:700;">Контакт клиента</div>
                      <div style="margin-top:6px;font-size:24px;line-height:30px;color:#101418;font-weight:800;">${name}</div>
                      <div style="margin-top:4px;font-size:18px;line-height:24px;color:#101418;font-weight:700;">${phone}</div>
                      <div style="margin-top:10px;display:inline-block;background:#fff5c2;color:#4d3a00;font-size:13px;line-height:18px;font-weight:700;padding:8px 10px;border-left:4px solid #ffc400;">Нужно связаться с клиентом и уточнить параметры проекта.</div>
                    </td>
                  </tr>
                </table>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border-top:1px solid #e3e7ec;border-bottom:1px solid #e3e7ec;">
                  <tr>
                    <td style="width:34%;padding:14px 12px 14px 0;font-size:12px;line-height:16px;color:#707983;text-transform:uppercase;font-weight:700;border-bottom:1px solid #e3e7ec;">Сайт</td>
                    <td style="padding:14px 0;font-size:15px;line-height:21px;color:#151515;font-weight:700;border-bottom:1px solid #e3e7ec;">${siteName}</td>
                  </tr>
                  <tr>
                    <td style="width:34%;padding:14px 12px 14px 0;font-size:12px;line-height:16px;color:#707983;text-transform:uppercase;font-weight:700;border-bottom:1px solid #e3e7ec;">Текст заявки</td>
                    <td style="padding:14px 0;font-size:15px;line-height:21px;color:#151515;font-weight:700;border-bottom:1px solid #e3e7ec;">${requestText}</td>
                  </tr>
                  <tr>
                    <td style="width:34%;padding:14px 12px 14px 0;font-size:12px;line-height:16px;color:#707983;text-transform:uppercase;font-weight:700;border-bottom:1px solid #e3e7ec;">Страница отправки</td>
                    <td style="padding:14px 0;font-size:15px;line-height:21px;color:#151515;border-bottom:1px solid #e3e7ec;">${pageText}</td>
                  </tr>
                  <tr>
                    <td style="width:34%;padding:14px 12px 14px 0;font-size:12px;line-height:16px;color:#707983;text-transform:uppercase;font-weight:700;">Когда отправлено</td>
                    <td style="padding:14px 0;font-size:15px;line-height:21px;color:#151515;">${createdAt}</td>
                  </tr>
                </table>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:22px;border-collapse:collapse;background:#f8fafc;border:1px solid #e3e7ec;">
                  <tr>
                    <td style="padding:16px 18px;">
                      <div style="font-size:12px;line-height:16px;color:#707983;text-transform:uppercase;font-weight:700;">Реквизиты B2E</div>
                      <div style="margin-top:7px;font-size:15px;line-height:22px;color:#151515;font-weight:800;">${legalName}</div>
                      <div style="margin-top:3px;font-size:13px;line-height:20px;color:#343b43;">${companyRequisites}</div>
                      <div style="margin-top:3px;font-size:13px;line-height:20px;color:#343b43;">${companyAddress}</div>
                      <div style="margin-top:3px;font-size:13px;line-height:20px;color:#343b43;">${companyContacts}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="background:#f8fafc;padding:18px 28px;font-size:12px;line-height:18px;color:#66717d;border-top:1px solid #e3e7ec;">
                Служебное уведомление сформировано после отправки формы на сайте. Для ответа используйте контакт клиента из карточки обращения.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function formatEmailMessage(lead, env) {
  const from = smtpAddress(env.SMTP_FROM || env.SMTP_USERNAME);
  const envelopeFrom = smtpAddress(env.SMTP_ENVELOPE_FROM || env.SMTP_USERNAME);
  const fromName = cleanText(env.SMTP_FROM_NAME || env.SITE_LABEL || 'ООО B2E', 80);
  const to = smtpRecipients(env.SMTP_TO);
  const subject = formatLeadSubject(lead, env);
  const text = formatLeadText(lead, env);
  const html = formatEmailHtml(lead, env);
  const headers = [
    `From: ${encodeHeader(fromName)} <${from}>`,
    `To: ${to.join(', ')}`,
    `Subject: ${encodeHeader(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${EMAIL_BOUNDARY}"`
  ];

  if (envelopeFrom && envelopeFrom.toLowerCase() !== from.toLowerCase()) {
    headers.splice(1, 0, `Sender: <${envelopeFrom}>`);
  }

  return [
    ...headers,
    '',
    `--${EMAIL_BOUNDARY}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    text,
    `--${EMAIL_BOUNDARY}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    html,
    `--${EMAIL_BOUNDARY}--`
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
      subject: formatLeadSubject(lead, env),
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
