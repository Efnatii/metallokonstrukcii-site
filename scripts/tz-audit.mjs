import fs from 'node:fs';
import path from 'node:path';

const read = (filePath) => fs.readFileSync(filePath, 'utf8');

const html = read('src/index.html');
const styles = read('src/styles.css');
const main = read('src/main.js');
const configJs = read('src/config.js');
const envExample = read('.env.example');
const pagesWorkflow = read('.github/workflows/pages.yml');
const workerWorkflow = read('.github/workflows/worker.yml');
const rootWrangler = read('wrangler.jsonc');
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
  'B2E_YANDEX_MAP_EMBED_URL',
  'B2E_RBC_PROFILE_URL',
  'B2E_RUSPROFILE_URL',
  'B2E_CATALOG_URL',
  'B2E_LEAD_ENDPOINT',
  'CLOUDFLARE_ACCOUNT_ID',
  'WORKER_ALLOWED_ORIGIN',
  'WORKER_SITE_LABEL',
  'WORKER_LEAD_SUBJECT'
];

const privateSecrets = [
  'CLOUDFLARE_API_TOKEN',
  'WORKER_LEAD_WEBHOOK_URL',
  'WORKER_TELEGRAM_BOT_TOKEN',
  'WORKER_TELEGRAM_CHAT_ID',
  'WORKER_SMTP_HOST',
  'WORKER_SMTP_PORT',
  'WORKER_SMTP_SECURE',
  'WORKER_SMTP_USERNAME',
  'WORKER_SMTP_PASSWORD',
  'WORKER_SMTP_FROM',
  'WORKER_SMTP_FROM_NAME',
  'WORKER_SMTP_ENVELOPE_FROM',
  'WORKER_SMTP_TO',
  'WORKER_TURNSTILE_SECRET_KEY'
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
const footer = extractBetween(html, '<footer class="site-footer">', '</footer>');
const productTitles = extractTexts(html, /<article class="product-card[^"]*">[\s\S]*?<h3>([\s\S]*?)<\/h3>/g);
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
    'Контакты: Седова 57 лит В, телефон, email, ссылка Яндекс',
    hasAll(html, ['Седова, 57, лит. В', '+7 (965) 057-82-70', 'zakaz@b2energy.ru', 'Открыть в Яндекс Картах', 'https://yandex.ru/maps/-/CPSAzCMe']),
    'contact card'
  ),
  check(
    'Публичные профили сохранены в конфигурации, но скрыты из контента',
    hasAll(configJs, ['https://companies.rbc.ru/amp/ogrn/1247800091098/', 'https://www.rusprofile.ru/id/1247800091098']) &&
      !html.includes('РБК Компании') &&
      !html.includes('Руспрофиль'),
    'RBC + Rusprofile in config only'
  ),
  check(
    'Карта интерактивная: 4 точки и сложная зона покрытия',
    (html.match(/data-map-key=/g) || []).length === 5 &&
      html.includes('leaflet') &&
      hasAll(html, ['office', 'petrozavodsk', 'nikolskoe', 'rybatskoe', 'coverage']) &&
      main.includes('fitBounds') &&
      main.includes('L.polygon') &&
      html.includes('data-map-polygons='),
    `${(html.match(/data-map-key=/g) || []).length} map controls + Leaflet polygon coverage`
  ),
  check(
    'Карта показывает точный адрес Никольского и зону покрытия',
    hasAll(html, ['г. Никольское, Театральная ул., 6', 'data-map-coverage="true"', 'Санкт-Петербург, Ленинградская область, СЗФО и ЦФО']),
    'exact Nikolskoe address + clickable coverage'
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
      ['dist/robots.txt', 'dist/sitemap.xml', 'dist/llms.txt', 'dist/config.js', 'dist/.nojekyll'].every((file) => fs.existsSync(file)) &&
      read('dist/llms.txt').includes('ООО B2E'),
    'dist robots/sitemap/llms/config + JSON-LD'
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
    'Footer содержит только публичные служебные ссылки и copyright',
    hasAll(footer, ['robots.txt', 'sitemap.xml', 'llms.txt', '©', 'ИНН 7811801565', 'КПП 781101001', 'ОГРН 1247800091098']) &&
      !hasAll(footer, ['config.js']) &&
      !footer.includes('Каталог PDF') &&
      !footer.includes('ASSET_SOURCES.md'),
    'footer trimmed service links + legal lines + copyright'
  ),
  check(
    'Публичные env переменные рассортированы',
    publicVars.every((value) => envExample.includes(value)) &&
      pagesWorkflow.includes('vars.B2E_LEAD_ENDPOINT') &&
      !pagesWorkflow.includes('secrets.B2E_LEAD_ENDPOINT'),
    'GitHub Variables used by Pages build'
  ),
  check(
    'Приватные secrets рассортированы и синхронизируются в Worker',
    privateSecrets.every((value) => envExample.includes(value)) &&
      privateSecrets.every((value) => workerWorkflow.includes(`secrets.${value}`)) &&
      workerWorkflow.includes('wrangler secret bulk') &&
      read('worker/src/index.js').includes('sendSmtp'),
    'GitHub Secrets -> Worker secrets + SMTP'
  ),
  check(
    'Cloudflare git-deploy из корня публикует Worker',
    rootWrangler.includes('"name": "b2e-leads"') &&
      rootWrangler.includes('"main": "worker/src/index.js"') &&
      rootWrangler.includes('"ALLOWED_ORIGIN": "https://efnatii.github.io"'),
    'root wrangler.jsonc -> worker/src/index.js'
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
