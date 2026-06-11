import process from 'node:process';

const gatewayUrl = process.env.YANDEX_GATEWAY_URL || '';
const siteUrl = process.env.B2E_SITE_URL || gatewayUrl;
const targetUrl = gatewayUrl || siteUrl;

if (!targetUrl) {
  throw new Error('Set YANDEX_GATEWAY_URL or B2E_SITE_URL to the deployed Yandex API Gateway URL.');
}

const baseUrl = targetUrl.replace(/\/$/, '');
const origin = new URL(siteUrl || baseUrl).origin;
const leadEndpoint = `${baseUrl}/api/leads`;
const statsEndpoint = `${baseUrl}/api/stats`;

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

async function main() {
  const stats = await fetch(statsEndpoint, {
    headers: { Origin: origin }
  });

  const preflight = await fetch(leadEndpoint, {
    method: 'OPTIONS',
    headers: {
      Origin: origin,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type'
    }
  });

  if (preflight.status !== 204) {
    throw new Error(`Yandex API preflight returned ${preflight.status}.`);
  }

  const response = await fetch(leadEndpoint, {
    method: 'POST',
    headers: {
      Origin: origin,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Yandex Delivery Smoke',
      phone: '+79650578270',
      objectType: 'Yandex Cloud smoke',
      page: `${baseUrl}/`,
      createdAt: new Date().toISOString()
    })
  });
  const payload = await readJson(response);
  const result = {
    ok: response.ok,
    gateway: baseUrl,
    origin,
    leadEndpoint,
    statsEndpoint,
    statsStatus: stats.status,
    status: response.status,
    error: payload.error || null,
    results: payload.results || []
  };

  console.log(JSON.stringify(result, null, 2));

  if (stats.status !== 200) {
    throw new Error(`Yandex stats endpoint returned ${stats.status}.`);
  }

  if (response.status === 503) {
    throw new Error('Yandex Function delivery is not configured. Check Lockbox secrets mounted into the function version.');
  }

  if (!response.ok) {
    throw new Error(`Yandex Function delivery failed with ${response.status}. Check Cloud Functions logs and SMTP policy.`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
