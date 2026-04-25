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
    env.LEAD_SUBJECT || 'New lead from B2e site',
    '',
    `Name: ${lead.name}`,
    `Phone: ${lead.phone}`,
    `Object type: ${lead.objectType || '-'}`,
    `Source: ${lead.source || '-'}`,
    `Page: ${lead.page || '-'}`,
    `Date: ${lead.createdAt}`
  ].join('\n');
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
      site: env.SITE_LABEL || 'OOO B2e',
      subject: env.LEAD_SUBJECT || 'New lead from B2e site',
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

    const results = [await sendTelegram(lead, env), await sendWebhook(lead, env)].filter(Boolean);
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
