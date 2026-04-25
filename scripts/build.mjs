import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(rootDir, 'src');
const distDir = path.join(rootDir, 'dist');

function env(name, fallback = '') {
  const value = process.env[name];
  return value === undefined || value === '' ? fallback : value;
}

async function loadDotEnv() {
  try {
    const text = await readFile(path.join(rootDir, '.env'), 'utf8');

    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();

      if (!line || line.startsWith('#')) {
        continue;
      }

      const separatorIndex = line.indexOf('=');
      if (separatorIndex === -1) {
        continue;
      }

      const key = line.slice(0, separatorIndex).trim();
      let value = line.slice(separatorIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

function withTrailingSlash(value) {
  return value.endsWith('/') ? value : `${value}/`;
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function makeConfig() {
  const defaultAddress = 'Санкт-Петербург, ул. Седова, 57, лит. В, помещ. 11-Н, ком. 3';
  const defaultMapText = encodeURIComponent(defaultAddress);
  const phone = env('B2E_CONTACT_PHONE', '+79650578270');
  const phoneDisplay = env('B2E_CONTACT_PHONE_DISPLAY', '+7 965 057 82 70');
  const email = env('B2E_CONTACT_EMAIL', 'zakaz@b2energy.ru');
  const siteUrl = withTrailingSlash(
    env('B2E_SITE_URL', 'https://efnatii.github.io/metallokonstrukcii-site/')
  );

  return {
    siteName: 'ООО B2E - производство металлоконструкций',
    siteUrl,
    phone,
    phoneDisplay,
    phoneHref: `tel:${phone.replace(/[^\d+]/g, '')}`,
    email,
    emailHref: `mailto:${email}`,
    maxUrl: env('B2E_MAX_URL', 'https://max.ru/'),
    address: env('B2E_ADDRESS', defaultAddress),
    yandexMapUrl: env(
      'B2E_YANDEX_MAP_URL',
      `https://yandex.ru/maps/?text=${defaultMapText}`
    ),
    yandexMapEmbedUrl: env(
      'B2E_YANDEX_MAP_EMBED_URL',
      `https://yandex.ru/map-widget/v1/?mode=search&text=${defaultMapText}&z=15`
    ),
    leadEndpoint: env('B2E_LEAD_ENDPOINT', ''),
    generatedAt: new Date().toISOString()
  };
}

function makeConfigJs(config) {
  return `window.B2E_CONFIG = ${JSON.stringify(config, null, 2)};\n`;
}

function makeSitemap(config) {
  const today = new Date().toISOString().slice(0, 10);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${escapeXml(config.siteUrl)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;
}

function makeRobots(config) {
  return `User-agent: *
Allow: /

Sitemap: ${config.siteUrl}sitemap.xml
`;
}

function makeStructuredData(config) {
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'LocalBusiness'],
    name: 'ООО B2E',
    legalName: 'ООО B2E',
    url: config.siteUrl,
    email: config.email,
    telephone: config.phone,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Санкт-Петербург',
      streetAddress: config.address,
      addressCountry: 'RU'
    },
    areaServed: ['СЗФО', 'ЦФО'],
    makesOffer: [
      'Строительные металлоконструкции',
      'Закладные детали',
      'Лестницы металлические',
      'Навесы',
      'Ворота',
      'Резервуары',
      'Арочные конструкции',
      'Нестандартные конструкции',
      'Монтаж металлоконструкций',
      'Резка металла',
      'Гибка металла',
      'Металлообработка',
      'Порошковая окраска'
    ]
  };
}

function makeStructuredDataScript(config) {
  return `    <script type="application/ld+json">${JSON.stringify(makeStructuredData(config))}</script>`;
}

function makeIndexHtml(source, config) {
  const imageUrl = new URL('./assets/metal-production-hero.png', config.siteUrl).href;
  let html = source
    .replace(
      /<link rel="canonical" href="[^"]+">/,
      `<link rel="canonical" href="${config.siteUrl}">`
    )
    .replace(
      /<meta property="og:image" content="[^"]+">/,
      `<meta property="og:image" content="${imageUrl}">`
    )
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, '');

  if (html.includes('<meta property="og:url"')) {
    html = html.replace(
      /<meta property="og:url" content="[^"]+">/,
      `<meta property="og:url" content="${config.siteUrl}">`
    );
  } else {
    html = html.replace(
      /(<meta property="og:type" content="website">)/,
      `$1\n    <meta property="og:url" content="${config.siteUrl}">`
    );
  }

  if (!html.includes('rel="alternate"') || !html.includes('llms.txt')) {
    html = html.replace(
      /(<link rel="canonical" href="[^"]+">)/,
      `$1\n    <link rel="alternate" type="text/plain" href="./llms.txt" title="LLMs.txt">`
    );
  }

  return html.replace('</head>', `${makeStructuredDataScript(config)}\n  </head>`);
}

function makeLlms(config) {
  return `# ООО B2E - производство металлоконструкций

> Одностраничный сайт производственной компании: строительные металлоконструкции, закладные детали, металлические лестницы, навесы, ворота, резервуары, арочные и нестандартные конструкции.

## Контакты

- Телефон: ${config.phoneDisplay}
- Email: ${config.email}
- Адрес: ${config.address}
- Сайт: ${config.siteUrl}

## Возможности

- Производственные мощности группы компаний свыше 1000 тонн металлоконструкций в месяц.
- Производственные площадки: Петрозаводск, Никольское, Рыбацкое.
- Карта контактов переключает главный офис и производственные направления по площадкам.
- Более 200 готовых проектных решений КМ и КМД.
- Собственный инженерный отдел и организация выезда на объект.
- Онлайн-калькулятор ориентировочного тоннажа здания.

## Разделы сайта

- Главный экран с заявкой на расчет и обратный звонок.
- Каталог металлоконструкций и услуг.
- Калькулятор тоннажа.
- О компании и производственные возможности.
- Производственные фото, клиенты и партнеры.
- Контакты и карта.

## Данные для AI-агентов

Сайт использует семантические HTML-разделы, JSON-LD structured data, robots.txt, sitemap.xml и этот llms.txt. Формы заявок отправляются на endpoint, заданный в переменной B2E_LEAD_ENDPOINT, либо используют mailto fallback.
`;
}

export async function build() {
  await loadDotEnv();
  const config = makeConfig();

  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });
  await cp(srcDir, distDir, { recursive: true });

  const indexPath = path.join(distDir, 'index.html');
  const indexHtml = await readFile(indexPath, 'utf8');

  await writeFile(indexPath, makeIndexHtml(indexHtml, config), 'utf8');
  await writeFile(path.join(distDir, 'config.js'), makeConfigJs(config), 'utf8');
  await writeFile(path.join(distDir, 'sitemap.xml'), makeSitemap(config), 'utf8');
  await writeFile(path.join(distDir, 'robots.txt'), makeRobots(config), 'utf8');
  await writeFile(path.join(distDir, 'llms.txt'), makeLlms(config), 'utf8');
  await writeFile(path.join(distDir, '.nojekyll'), '', 'utf8');

  console.log(`Built ${distDir}`);
  console.log(`Site URL: ${config.siteUrl}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  build().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
