import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { build } from '../scripts/build.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const envKeys = [
  'B2E_SITE_URL',
  'B2E_CONTACT_PHONE',
  'B2E_CONTACT_PHONE_DISPLAY',
  'B2E_CONTACT_EMAIL',
  'B2E_MAX_URL',
  'B2E_ADDRESS',
  'B2E_YANDEX_MAP_URL',
  'B2E_YANDEX_MAP_EMBED_URL',
  'B2E_LEAD_ENDPOINT'
];

function parseConfigJs(source) {
  const match = source.match(/^window\.B2E_CONFIG = ([\s\S]*);\s*$/);
  assert.ok(match, 'config.js must assign window.B2E_CONFIG');
  return JSON.parse(match[1]);
}

test('build writes config, sitemap, robots and llms from environment', async () => {
  const previousEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));

  Object.assign(process.env, {
    B2E_SITE_URL: 'https://example.test/metallokonstrukcii-site',
    B2E_CONTACT_PHONE: '+79990000000',
    B2E_CONTACT_PHONE_DISPLAY: '+7 999 000 00 00',
    B2E_CONTACT_EMAIL: 'lead@example.test',
    B2E_MAX_URL: 'https://max.ru/example',
    B2E_ADDRESS: 'Saint Petersburg, Test 1',
    B2E_YANDEX_MAP_URL: 'https://yandex.ru/maps/?text=test',
    B2E_YANDEX_MAP_EMBED_URL: 'https://yandex.ru/map-widget/v1/?text=test',
    B2E_LEAD_ENDPOINT: 'https://b2e-leads.example.workers.dev'
  });

  try {
    await build();

    const [indexHtml, configJs, sitemap, robots, llms] = await Promise.all([
      readFile(path.join(rootDir, 'dist/index.html'), 'utf8'),
      readFile(path.join(rootDir, 'dist/config.js'), 'utf8'),
      readFile(path.join(rootDir, 'dist/sitemap.xml'), 'utf8'),
      readFile(path.join(rootDir, 'dist/robots.txt'), 'utf8'),
      readFile(path.join(rootDir, 'dist/llms.txt'), 'utf8')
    ]);
    const config = parseConfigJs(configJs);

    assert.equal(config.siteUrl, 'https://example.test/metallokonstrukcii-site/');
    assert.equal(config.phoneHref, 'tel:+79990000000');
    assert.equal(config.emailHref, 'mailto:lead@example.test');
    assert.equal(config.leadEndpoint, 'https://b2e-leads.example.workers.dev');
    assert.match(indexHtml, /<link rel="canonical" href="https:\/\/example\.test\/metallokonstrukcii-site\/">/);
    assert.match(indexHtml, /<meta property="og:url" content="https:\/\/example\.test\/metallokonstrukcii-site\/">/);
    assert.match(indexHtml, /<meta property="og:image" content="https:\/\/example\.test\/metallokonstrukcii-site\/assets\/metal-production-hero\.png">/);
    assert.match(indexHtml, /<link rel="alternate" type="text\/plain" href="\.\/llms\.txt" title="LLMs\.txt">/);
    assert.match(indexHtml, /<script type="application\/ld\+json">/);
    assert.match(sitemap, /https:\/\/example\.test\/metallokonstrukcii-site\//);
    assert.match(robots, /Sitemap: https:\/\/example\.test\/metallokonstrukcii-site\/sitemap\.xml/);
    assert.match(llms, /lead@example\.test/);
  } finally {
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
});
