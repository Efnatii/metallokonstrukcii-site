import fs from 'node:fs';
import path from 'node:path';

const read = (filePath) => fs.readFileSync(filePath, 'utf8');
const readOptional = (filePath) => fs.existsSync(filePath) ? read(filePath) : '';

const html = read('src/index.html');
const styles = read('src/styles.css');
const main = read('src/main.js');
const configJs = read('src/config.js');
const envExample = read('.env.example');
const deployWorkflow = read('.github/workflows/pages.yml');
const workerWorkflow = readOptional('.github/workflows/worker.yml');
const rootWrangler = readOptional('wrangler.jsonc');
const workerWrangler = readOptional('worker/wrangler.jsonc');
const yandexGateway = read('yandex/gateway/openapi.yaml');
const yandexFunction = read('yandex/function/index.mjs');
const yandexDeploy = read('scripts/Deploy-YandexCloud.ps1');
const rootPackage = read('package.json');
const workerPackage = read('worker/package.json');
const distHtml = read('dist/index.html');

const products = [
  'Строительные металлоконструкции',
  'Закладные детали',
  'Лестницы металлические',
  'Навесы',
  'Ворота',
  'Резервуары',
  'Арочные конструкции',
  'Нестандартные конструкции'
];

const services = [
  'Монтаж металлоконструкций',
  'Резка металла',
  'Гибка металла',
  'Металлообработка',
  'Порошковая окраска'
];

const clients = [
  'ООО «АГРОТОРГ»',
  'ООО «МАГНИТ»',
  'ООО «ГИПРОАВТОТРАНС»',
  'ГУП «ГОРЭЛЕКТРОТРАНС»',
  'ГУП «ВОДОКАНАЛ СПБ»',
  'ООО НПК «КАТАРСИС»'
];

const publicVars = [
  'B2E_SITE_URL',
  'B2E_CONTACT_PHONE',
  'B2E_CONTACT_PHONE_DISPLAY',
  'B2E_WORK_HOURS',
  'B2E_CONTACT_EMAIL',
  'B2E_MAX_URL',
  'B2E_ADDRESS',
  'B2E_YANDEX_MAP_URL',
  'B2E_YANDEX_ROUTE_URL',
  'B2E_YANDEX_MAP_EMBED_URL',
  'B2E_RBC_PROFILE_URL',
  'B2E_RUSPROFILE_URL',
  'B2E_CATALOG_URL',
  'B2E_LEAD_ENDPOINT',
  'B2E_STATS_ENDPOINT',
  'YANDEX_SITE_BUCKET',
  'YANDEX_STATS_BUCKET',
  'YANDEX_FUNCTION_NAME',
  'YANDEX_GATEWAY_NAME',
  'YANDEX_SERVICE_ACCOUNT_NAME',
  'YANDEX_SECRET_NAME',
  'YANDEX_CUSTOM_DOMAIN',
  'YANDEX_CERTIFICATE_ID'
];

const privateSecrets = [
  'YC_SERVICE_ACCOUNT_KEY_JSON',
  'YC_CLOUD_ID',
  'YC_FOLDER_ID',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_SECURE',
  'SMTP_USERNAME',
  'SMTP_PASSWORD',
  'SMTP_FROM',
  'SMTP_FROM_NAME',
  'SMTP_ENVELOPE_FROM',
  'SMTP_TO',
  'LEAD_WEBHOOK_URL',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_CHAT_ID',
  'SMARTCAPTCHA_SERVER_KEY'
];

function extractBetween(source, start, end) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  return from >= 0 && to >= 0 ? source.slice(from, to) : '';
}

function extractTexts(source, pattern) {
  return [...source.matchAll(pattern)].map((match) => match[1].replace(/<[^>]+>/g, '').trim());
}

function hasAll(source, values) {
  return values.every((value) => source.includes(value));
}

function check(name, ok, evidence) {
  return { name, ok: Boolean(ok), evidence };
}

const dropdown = extractBetween(
  html,
  '<div class="dropdown" aria-label="Виды металлоконструкций">',
  '</div>'
);
const modalSelect = extractBetween(html, '<select name="objectType">', '</select>');
const footer = html.match(/<footer class="site-footer"[^>]*>[\s\S]*?<\/footer>/)?.[0] || '';
const productTitles = extractTexts(html, /<(?:article|button)\b[^>]*class="product-card[^"]*"[^>]*>[\s\S]*?<h3>([\s\S]*?)<\/h3>/g);
const serviceTitles = extractTexts(html, /<article class="service-card[^"]*">[\s\S]*?<h3>([\s\S]*?)<\/h3>/g);
const dropdownProducts = extractTexts(dropdown, /<a href="#products">([^<]+)<\/a>/g);
const modalOptions = extractTexts(modalSelect, /<option>([^<]+)<\/option>/g);
const localRefs = [
  ...html.matchAll(/(?:src|href)="\.\/([^"#?]+\.(?:png|webp|jpg|jpeg|pdf|html|ico|webmanifest|txt|xml|js|css|md))"/g)
].map((match) => match[1]);
const srcsetRefs = [...html.matchAll(/srcset="([^"]+)"/g)].flatMap((match) =>
  match[1].split(',').map((entry) => entry.trim().split(/\s+/)[0].replace(/^\.\//, ''))
);
const missingRefs = [...new Set([...localRefs, ...srcsetRefs])].filter((assetPath) => {
  if (['styles.css', 'main.js', 'config.js', 'robots.txt', 'sitemap.xml', 'llms.txt'].includes(assetPath)) {
    return !fs.existsSync(path.join('dist', assetPath));
  }
  return !fs.existsSync(path.join('src', assetPath)) && !fs.existsSync(path.join('dist', assetPath));
});

const checks = [
  check(
    'Одностраничный сайт ООО B2E о производстве металлоконструкций',
    html.includes('<main>') && html.includes('ООО B2E') && html.includes('Производство металлоконструкций'),
    'main + B2E + hero'
  ),
  check(
    'Логотип в шапке и подпись СЗФО/ЦФО',
    html.includes('class="brand-logo"') && html.includes('Производство Металлоконструкций СЗФО, ЦФО'),
    'brand-logo + header text'
  ),
  check(
    'Выпадающий список продукции строго по ТЗ',
    JSON.stringify(dropdownProducts) === JSON.stringify(products),
    dropdownProducts.join(' | ')
  ),
  check('Каталог из 8 позиций строго по ТЗ', JSON.stringify(productTitles) === JSON.stringify(products), productTitles.join(' | ')),
  check('Список услуг строго по ТЗ', JSON.stringify(serviceTitles) === JSON.stringify(services), serviceTitles.join(' | ')),
  check(
    'Верхняя шапка содержит телефон, email и MAX',
    html.includes('+7 (965) 057-82-70') && html.includes('zakaz@b2energy.ru') && html.includes('max-link') && html.includes('max-logo.png'),
    'phone + email + MAX'
  ),
  check(
    'Callback форма универсальная и содержит success-state',
    hasAll(html, ['name="name"', 'name="phone"', 'name="message"', 'name="objectType"', 'Оставить заявку', 'Заявка принята', 'В ближайшее время с вами свяжутся']),
    'name + contact + task + hidden objectType + success copy'
  ),
  check(
    'Раздел калькулятора тоннажа полностью удален',
    !html.includes('id="calculator"') &&
      !html.includes('tonnageCalculator') &&
      !html.includes('href="#calculator"') &&
      !html.includes('Калькулятор тоннажа') &&
      !html.includes('Расчет тоннажа') &&
      !main.includes('setupCalculator') &&
      !main.includes('tonnageCalculator'),
    'no calculator section, nav link, modal option or JS'
  ),
  check(
    'Контакты: Седова 57 лит В, телефон, email, маршрут Яндекс',
    hasAll(html, ['Седова, 57, лит. В', '+7 (965) 057-82-70', 'zakaz@b2energy.ru', 'Построить в Яндекс Картах', 'mode=routes', 'https://yandex.ru/maps/-/CPSAzCMe']),
    'contact card + route'
  ),
  check(
    'Публичные профили сохранены в конфигурации, но скрыты из контента',
    hasAll(configJs, ['https://companies.rbc.ru/amp/ogrn/1247800091098/', 'https://www.rusprofile.ru/id/1247800091098']) &&
      !html.includes('РБК Компании') &&
      !html.includes('Руспрофиль'),
    'RBC + Rusprofile in config only'
  ),
  check(
    'Карта интерактивная: офис точкой, площадки областями и сложная зона покрытия',
    (html.match(/data-map-key=/g) || []).length === 5 &&
      (html.match(/data-map-area="true"/g) || []).length === 4 &&
      html.includes('leaflet') &&
      hasAll(html, ['office', 'petrozavodsk', 'nikolskoe', 'rybatskoe', 'coverage']) &&
      main.includes('fitBounds') &&
      main.includes('L.rectangle') &&
      main.includes('L.geoJSON') &&
      html.includes('data-map-geojson="./assets/data/coverage-szfo-cfo.geojson"') &&
      !html.includes('data-map-key="petrozavodsk" data-map-lat') &&
      !html.includes('mode=whatshere&whatshere%5Bpoint%5D=34.3688041') &&
      !html.includes('mode=whatshere&whatshere%5Bpoint%5D=30.7861084') &&
      !html.includes('mode=whatshere&whatshere%5Bpoint%5D=30.5002908'),
    `${(html.match(/data-map-key=/g) || []).length} map controls + 4 area controls + Leaflet rectangles/GeoJSON`
  ),
  check(
    'Площадки показываются областями без точечных Яндекс whatshere-ссылок',
    hasAll(html, ['г. Никольское, Театральная ул., 6', 'data-map-area="true"', 'data-map-coverage="true"', 'Санкт-Петербург, Ленинградская область, СЗФО и ЦФО']) &&
      hasAll(main, ['location.area', 'Область:', 'activeMapMode']) &&
      !html.includes('whatshere%5Bpoint%5D=34.3688041') &&
      !html.includes('whatshere%5Bpoint%5D=30.7861084') &&
      !html.includes('whatshere%5Bpoint%5D=30.5002908'),
    'production locations are area controls'
  ),
  check('Площадки из ТЗ указаны', hasAll(html, ['Петрозаводск', 'Никольское', 'Рыбацкое']), '3 production locations'),
  check(
    'Группа компаний, 1000+ т/мес, 200+ КМ/КМД, инженерный отдел, выезд, 3 площадки, контроль',
    hasAll(html, ['группы компаний', '1000+ т/мес', '200+ КМ/КМД', 'Инженерный отдел', 'Выезд на объект', '3 площадки', '100% контроль']),
    'capacity panel proof points'
  ),
  check(
    'Клиенты из ТЗ и реальные логотипы PNG',
    hasAll(html, clients) && fs.readdirSync('src/assets/clients').filter((file) => file.endsWith('.png') && !file.includes('@')).length >= clients.length,
    clients.join(' | ')
  ),
  check(
    'Плавающие иконки: телефон 5с, MAX 10с, раскрытие 25с и hover',
    main.includes('5000') &&
      main.includes('10000') &&
      main.includes('25000') &&
      html.includes('phone-float') &&
      html.includes('max-float') &&
      styles.includes('.phone-float:hover'),
    'timers + float buttons + hover expansion'
  ),
  check(
    'Цветовая схема черный/желтый/белый из корпоративного ТЗ',
    styles.includes('--accent: #ffc400') && styles.includes('--bg: #070a0c') && styles.includes('--white: #f8fafb'),
    'CSS tokens'
  ),
  check(
    'AI/SEO доступность: JSON-LD, robots, sitemap, llms',
    distHtml.includes('application/ld+json') &&
      ['dist/robots.txt', 'dist/sitemap.xml', 'dist/llms.txt', 'dist/ai-context.json', 'dist/config.js', 'dist/.nojekyll'].every((file) => fs.existsSync(file)) &&
      read('dist/llms.txt').includes('ООО B2E') &&
      read('dist/ai-context.json').includes('"canonicalUrl"') &&
      distHtml.includes('FAQPage'),
    'dist robots/sitemap/llms/ai-context/config + JSON-LD graph'
  ),
  check(
    'Каталог помечен неактивным, пока нет финального каталога',
    html.includes('btn btn-ghost is-disabled') &&
      html.includes('Скачать каталог') &&
      html.includes('text-link is-disabled') &&
      html.includes('Смотреть весь каталог') &&
      !html.includes('download="b2e-metallokonstrukcii-catalog.pdf"'),
    'disabled hero/catalog CTA'
  ),
  check(
    'Footer содержит публичные ссылки, copyright и посещаемость',
    hasAll(footer, ['robots.txt', 'sitemap.xml', 'llms.txt', '©', 'ИНН 7811801565', 'КПП 781101001', 'ОГРН 1247800091098']) &&
      hasAll(footer, ['Посещаемость сайта', 'Сегодня', '7 дней', '30 дней', 'Все время']) &&
      !hasAll(footer, ['config.js']) &&
      !footer.includes('Каталог PDF') &&
      !footer.includes('ASSET_SOURCES.md'),
    'footer public links + legal lines + copyright + visit stats'
  ),
  check(
    'Публичные env переменные рассортированы',
    publicVars.every((value) => envExample.includes(value)) &&
      envExample.includes('B2E_LEAD_ENDPOINT=/api/leads') &&
      envExample.includes('B2E_STATS_ENDPOINT=/api/stats') &&
      deployWorkflow.includes('vars.YANDEX_CUSTOM_DOMAIN') &&
      !deployWorkflow.includes('secrets.B2E_LEAD_ENDPOINT') &&
      !deployWorkflow.includes('secrets.B2E_STATS_ENDPOINT'),
    'Yandex public vars + relative API endpoints'
  ),
  check(
    'Приватные secrets рассортированы и монтируются в Yandex Function',
    privateSecrets.every((value) => envExample.includes(value)) &&
      ['YC_SERVICE_ACCOUNT_KEY_JSON', 'YC_CLOUD_ID', 'YC_FOLDER_ID'].every((value) => deployWorkflow.includes(`secrets.${value}`)) &&
      yandexDeploy.includes('lockbox') &&
      yandexDeploy.includes('--secret') &&
      yandexDeploy.includes('Function-SecretArgs') &&
      read('worker/src/index.js').includes('sendSmtp'),
    'GitHub Secrets -> yc profile; Lockbox -> Function env + SMTP'
  ),
  check(
    'Yandex API Gateway публикует сайт и backend',
    yandexGateway.includes('type: object_storage') &&
      yandexGateway.includes('type: cloud_functions') &&
      yandexGateway.includes('/api/{proxy+}') &&
      yandexFunction.includes('SOCKET_CONNECT') &&
      yandexFunction.includes('SITE_STATS_KV'),
    'API Gateway object_storage + cloud_functions; Function adapter'
  ),
  check(
    'Cloudflare deploy отключен из активного main-пути',
    !rootWrangler &&
      !workerWrangler &&
      !workerWorkflow &&
      !deployWorkflow.includes('wrangler') &&
      !deployWorkflow.includes('Cloudflare') &&
      !rootPackage.includes('worker:deploy') &&
      !workerPackage.includes('"deploy": "wrangler deploy"'),
    'no wrangler configs/workflows/default deploy'
  ),
  check('Все локальные asset refs существуют', missingRefs.length === 0, missingRefs.join(', ') || 'all local refs exist'),
  check('Нет SVG UI-иконок в HTML', !/\.svg(?:"|\s)/.test(html), 'PNG/WebP/JPG references only'),
  check(
    'Нет служебного текста AI-визуализация в публичном HTML',
    !/AI-|AI-визуализация|Цеховые процессы|декоративных картинок/.test(html),
    'clean public copy'
  )
];

for (const item of checks) {
  console.log(`${item.ok ? 'PASS' : 'FAIL'} | ${item.name} | ${item.evidence}`);
}

const failed = checks.filter((item) => !item.ok);
console.log(JSON.stringify({ total: checks.length, passed: checks.length - failed.length, failed: failed.map((item) => item.name) }, null, 2));

if (failed.length > 0) {
  process.exit(1);
}
