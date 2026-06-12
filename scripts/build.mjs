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

function makeAbsoluteUrl(config, resourcePath = '') {
  return new URL(resourcePath.replace(/^\.\//, ''), config.siteUrl).href;
}

function makeSitePath(config, resourcePath = '') {
  const { pathname } = new URL(config.siteUrl);
  const basePath = pathname.endsWith('/') ? pathname : `${pathname}/`;
  const cleanResourcePath = resourcePath.replace(/^\/+/, '');

  return `${basePath}${cleanResourcePath}`.replace(/\/{2,}/g, '/');
}

const products = [
  {
    name: 'Строительные металлоконструкции',
    description: 'каркасы зданий, несущие элементы, балки, фермы и узлы для промышленного и коммерческого строительства',
    image: 'assets/generated/product-frame.webp'
  },
  {
    name: 'Закладные детали',
    description: 'серийные и нестандартные закладные элементы для монолитных, сборных и инфраструктурных объектов',
    image: 'assets/generated/product-embedded.webp'
  },
  {
    name: 'Лестницы металлические',
    description: 'марши, площадки, ограждения и эксплуатационные лестницы для производственных и общественных объектов',
    image: 'assets/generated/product-stairs.webp'
  },
  {
    name: 'Навесы',
    description: 'металлические навесы и пространственные конструкции для входных групп, складов и технологических зон',
    image: 'assets/generated/product-canopy.webp'
  },
  {
    name: 'Ворота',
    description: 'металлические ворота и рамные конструкции под производственные, складские и инфраструктурные задачи',
    image: 'assets/generated/product-gates.webp'
  },
  {
    name: 'Резервуары',
    description: 'металлические емкости и резервуары с расчетом узлов, обработкой и подготовкой к монтажу',
    image: 'assets/generated/product-tank.webp'
  },
  {
    name: 'Арочные конструкции',
    description: 'арочные металлоконструкции, фермы и нестандартные пространственные решения',
    image: 'assets/generated/product-arch.webp'
  },
  {
    name: 'Нестандартные конструкции',
    description: 'изготовление металлоконструкций по индивидуальному проекту, КМ и КМД',
    image: 'assets/generated/product-custom.webp'
  }
];

const services = [
  {
    name: 'Монтаж металлоконструкций',
    description: 'доставка, сборка и монтаж конструкций на объекте с учетом проектных узлов',
    image: 'assets/generated/service-montage.webp'
  },
  {
    name: 'Резка металла',
    description: 'подготовка листа, профиля и заготовок под серийные и нестандартные изделия',
    image: 'assets/generated/service-cutting.webp'
  },
  {
    name: 'Гибка металла',
    description: 'формирование деталей с контролем геометрии и дальнейшей сборкой',
    image: 'assets/generated/service-bending.webp'
  },
  {
    name: 'Металлообработка',
    description: 'сварка, сверление, зачистка, подготовка узлов и партий к покраске',
    image: 'assets/generated/service-machining.webp'
  },
  {
    name: 'Порошковая окраска',
    description: 'финишное покрытие для элементов, которым важны ресурс и внешний вид',
    image: 'assets/generated/service-powder.webp'
  }
];

const locations = [
  {
    name: 'Главный офис B2E',
    address: 'Санкт-Петербург, ул. Седова, 57, лит. В, помещ. 11-Н, ком. 3',
    coordinates: '59.879804, 30.425277'
  },
  {
    name: 'Производственная площадка Петрозаводск',
    address: 'Петрозаводск',
    coordinates: '61.7892210, 34.3688041'
  },
  {
    name: 'Производственная площадка Никольское',
    address: 'Ленинградская обл., Тосненский р-н, г. Никольское, Театральная ул., 6',
    coordinates: '59.7034799, 30.7861084'
  },
  {
    name: 'Производственная площадка Рыбацкое',
    address: 'Рыбацкое',
    coordinates: '59.8308399, 30.5002908'
  }
];

const clients = [
  'ООО «АГРОТОРГ»',
  'ООО «МАГНИТ»',
  'ООО «ГИПРОАВТОТРАНС»',
  'ГУП «ГОРЭЛЕКТРОТРАНС»',
  'ГУП «ВОДОКАНАЛ СПБ»',
  'ООО НПК «КАТАРСИС»'
];

const seoKeywords = [
  'производство металлоконструкций',
  'изготовление металлоконструкций',
  'металлоконструкции Санкт-Петербург',
  'металлоконструкции СЗФО',
  'металлоконструкции ЦФО',
  'строительные металлоконструкции',
  'закладные детали',
  'металлические лестницы',
  'навесы металлические',
  'ворота металлические',
  'резервуары металлические',
  'арочные конструкции',
  'нестандартные металлоконструкции',
  'монтаж металлоконструкций',
  'резка металла',
  'гибка металла',
  'металлообработка',
  'порошковая окраска',
  'КМ',
  'КМД'
];

const faqItems = [
  {
    question: 'Какие металлоконструкции производит B2E?',
    answer:
      'B2E производит строительные металлоконструкции, закладные детали, металлические лестницы, навесы, ворота, резервуары, арочные и нестандартные конструкции под проект.'
  },
  {
    question: 'Можно ли отправить на расчет КМ или КМД?',
    answer:
      'Да. Инженерный отдел разбирает исходные данные, КМ/КМД, узлы, допуски, покрытие, логистику и требования к монтажу до запуска металла в производство.'
  },
  {
    question: 'В каких регионах работает компания?',
    answer:
      'Основная география B2E - Санкт-Петербург, Ленинградская область, СЗФО и ЦФО. Производственные площадки указаны в Петрозаводске, Никольском и Рыбацком.'
  },
  {
    question: 'Какие операции доступны кроме изготовления?',
    answer:
      'В производственный контур входят монтаж металлоконструкций, резка металла, гибка металла, металлообработка и порошковая окраска.'
  },
  {
    question: 'Как быстрее передать задачу на расчет?',
    answer:
      'Нужно отправить заявку через форму сайта, MAX, телефон или email, приложив чертежи, описание объекта, сроки, требования к покрытию и монтажу.'
  }
];

const robotAgents = [
  'Googlebot',
  'Google-Extended',
  'Bingbot',
  'Yandex',
  'DuckDuckBot',
  'Applebot',
  'Slurp',
  'OAI-SearchBot',
  'GPTBot',
  'ChatGPT-User',
  'PerplexityBot',
  'Perplexity-User',
  'Applebot-Extended',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'CCBot',
  'Amazonbot',
  'Bytespider',
  'Meta-ExternalAgent',
  'Meta-ExternalFetcher',
  '*'
];

function formatPhoneDisplay(value) {
  const digits = String(value).replace(/\D/g, '');
  const normalized = digits.length === 11 && digits.startsWith('8') ? `7${digits.slice(1)}` : digits;

  if (normalized.length === 11 && normalized.startsWith('7')) {
    return `+7 (${normalized.slice(1, 4)}) ${normalized.slice(4, 7)}-${normalized.slice(7, 9)}-${normalized.slice(9, 11)}`;
  }

  if (normalized.length === 10) {
    return `+7 (${normalized.slice(0, 3)}) ${normalized.slice(3, 6)}-${normalized.slice(6, 8)}-${normalized.slice(8, 10)}`;
  }

  return String(value);
}

function makeConfig() {
  const defaultAddress = 'Санкт-Петербург, ул. Седова, 57, лит. В, помещ. 11-Н, ком. 3';
  const defaultMapPoint = encodeURIComponent('30.425277,59.879804');
  const defaultRouteUrl = 'https://yandex.ru/maps/?mode=routes&rtext=~59.879804%2C30.425277&rtt=auto';
  const phone = env('B2E_CONTACT_PHONE', '+79650578270');
  const phoneDisplay = formatPhoneDisplay(env('B2E_CONTACT_PHONE_DISPLAY', '+7 (965) 057-82-70'));
  const email = env('B2E_CONTACT_EMAIL', 'zakaz@b2energy.ru');
  const siteUrl = withTrailingSlash(
    env('B2E_SITE_URL', 'https://b2e-metallokonstrukcii.example/')
  );

  return {
    siteName: 'ООО B2E - производство металлоконструкций',
    siteUrl,
    phone,
    phoneDisplay,
    phoneHref: `tel:${phone.replace(/[^\d+]/g, '')}`,
    workHours: env('B2E_WORK_HOURS', 'Пн-Пт 09:00 - 18:00'),
    email,
    emailHref: `mailto:${email}`,
    maxUrl: env(
      'B2E_MAX_URL',
      'https://max.ru/u/f9LHodD0cOIq9CnGVeR2XIVeHPu_GpeOl3tdE_eGIeC3kbz6i8FikJr_4IM'
    ),
    address: env('B2E_ADDRESS', defaultAddress),
    yandexMapUrl: env(
      'B2E_YANDEX_MAP_URL',
      'https://yandex.ru/maps/-/CPSAzCMe'
    ),
    yandexRouteUrl: env('B2E_YANDEX_ROUTE_URL', defaultRouteUrl),
    yandexMapEmbedUrl: env(
      'B2E_YANDEX_MAP_EMBED_URL',
      `https://yandex.ru/map-widget/v1/?ll=${defaultMapPoint}&mode=whatshere&whatshere%5Bpoint%5D=${defaultMapPoint}&whatshere%5Bzoom%5D=17&z=17`
    ),
    rbcProfileUrl: env('B2E_RBC_PROFILE_URL', 'https://companies.rbc.ru/amp/ogrn/1247800091098/'),
    rusprofileUrl: env('B2E_RUSPROFILE_URL', 'https://www.rusprofile.ru/id/1247800091098'),
    catalogUrl: env('B2E_CATALOG_URL', './assets/documents/b2e-metallokonstrukcii-catalog.pdf'),
    leadEndpoint: env('B2E_LEAD_ENDPOINT', '/api/leads'),
    statsEndpoint: env('B2E_STATS_ENDPOINT', '/api/stats'),
    legalName: 'ООО «БИЗНЕС В ЭНЕРГЕТИКЕ»',
    inn: '7811801565',
    kpp: '781101001',
    ogrn: '1247800091098',
    generatedAt: new Date().toISOString()
  };
}

function makeConfigJs(config) {
  return `window.B2E_CONFIG = ${JSON.stringify(config, null, 2)};\n`;
}

function makeSitemap(config) {
  const today = new Date().toISOString().slice(0, 10);
  const images = [
    {
      image: 'assets/generated/b2e-dashboard-hero.webp',
      name: 'Производство металлоконструкций B2E',
      description: 'Темный industrial hero с металлоконструкциями, сваркой и производственным фоном B2E'
    },
    ...products,
    ...services
  ];
  const imageEntries = images
    .map(
      (item) => `    <image:image>
      <image:loc>${escapeXml(makeAbsoluteUrl(config, item.image))}</image:loc>
      <image:title>${escapeXml(item.name)}</image:title>
      <image:caption>${escapeXml(item.description)}</image:caption>
    </image:image>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${escapeXml(config.siteUrl)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
${imageEntries}
  </url>
</urlset>
`;
}

function makeRobots(config) {
  const publicPaths = [
    '',
    'index.html',
    'styles.css',
    'main.js',
    'config.js',
    'robots.txt',
    'sitemap.xml',
    'llms.txt',
    'ai-context.json',
    'assets/'
  ];
  const privatePaths = [
    '.git/',
    '.github/',
    '.env',
    'node_modules/',
    'worker/',
    'techtask/',
    'output/',
    'dist/',
    'package.json',
    'package-lock.json'
  ];
  const agentRules = [
    ...robotAgents.map((agent) => `User-agent: ${agent}`),
    ...publicPaths.map((resourcePath) => `Allow: ${makeSitePath(config, resourcePath)}`),
    ...privatePaths.map((resourcePath) => `Disallow: ${makeSitePath(config, resourcePath)}`)
  ];

  return `# robots.txt for ООО B2E
# Canonical: ${config.siteUrl}
# LLM guide: ${makeAbsoluteUrl(config, 'llms.txt')}

${agentRules.join('\n')}

Sitemap: ${makeAbsoluteUrl(config, 'sitemap.xml')}
`;
}

function makeStructuredData(config) {
  const organizationId = `${config.siteUrl}#organization`;
  const websiteId = `${config.siteUrl}#website`;
  const webpageId = `${config.siteUrl}#webpage`;
  const productsId = `${config.siteUrl}#products`;
  const servicesId = `${config.siteUrl}#services`;
  const faqId = `${config.siteUrl}#faq`;
  const logoUrl = makeAbsoluteUrl(config, 'assets/logo/logo-b2e.png');
  const heroImageUrl = makeAbsoluteUrl(config, 'assets/generated/b2e-dashboard-hero.webp');
  const areaServed = ['Санкт-Петербург', 'Ленинградская область', 'СЗФО', 'ЦФО'];
  const locationPlaces = locations.map((location) => {
    const [latitude, longitude] = location.coordinates.split(',').map((value) => Number(value.trim()));

    return {
      '@type': 'Place',
      name: location.name,
      address: location.address,
      geo: {
        '@type': 'GeoCoordinates',
        latitude,
        longitude
      }
    };
  });
  const productOffers = products.map((item, index) => ({
    '@type': 'Offer',
    position: index + 1,
    url: makeAbsoluteUrl(config, '#products'),
    itemOffered: {
      '@type': 'Product',
      name: item.name,
      description: item.description,
      image: makeAbsoluteUrl(config, item.image),
      brand: { '@id': organizationId },
      manufacturer: { '@id': organizationId },
      areaServed
    }
  }));
  const serviceOffers = services.map((item, index) => ({
    '@type': 'Offer',
    position: index + 1,
    url: makeAbsoluteUrl(config, '#services'),
    itemOffered: {
      '@type': 'Service',
      name: item.name,
      description: item.description,
      image: makeAbsoluteUrl(config, item.image),
      provider: { '@id': organizationId },
      areaServed
    }
  }));

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['Organization', 'LocalBusiness'],
        '@id': organizationId,
        name: 'ООО B2E',
        alternateName: ['B2E Металлоконструкции', config.legalName],
        legalName: config.legalName,
        url: config.siteUrl,
        logo: logoUrl,
        image: heroImageUrl,
        description:
          'Производство, проектирование, обработка, поставка и монтаж металлоконструкций для строительных, промышленных и инфраструктурных объектов.',
        slogan: 'Надежные металлоконструкции для сложных задач',
        taxID: config.inn,
        email: config.email,
        telephone: config.phone,
        openingHours: config.workHours,
        priceRange: 'по запросу',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Санкт-Петербург',
          streetAddress: config.address,
          addressCountry: 'RU'
        },
        geo: locationPlaces[0]?.geo,
        hasMap: config.yandexMapUrl,
        location: locationPlaces,
        sameAs: [config.maxUrl, config.rbcProfileUrl, config.rusprofileUrl].filter(Boolean),
        areaServed,
        knowsAbout: seoKeywords,
        contactPoint: [
          {
            '@type': 'ContactPoint',
            telephone: config.phone,
            email: config.email,
            contactType: 'sales',
            areaServed,
            availableLanguage: ['ru']
          }
        ],
        hasOfferCatalog: [
          {
            '@type': 'OfferCatalog',
            '@id': productsId,
            name: 'Каталог металлоконструкций B2E',
            itemListElement: productOffers
          },
          {
            '@type': 'OfferCatalog',
            '@id': servicesId,
            name: 'Услуги производства и монтажа металлоконструкций B2E',
            itemListElement: serviceOffers
          }
        ]
      },
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: config.siteUrl,
        name: config.siteName,
        inLanguage: 'ru-RU',
        publisher: { '@id': organizationId }
      },
      {
        '@type': 'WebPage',
        '@id': webpageId,
        url: config.siteUrl,
        name: 'Производство металлоконструкций СЗФО и ЦФО - ООО B2E',
        description:
          'ООО B2E производит строительные металлоконструкции, закладные детали, лестницы, навесы, ворота, резервуары и нестандартные конструкции.',
        inLanguage: 'ru-RU',
        isPartOf: { '@id': websiteId },
        about: { '@id': organizationId },
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: heroImageUrl,
          caption: 'Производство металлоконструкций B2E'
        },
        mainEntity: { '@id': organizationId },
        hasPart: [
          { '@type': 'WebPageElement', name: 'Каталог продукции', url: makeAbsoluteUrl(config, '#products') },
          { '@type': 'WebPageElement', name: 'Услуги', url: makeAbsoluteUrl(config, '#services') },
          { '@type': 'WebPageElement', name: 'Производство', url: makeAbsoluteUrl(config, '#production') },
          { '@type': 'WebPageElement', name: 'Проекты КМ/КМД', url: makeAbsoluteUrl(config, '#proof') },
          { '@type': 'WebPageElement', name: 'Частые вопросы', url: makeAbsoluteUrl(config, '#faq') },
          { '@type': 'WebPageElement', name: 'Контакты', url: makeAbsoluteUrl(config, '#contacts') }
        ]
      },
      {
        '@type': 'ItemList',
        '@id': `${config.siteUrl}#product-list`,
        name: 'Виды металлоконструкций B2E',
        itemListElement: products.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          url: makeAbsoluteUrl(config, '#products')
        }))
      },
      {
        '@type': 'ItemList',
        '@id': `${config.siteUrl}#service-list`,
        name: 'Производственные услуги B2E',
        itemListElement: services.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          url: makeAbsoluteUrl(config, '#services')
        }))
      },
      {
        '@type': 'FAQPage',
        '@id': faqId,
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer
          }
        }))
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${config.siteUrl}#breadcrumbs`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Главная',
            item: config.siteUrl
          }
        ]
      }
    ]
  };
}

function makeStructuredDataScript(config) {
  return `    <script type="application/ld+json">${JSON.stringify(makeStructuredData(config))}</script>`;
}

function makeIndexHtml(source, config) {
  const imageUrl = new URL('./assets/generated/b2e-dashboard-hero.webp', config.siteUrl).href;
  let html = source
    .replace(
      /<link rel="canonical" href="[^"]+">/,
      `<link rel="canonical" href="${config.siteUrl}">`
    )
    .replace(
      /<link rel="alternate" hreflang="ru-RU" href="[^"]+">/,
      `<link rel="alternate" hreflang="ru-RU" href="${config.siteUrl}">`
    )
    .replace(
      /<link rel="alternate" hreflang="x-default" href="[^"]+">/,
      `<link rel="alternate" hreflang="x-default" href="${config.siteUrl}">`
    )
    .replace(
      /<meta property="og:image" content="[^"]+">/,
      `<meta property="og:image" content="${imageUrl}">`
    )
    .replace(
      /<meta property="og:image:secure_url" content="[^"]+">/,
      `<meta property="og:image:secure_url" content="${imageUrl}">`
    )
    .replace(
      /<meta name="twitter:image" content="[^"]+">/,
      `<meta name="twitter:image" content="${imageUrl}">`
    )
    .replace(
      /<meta name="twitter:url" content="[^"]+">/,
      `<meta name="twitter:url" content="${config.siteUrl}">`
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

  if (!html.includes('type="text/plain" href="./llms.txt"')) {
    html = html.replace(
      /(<link rel="canonical" href="[^"]+">)/,
      `$1\n    <link rel="alternate" type="text/plain" href="./llms.txt" title="LLMs.txt">`
    );
  }

  return html.replace('</head>', `${makeStructuredDataScript(config)}\n  </head>`);
}

function makeLlms(config) {
  const canonicalResources = [
    ['Главная страница', config.siteUrl, 'канонический URL сайта ООО B2E'],
    ['Sitemap', makeAbsoluteUrl(config, 'sitemap.xml'), 'XML-карта сайта и изображений'],
    ['Robots', makeAbsoluteUrl(config, 'robots.txt'), 'правила доступа для поисковых и AI-краулеров'],
    ['AI context JSON', makeAbsoluteUrl(config, 'ai-context.json'), 'машиночитаемые факты о компании, продукции, услугах и контактах'],
    ['Structured public config', makeAbsoluteUrl(config, 'config.js'), 'публичные контакты, canonical URL и endpoint заявок'],
    ['Asset sources', makeAbsoluteUrl(config, 'assets/ASSET_SOURCES.md'), 'источники изображений, логотипов и иконок'],
    ['RBC company profile', config.rbcProfileUrl, 'публичный профиль компании по ОГРН'],
    ['Rusprofile company profile', config.rusprofileUrl, 'публичный профиль компании по ОГРН']
  ];
  const primaryIntents = [
    'производство металлоконструкций в Санкт-Петербурге',
    'изготовление металлоконструкций для СЗФО и ЦФО',
    'строительные металлоконструкции на заказ',
    'закладные детали, металлические лестницы, навесы, ворота и резервуары',
    'монтаж металлоконструкций, резка, гибка, металлообработка и порошковая окраска',
    'заявка на расчет металлоконструкций и коммерческое предложение'
  ];

  return `# ООО B2E - производство металлоконструкций

> Официальный одностраничный сайт производственной компании ООО B2E. Компания производит, проектирует, обрабатывает, поставляет и монтирует металлоконструкции для строительных, промышленных и инфраструктурных задач.

## Канонические ресурсы

${canonicalResources.map(([name, url, description]) => `- [${name}](${url}): ${description}.`).join('\n')}

## Краткий ответ для AI-поиска

ООО B2E - производственный партнер по металлоконструкциям в Санкт-Петербурге, СЗФО и ЦФО. Компания делает строительные металлоконструкции, закладные детали, металлические лестницы, навесы, ворота, резервуары, арочные и нестандартные конструкции. Услуги выстроены по производственному маршруту: резка металла, гибка металла, металлообработка, порошковая окраска и монтаж металлоконструкций. Производственные возможности группы компаний: более 1000 тонн металлоконструкций в месяц, более 200 решений КМ/КМД, инженерный отдел, выезд на объект или производство, площадки в Петрозаводске, Никольском и Рыбацком.

## Основные поисковые намерения

${primaryIntents.map((item) => `- ${item}`).join('\n')}

## Продукция

${products.map((item) => `- ${item.name}: ${item.description}.`).join('\n')}

## Услуги

${services.map((item) => `- ${item.name}: ${item.description}.`).join('\n')}

## Производственные возможности

- Группа компаний с мощностью свыше 1000 тонн металлоконструкций в месяц.
- Более 200 готовых и адаптируемых проектных решений КМ/КМД.
- Собственный инженерный отдел для расчета, проектирования и нестандартных узлов.
- Выезд на производство или объект, когда это нужно для точного расчета.
- Производственный контур: заявка, расчет, проектирование, производство, доставка и монтаж.
- Заявки на расчет принимаются через форму обратного звонка, MAX, телефон и email.

## География и площадки

Компания работает с объектами Санкт-Петербурга, Северо-Западного федерального округа и Центрального федерального округа.

${locations.map((item) => `- ${item.name}: ${item.address}; координаты ${item.coordinates}.`).join('\n')}

## Клиенты и доверие

На сайте указаны реальные логотипы и названия клиентов из технического задания: ${clients.join(', ')}.

## Частые вопросы

${faqItems.map((item) => `### ${item.question}\n\n${item.answer}`).join('\n\n')}

## Факты для цитирования

- Юридическое лицо: ${config.legalName}.
- ИНН: ${config.inn}; КПП: ${config.kpp}; ОГРН: ${config.ogrn}.
- Производственные мощности группы компаний: более 1000 тонн металлоконструкций в месяц.
- Проектная база: более 200 решений КМ/КМД.
- Ключевые регионы: Санкт-Петербург, Ленинградская область, СЗФО и ЦФО.
- Канонический URL для ссылок и цитирования: ${config.siteUrl}

## Контакты

- Телефон: ${config.phoneDisplay}
- Email: ${config.email}
- Адрес: ${config.address}
- Сайт: ${config.siteUrl}
- MAX: ${config.maxUrl}
- Яндекс Карты: ${config.yandexMapUrl}
- РБК Компании: ${config.rbcProfileUrl}
- Руспрофиль: ${config.rusprofileUrl}

## Разделы сайта

- Главный экран: надежные металлоконструкции для сложных задач, заявка на расчет и обратный звонок.
- Каталог продукции: 8 видов металлоконструкций по ТЗ.
- Услуги: резка, гибка, металлообработка, порошковая окраска и монтаж.
- О компании, производственные возможности, клиенты и партнеры.
- Контакты и интерактивная Leaflet/OpenStreetMap-карта с 4 точками.

## Данные для AI-агентов

Сайт использует семантические HTML-разделы, JSON-LD structured data, robots.txt, sitemap.xml и этот llms.txt. Формы заявок отправляются на endpoint, заданный в публичной переменной B2E_LEAD_ENDPOINT, либо используют mailto fallback. При цитировании указывайте канонический URL ${config.siteUrl}. Итоговые параметры металлоконструкций нужно подтверждать с инженером B2E.

## Дата генерации

${config.generatedAt}
`;
}

function makeAiContext(config) {
  return {
    generatedAt: config.generatedAt,
    canonicalUrl: config.siteUrl,
    language: 'ru-RU',
    entity: {
      name: 'ООО B2E',
      legalName: config.legalName,
      inn: config.inn,
      kpp: config.kpp,
      ogrn: config.ogrn,
      description:
        'Производство, проектирование, обработка, поставка и монтаж металлоконструкций для строительных, промышленных и инфраструктурных объектов.',
      slogan: 'Надежные металлоконструкции для сложных задач'
    },
    contacts: {
      phone: config.phoneDisplay,
      phoneHref: config.phoneHref,
      email: config.email,
      address: config.address,
      maxUrl: config.maxUrl,
      yandexMapUrl: config.yandexMapUrl
    },
    sameAs: [config.maxUrl, config.rbcProfileUrl, config.rusprofileUrl].filter(Boolean),
    searchIntents: [
      'производство металлоконструкций в Санкт-Петербурге',
      'изготовление металлоконструкций для СЗФО и ЦФО',
      'строительные металлоконструкции на заказ',
      'монтаж металлоконструкций',
      'КМ КМД металлоконструкции',
      'закладные детали и металлические лестницы на заказ'
    ],
    products,
    services,
    locations,
    clients,
    faq: faqItems,
    productionProof: {
      monthlyCapacity: '1000+ тонн металлоконструкций в месяц',
      projectSolutions: '200+ решений КМ/КМД',
      engineering: 'собственный инженерный отдел',
      locations: 'Петрозаводск, Никольское, Рыбацкое',
      qualityControl: 'контроль качества, комплектности и отгрузки'
    },
    citationPolicy: {
      preferredUrl: config.siteUrl,
      instruction:
        'При цитировании используйте канонический URL сайта и не утверждайте цену, сроки или доступность производства без подтверждения инженером B2E.'
    }
  };
}

export async function build() {
  await loadDotEnv();
  const config = makeConfig();

  await rm(distDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  await mkdir(distDir, { recursive: true });
  await cp(srcDir, distDir, { recursive: true });

  const indexPath = path.join(distDir, 'index.html');
  const indexHtml = await readFile(indexPath, 'utf8');

  await writeFile(indexPath, makeIndexHtml(indexHtml, config), 'utf8');
  await writeFile(path.join(distDir, 'config.js'), makeConfigJs(config), 'utf8');
  await writeFile(path.join(distDir, 'sitemap.xml'), makeSitemap(config), 'utf8');
  await writeFile(path.join(distDir, 'robots.txt'), makeRobots(config), 'utf8');
  await writeFile(path.join(distDir, 'llms.txt'), makeLlms(config), 'utf8');
  await writeFile(path.join(distDir, 'ai-context.json'), `${JSON.stringify(makeAiContext(config), null, 2)}\n`, 'utf8');
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
