import assert from 'node:assert/strict';
import process from 'node:process';

const siteUrl = process.env.B2E_SITE_URL || 'https://efnatii.github.io/metallokonstrukcii-site/';
const leadEndpoint =
  process.env.B2E_LEAD_ENDPOINT || 'https://b2e-leads.egory780.workers.dev';
const origin = new URL(siteUrl).origin;

async function expectOk(url, label) {
  const response = await fetch(url, { redirect: 'follow' });
  assert.ok(response.ok, `${label} returned ${response.status}`);
  return response;
}

async function main() {
  const normalizedSiteUrl = siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`;
  const checks = [];

  const home = await expectOk(normalizedSiteUrl, 'site');
  checks.push({ check: 'site', status: home.status, url: normalizedSiteUrl });

  const config = await expectOk(`${normalizedSiteUrl}config.js`, 'config.js');
  const configText = await config.text();
  assert.match(configText, /window\.B2E_CONFIG/);
  checks.push({ check: 'config.js', status: config.status });

  const sitemap = await expectOk(`${normalizedSiteUrl}sitemap.xml`, 'sitemap.xml');
  const sitemapText = await sitemap.text();
  assert.match(sitemapText, /<urlset/);
  checks.push({ check: 'sitemap.xml', status: sitemap.status });

  if (leadEndpoint) {
    const preflight = await fetch(leadEndpoint, {
      method: 'OPTIONS',
      headers: {
        Origin: origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    assert.equal(preflight.status, 204, `worker preflight returned ${preflight.status}`);
    assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), origin);
    checks.push({ check: 'worker preflight', status: preflight.status, url: leadEndpoint });

    const leadResponse = await fetch(leadEndpoint, {
      method: 'POST',
      headers: {
        Origin: origin,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Smoke Test',
        phone: '+79650578270',
        objectType: 'Smoke',
        source: 'smoke',
        page: normalizedSiteUrl,
        createdAt: new Date().toISOString()
      })
    });
    assert.ok(
      [200, 502, 503].includes(leadResponse.status),
      `worker test lead returned ${leadResponse.status}`
    );
    checks.push({ check: 'worker test lead', status: leadResponse.status });
  }

  console.log(JSON.stringify({ ok: true, checks }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
