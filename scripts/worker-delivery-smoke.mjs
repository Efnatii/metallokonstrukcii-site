import process from 'node:process';

const siteUrl = process.env.B2E_SITE_URL || 'https://efnatii.github.io/metallokonstrukcii-site/';
const leadEndpoint = process.env.B2E_LEAD_ENDPOINT || 'https://b2e-leads.egory780.workers.dev';
const origin = new URL(siteUrl).origin;

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

async function main() {
  const preflight = await fetch(leadEndpoint, {
    method: 'OPTIONS',
    headers: {
      Origin: origin,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type'
    }
  });

  if (preflight.status !== 204) {
    throw new Error(`Worker preflight returned ${preflight.status}; git-deploy is not serving the expected Worker.`);
  }

  const response = await fetch(leadEndpoint, {
    method: 'POST',
    headers: {
      Origin: origin,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Worker Delivery Smoke',
      phone: '+79650578270',
      objectType: 'SMTP/no-reply smoke',
      source: 'worker-delivery-smoke',
      page: siteUrl,
      createdAt: new Date().toISOString()
    })
  });
  const payload = await readJson(response);
  const result = {
    ok: response.ok,
    endpoint: leadEndpoint,
    status: response.status,
    error: payload.error || null,
    results: payload.results || []
  };

  console.log(JSON.stringify(result, null, 2));

  if (response.status === 503) {
    throw new Error('Worker delivery is not configured. Add runtime Worker secrets in Cloudflare: SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD and SMTP_TO.');
  }

  if (!response.ok) {
    throw new Error(`Worker delivery failed with ${response.status}. Check SMTP credentials, sender policy and Worker logs.`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
