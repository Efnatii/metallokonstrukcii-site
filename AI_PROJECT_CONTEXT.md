# AI Project Context: B2E Metallokonstrukcii Site

> Назначение файла: дать будущему ИИ полный рабочий контекст по проекту, чтобы он мог безопасно продолжать разработку, не ломая ТЗ, дизайн, деплой, переменные среды, Worker и SEO/AI-доступность.

Дата составления контекста: 2026-04-27.

## Быстрая Навигация

- [1. Самое важное за 2 минуты](#1-самое-важное-за-2-минуты)
- [2. Бизнес-задача и ТЗ](#2-бизнес-задача-и-тз)
- [3. Визуальный контракт и дизайн](#3-визуальный-контракт-и-дизайн)
- [4. Архитектура проекта](#4-архитектура-проекта)
- [5. Карта файлов и зон ответственности](#5-карта-файлов-и-зон-ответственности)
- [6. Frontend: HTML, CSS, JS](#6-frontend-html-css-js)
- [7. Контентные инварианты ТЗ](#7-контентные-инварианты-тз)
- [8. Карта и контакты](#8-карта-и-контакты)
- [9. Формы, заявки и Cloudflare Worker](#9-формы-заявки-и-cloudflare-worker)
- [10. Переменные среды: публичные и приватные](#10-переменные-среды-публичные-и-приватные)
- [11. Assets: логотипы, иконки, изображения](#11-assets-логотипы-иконки-изображения)
- [12. SEO и AI-доступность](#12-seo-и-ai-доступность)
- [13. CI/CD и публикация](#13-cicd-и-публикация)
- [14. Локальная разработка](#14-локальная-разработка)
- [15. Обязательные проверки](#15-обязательные-проверки)
- [16. Типовые проблемы и готовые решения](#16-типовые-проблемы-и-готовые-решения)
- [17. Правила для будущего ИИ](#17-правила-для-будущего-ии)
- [18. Release checklist](#18-release-checklist)

## 1. Самое важное за 2 минуты

Это репозиторий статического лендинга ООО B2E о производстве металлоконструкций.

Проект состоит из двух частей:

- статический frontend в `src/`, который собирается в `dist/` и публикуется на GitHub Pages;
- Cloudflare Worker в `worker/`, который принимает заявки с сайта и отправляет их в Telegram или внешний webhook.

Публичный сайт:

```text
https://efnatii.github.io/metallokonstrukcii-site/
```

Публичный Worker endpoint:

```text
https://b2e-leads.egory780.workers.dev
```

Основная команда проверки:

```powershell
npm.cmd run check
```

Она проверяет синтаксис, тесты сайта, тесты Worker, сборку, аудит ТЗ и `wrangler deploy --dry-run`.

Главный автоматический критерий соответствия ТЗ:

```powershell
npm.cmd run audit:tz
```

Ожидаемый результат:

```text
24/24 PASS
```

Самые опасные ошибки:

- не класть приватные токены в `src/`, `dist/`, `.env`, README, docs или `wrangler.jsonc`;
- не использовать `secrets.B2E_LEAD_ENDPOINT` для Pages build, потому что endpoint публичный;
- не ломать точный список продукции и услуг из ТЗ;
- не заменять реальные логотипы клиентов и официальный MAX на AI-генерацию;
- не возвращать SVG UI-иконки: интерфейсный набор должен оставаться PNG/WebP/JPG;
- не менять карту на заглушку: карта должна быть реальной интерактивной и иметь 4 точки.

## 2. Бизнес-задача и ТЗ

Сайт нужен для компании ООО B2E, которая занимается производством, проектированием, обработкой и монтажом металлоконструкций.

Сайт должен:

- быстро объяснять, что B2E производит металлоконструкции для сложных задач;
- показывать каталог продукции и услуг;
- подтверждать производственные возможности: группа компаний, `1000+ т/мес`, `200+ КМ/КМД`, инженерный отдел, выезд;
- принимать заявки на расчет через форму;
- давать быстрые контакты: телефон, email, MAX, карта;
- быть пригодным для SEO и AI-поиска: structured data, `robots.txt`, `sitemap.xml`, `llms.txt`, семантический HTML;
- корректно разделять публичные переменные и приватные секреты.

Исходное ТЗ лежит в папке `techtask/`, но эта папка находится в `.gitignore` и не должна коммититься. Важные извлеченные требования уже закреплены в `scripts/tz-audit.mjs` и `docs/DESIGN_QA.md`.

## 3. Визуальный контракт и дизайн

Главный визуальный контракт: утвержденный пользователем концепт C.

Визуальная система:

- industrial dashboard style;
- темный hero с производственным фоном;
- желтый акцент;
- белая крупная типографика;
- плотная, но управляемая сетка;
- карточка производственных мощностей справа в hero;
- KPI-ряд и workflow-линия под hero;
- светлый каталог продукции сразу после hero;
- темные производственные секции ниже.

Корпоративная палитра:

- черный / почти черный фон;
- желтый акцент;
- белый основной текст.

CSS-токены, которые проверяет аудит:

```css
--accent: #ffc400;
--bg: #070a0c;
--white: #f8fafb;
```

Особые дизайн-правила, появившиеся после итераций:

- логотип B2E должен быть нормальным PNG-набором для темной шапки;
- длинный hero-заголовок не должен заходить под карточку мощностей на desktop;
- workflow-стрелки должны быть визуально центрированы между шагами;
- плавающая кнопка телефона до появления MAX должна занимать правую позицию будущего MAX;
- когда MAX появляется, телефон сдвигается влево, MAX становится справа;
- кнопки, стрелки и иконки не должны выглядеть как случайные SVG/псевдоиконки.

## 4. Архитектура проекта

Проект не использует React/Vite/Next. Это vanilla HTML/CSS/JS.

Главные слои:

- `src/index.html` - исходная HTML-разметка сайта;
- `src/styles.css` - вся визуальная система;
- `src/main.js` - runtime-логика сайта;
- `scripts/build.mjs` - сборка статического сайта в `dist/`;
- `scripts/tz-audit.mjs` - программный аудит соответствия ТЗ;
- `scripts/smoke.mjs` - smoke-check опубликованного сайта и Worker CORS;
- `worker/src/index.js` - Cloudflare Worker для заявок;
- `.github/workflows/pages.yml` - деплой GitHub Pages;
- `.github/workflows/worker.yml` - тесты, деплой Worker и sync Worker secrets.

Сборка:

1. читает `.env`, если он есть локально;
2. собирает публичный config;
3. копирует `src/` в `dist/`;
4. обновляет `index.html`;
5. создает `config.js`, `sitemap.xml`, `robots.txt`, `llms.txt`, `.nojekyll`.

`dist/` не коммитится.

## 5. Карта файлов и зон ответственности

### Корень

`package.json`

- содержит root scripts;
- `npm.cmd run check` - главная комплексная проверка;
- `npm.cmd run build` - сборка сайта;
- `npm.cmd run smoke` - проверка published Pages + Worker;
- `npm.cmd run audit:tz` - аудит ТЗ.

`.env.example`

- пример публичных GitHub Variables и приватных GitHub Secrets;
- реальные секреты сюда не добавлять.

`.gitignore`

- игнорирует `.env`, `dist/`, `node_modules/`, `worker/node_modules/`, `output/`, `.playwright/`, `techtask/`, logs.

`README.md`

- пользовательская документация для запуска, env, GitHub Actions, Worker, SEO.

`AI_PROJECT_CONTEXT.md`

- этот файл; расширенный контекст для будущего ИИ.

### Frontend

`src/index.html`

- все секции страницы;
- формы;
- карта;
- footer;
- ссылки на assets.

`src/styles.css`

- вся адаптивная сетка, анимации, typographic scale, layout, responsive rules.

`src/main.js`

- подстановка `window.B2E_CONFIG`;
- навигация;
- callback modal;
- отправка заявки;
- floating actions;
- reveal-анимации;
- Leaflet-карта.

`src/config.js`

- fallback config для локального исходного сайта;
- итоговый публичный config в проде генерируется сборкой как `dist/config.js`.

### Assets

`src/assets/logo/`

- финальный PNG-набор логотипа B2E;
- исходник AI-логотипа.

`src/assets/icons/`

- PNG-набор иконок 1x/2x/3x;
- MAX;
- phone;
- стрелки;
- маркеры карты;
- производственные и сервисные пиктограммы.

`src/assets/generated/`

- рабочие product/service/hero изображения. После обновления 2026-05-24 основные публичные изображения заменены на реальные фото, существующие фото проекта и пользовательские примеры КМ/КМД; старые AI-листы оставлены только как неиспользуемые исходники.

`src/assets/documents/letters/`

- PDF и WebP-превью благодарственных писем, добавленных из `update/Благодарственные письма`.

`src/assets/clients/`

- реальные логотипы клиентов из ТЗ;
- не заменять генерацией.

`src/assets/ASSET_SOURCES.md`

- описание источников assets.

### Worker

`worker/src/index.js`

- CORS;
- validation;
- Turnstile;
- Telegram delivery;
- webhook delivery.

`worker/test/index.test.mjs`

- unit tests Worker.

`worker/wrangler.jsonc`

- имя Worker, main script, compatibility date, public vars.

`worker/.dev.vars.example`

- пример локальных vars/secrets для Worker.

## 6. Frontend: HTML, CSS, JS

### Структура `src/index.html`

Порядок секций важен и соответствует концепту C:

1. `header.site-header`
2. `section.hero`
3. `section.catalog#products`
4. `section.services#services`
5. `section.company#company`
6. `section.production#production`
7. `section.proof#proof`
8. `section.clients`
9. `section.contacts-section#contacts`
10. `footer.site-footer`
11. `div.floating-actions`
12. `dialog.lead-modal`

Не переставлять секции без явного требования пользователя.

### Важные CSS-блоки

`site-header`

- sticky header;
- logo, nav, phone, email, MAX, callback button;
- mobile nav through `.nav-toggle`.

`hero`

- background image `b2e-dashboard-hero.webp`;
- overlay gradients;
- large headline;
- `.capacity-panel`;
- `.hero-workflow`.

`hero-workflow`

- workflow is a grid with separate arrow columns;
- arrows are dedicated `.workflow-arrow` elements with `aria-hidden="true"`;
- on mobile arrows are hidden.

`floating-actions`

- fixed phone/MAX quick actions;
- initial state `.is-max-pending`;
- phone appears after 5 seconds at the rightmost position;
- MAX appears after 10 seconds and phone shifts left;
- phone expands after 25 seconds.

### Важные JS-функции `src/main.js`

`setupConfigBindings()`

- applies `window.B2E_CONFIG` to nodes with `data-config-text`, `data-config-href`, `data-config-src`;
- updates canonical.

`setupNavigation()`

- mobile menu and nav behavior.

`setupModal()`

- opens/closes callback modal;
- sends lead to Worker if endpoint exists;
- falls back to `mailto:`;
- shows success state.

`setupFloatingActions()`

- timing for phone/MAX floating actions.

`setupLocationMap()`

- initializes Leaflet map;
- reads all map locations from `data-map-*` attributes;
- creates PNG markers;
- updates active card and external Yandex link.

## 7. Контентные инварианты ТЗ

Эти значения должны оставаться точными. `scripts/tz-audit.mjs` проверяет многие из них.

### Продукция

В dropdown, product catalog и callback select должны быть:

1. Строительные металлоконструкции
2. Закладные детали
3. Лестницы металлические
4. Навесы
5. Ворота
6. Резервуары
7. Арочные конструкции
8. Нестандартные конструкции

В форме заявки используется универсальное поле задачи; `objectType` остается скрытым служебным полем для совместимости отправки.


### Услуги

1. Монтаж металлоконструкций
2. Резка металла
3. Гибка металла
4. Металлообработка
5. Порошковая окраска

### Клиенты

Должны быть реальные логотипы и названия:

- ООО «АГРОТОРГ»
- ООО «МАГНИТ»
- ООО «ГИПРОАВТОТРАНС»
- ГУП «ГОРЭЛЕКТРОТРАНС»
- ГУП «ВОДОКАНАЛ СПБ»
- ООО НПК «КАТАРСИС»

### Производственные proof points

Должны присутствовать:

- группа компаний;
- `1000+ т/мес`;
- `200+ КМ/КМД`;
- инженерный отдел;
- выезд на производство или объект;
- площадки Петрозаводск, Никольское, Рыбацкое.

## 8. Карта и контакты

Карта должна быть реальной интерактивной картой, не iframe-заглушкой.

Текущая реализация:

- Leaflet;
- OpenStreetMap tiles;
- кастомные PNG markers;
- 4 точки и отдельный режим зоны покрытия;
- переключение карточек адресов;
- кнопка `Открыть в Яндекс Картах` ведет на выбранную точку.
- кнопка `Зона покрытия` находится рядом с адресами, включает `fitBounds` и показывает охват Санкт-Петербург, Ленинградскую область, СЗФО и ЦФО.

Точки:

| Key | Название | Lat | Lng | Тип |
| --- | --- | --- | --- | --- |
| `office` | Седова 57 лит В | `59.879804` | `30.425277` | Главный офис |
| `petrozavodsk` | Петрозаводск | `61.7892210` | `34.3688041` | Площадка |
| `nikolskoe` | Ленинградская обл., Тосненский р-н, г. Никольское, Театральная ул., 6 | `59.7034799` | `30.7861084` | Площадка |
| `coverage` | Санкт-Петербург, Ленинградская область, СЗФО и ЦФО | `59.200000` | `37.200000` | Зона покрытия |
| `rybatskoe` | Рыбацкое | `59.8308399` | `30.5002908` | Площадка |

Контакты:

- телефон: `+7 (965) 057-82-70`;
- email: `zakaz@b2energy.ru`;
- адрес: `Санкт-Петербург, ул. Седова, 57, лит. В, помещ. 11-Н, ком. 3`;
- MAX link задается через `B2E_MAX_URL`.

## 9. Формы, заявки и Cloudflare Worker

Основной канал заявок:

```text
Frontend -> B2E_LEAD_ENDPOINT -> Cloudflare Worker -> Telegram and/or webhook
```

Fallback:

```text
Frontend -> mailto:zakaz@b2energy.ru
```

Frontend payload:

```json
{
  "name": "Имя пользователя",
  "phone": "+7...",
  "objectType": "Общая заявка",
  "message": "Короткое описание задачи",
  "source": "source string",
  "page": "current page URL",
  "createdAt": "ISO date"
}
```

Worker behavior:

- accepts `OPTIONS` preflight;
- accepts only `POST`;
- validates `Origin` against `ALLOWED_ORIGIN`;
- rejects payload over 16 KiB;
- parses JSON;
- optionally validates Turnstile if `TURNSTILE_SECRET_KEY` exists;
- normalizes and validates name/phone;
- sends to Telegram if `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` exist;
- sends to webhook if `LEAD_WEBHOOK_URL` exists;
- returns `503` if no delivery target configured;
- returns `502` if delivery target failed;
- returns `{ ok: true, results }` on success.

Smoke test accepts Worker lead status `200`, `502`, or `503`, because `503` is expected when no private delivery channel is configured.

## 10. Переменные среды: публичные и приватные

### Главное правило

Все, что попало в `dist/config.js`, видно любому посетителю сайта. Это не секрет.

GitHub Pages - статическая сборка. Изменения GitHub Variables начинают работать только после нового workflow run `Deploy GitHub Pages`.

Cloudflare Worker Secrets приватны и не попадают в browser.

### Публичные GitHub Variables

Хранятся в:

```text
Settings -> Secrets and variables -> Actions -> Variables
```

Список:

- `B2E_SITE_URL`
- `B2E_CONTACT_PHONE`
- `B2E_CONTACT_PHONE_DISPLAY`
- `B2E_WORK_HOURS`
- `B2E_CONTACT_EMAIL`
- `B2E_MAX_URL`
- `B2E_ADDRESS`
- `B2E_YANDEX_MAP_URL`
- `B2E_YANDEX_MAP_EMBED_URL`
- `B2E_LEAD_ENDPOINT`
- `CLOUDFLARE_ACCOUNT_ID`
- `WORKER_ALLOWED_ORIGIN`
- `WORKER_SITE_LABEL`
- `WORKER_LEAD_SUBJECT`

`CLOUDFLARE_ACCOUNT_ID` не является паролем, но хранится как GitHub Variable для деплоя.

`B2E_LEAD_ENDPOINT` публичный. Его нельзя хранить как secret в Pages build, потому что frontend обязан знать endpoint.

### Приватные GitHub Secrets

Хранятся в:

```text
Settings -> Secrets and variables -> Actions -> Secrets
```

Список:

- `CLOUDFLARE_API_TOKEN`
- `WORKER_LEAD_WEBHOOK_URL`
- `WORKER_TELEGRAM_BOT_TOKEN`
- `WORKER_TELEGRAM_CHAT_ID`
- `WORKER_TURNSTILE_SECRET_KEY`

Workflow `.github/workflows/worker.yml` синхронизирует только непустые `WORKER_*` secrets в Cloudflare Worker Secrets через:

```text
wrangler secret bulk worker/.worker-secrets.json
```

`CLOUDFLARE_API_TOKEN` используется только GitHub Actions/Wrangler и не загружается как Worker binding.

## 11. Assets: логотипы, иконки, изображения

Правила assets:

- B2E logo - PNG set in `src/assets/logo/`;
- UI icons - PNG 1x/2x/3x in `src/assets/icons/`;
- generated visuals - WebP/PNG in `src/assets/generated/`;
- client logos - real PNG logos in `src/assets/clients/`;
- MAX - official PNG set, not AI-generated;
- no UI SVG in HTML.

Ключевые assets:

- hero: `src/assets/generated/b2e-dashboard-hero.webp`;
- logo: `src/assets/logo/logo-b2e.png`;
- product images: `src/assets/generated/product-*.webp`;
- service images: `src/assets/generated/service-*.webp`;
- map markers: `src/assets/icons/map-marker*.png`;
- phone icons: `src/assets/icons/phone-*.png`;
- MAX icon: `src/assets/icons/max-logo.png`.

`src/assets/ASSET_SOURCES.md` объясняет происхождение и назначение assets.

Если добавляешь новый asset:

1. положи его в правильную подпапку `src/assets/`;
2. добавь responsive варианты, если asset используется в UI;
3. обнови `ASSET_SOURCES.md`, если asset значимый;
4. проверь `npm.cmd run audit:tz`, потому что аудит проверяет существование local asset refs.

## 12. SEO и AI-доступность

Сборка генерирует:

- `dist/config.js`;
- `dist/sitemap.xml`;
- `dist/robots.txt`;
- `dist/llms.txt`;
- `dist/.nojekyll`.

HTML содержит:

- semantic sections;
- canonical;
- Open Graph metadata;
- JSON-LD structured data for `Organization` / `LocalBusiness`;
- footer links to service files.

Footer должен содержать ссылки:

- `robots.txt`;
- `sitemap.xml`;
- `llms.txt`;
- `config.js`;
- `assets/ASSET_SOURCES.md`;
- copyright.

`.nojekyll` не выводится в footer, потому что это служебный маркер GitHub Pages без пользовательского содержимого.

## 13. CI/CD и публикация

### GitHub Pages

Workflow:

```text
.github/workflows/pages.yml
```

Triggers:

- push to `main`;
- manual `workflow_dispatch`.

Steps:

1. checkout;
2. setup Node.js 22;
3. `npm test`;
4. `npm run build`;
5. upload `dist`;
6. deploy Pages.

### Cloudflare Worker

Workflow:

```text
.github/workflows/worker.yml
```

Triggers:

- push to `main`, but only when paths match `worker/**` or `.github/workflows/worker.yml`;
- manual `workflow_dispatch`.

Steps:

1. checkout;
2. setup Node.js 22;
3. `npm ci --prefix worker`;
4. `npm --prefix worker run check`;
5. check `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`;
6. deploy Worker if credentials exist;
7. sync non-empty Worker secrets;
8. optionally smoke-test Worker CORS.

Если Cloudflare credentials отсутствуют, Worker workflow не падает, а пропускает деплой с warning.

## 14. Локальная разработка

PowerShell может блокировать `npm.ps1`, поэтому надежнее использовать `npm.cmd`.

Сборка:

```powershell
npm.cmd run build
```

Локальный сервер:

```powershell
npm.cmd start
```

Сервер поднимается на:

```text
http://127.0.0.1:4173/
```

или на следующем свободном порту.

Worker локально:

```powershell
npm.cmd --prefix worker install
npm.cmd --prefix worker test
npm.cmd --prefix worker run deploy -- --dry-run
```

Ручной Worker deploy:

```powershell
npx.cmd --prefix worker wrangler login
npm.cmd --prefix worker run deploy
```

## 15. Обязательные проверки

Перед любым финальным ответом после изменения кода:

```powershell
npm.cmd run build
npm.cmd run check
```

Перед утверждением, что прод работает:

```powershell
npm.cmd run smoke
```

Для визуальных правок обязательно делать браузерную проверку через Playwright CLI или Browser/IAB.

Примеры:

```powershell
npx.cmd playwright screenshot --wait-for-timeout 1200 --viewport-size "1536,1024" "http://127.0.0.1:4176/" "output/playwright/check-1536.png"
npx.cmd playwright screenshot --wait-for-timeout 1200 --viewport-size "1366,900" "http://127.0.0.1:4176/" "output/playwright/check-1366.png"
npx.cmd playwright screenshot --wait-for-timeout 1200 --viewport-size "390,844" "http://127.0.0.1:4176/" "output/playwright/check-mobile.png"
```

Для опубликованной версии добавлять cache-busting SHA:

```text
https://efnatii.github.io/metallokonstrukcii-site/?sha=<commit-sha>
```

## 16. Типовые проблемы и готовые решения

### Переменная в GitHub Actions изменилась, но сайт не меняется

Причина: GitHub Pages статический. Variables попадают в `dist/config.js` только во время сборки.

Решение:

1. запустить `Deploy GitHub Pages`;
2. открыть `https://efnatii.github.io/metallokonstrukcii-site/config.js`;
3. проверить, что значение обновилось.

### Worker возвращает 503

`503 Lead destination is not configured` означает, что не настроен ни webhook, ни Telegram.

Это нормально для smoke, если приватные delivery secrets еще не заданы.

### Карта выглядит пустой или как заглушка

Нельзя заменять на пустой iframe. Проверить:

- Leaflet CSS/JS подключены;
- `data-locations-map` существует;
- есть 4 кнопки с `data-map-lat` и `data-map-lng`;
- сеть может загрузить OpenStreetMap tiles;
- контейнер карты имеет высоту.

### Windows/Yandex.Disk EPERM при сборке

Иногда `npm.cmd run build` может упереться в lock файла внутри `dist/`.

Решение:

- подождать 1-2 секунды;
- повторить сборку;
- не удалять исходники и не делать destructive git reset.

### Визуальное наложение hero-заголовка

Проверять на `1366`, `1536`, `1920`.

Ключевые CSS-зоны:

- `h1`;
- `.title-metal`;
- `.hero-grid`;
- `.hero-copy`;
- `.capacity-panel`.

### Workflow arrows выглядят криво

Стрелки должны быть отдельными `.workflow-arrow` элементами между `li` шагов. Не возвращать псевдоэлементы на `li:not(:last-child)`, потому что они визуально липнут к соседним текстам.

### Floating phone/MAX расположены неправильно

Ключевые CSS/JS:

- `.floating-actions`;
- `.floating-actions.is-max-pending`;
- `.phone-float`;
- `.max-float`;
- `setupFloatingActions()`.

До появления MAX скрытая MAX-кнопка не должна занимать место.

## 17. Правила для будущего ИИ

### Делать

- читать `README.md`, `docs/DESIGN_QA.md`, `scripts/tz-audit.mjs` и этот файл перед крупными изменениями;
- сохранять точный список продукции, услуг, клиентов и контактов;
- использовать `npm.cmd` в PowerShell;
- запускать `npm.cmd run check` после кода;
- делать browser screenshots после визуальных изменений;
- хранить новые публичные настройки как GitHub Variables;
- хранить приватные токены как GitHub Secrets / Worker Secrets;
- обновлять `ASSET_SOURCES.md` при добавлении значимых assets.

### Не делать

- не коммитить `techtask/`;
- не коммитить `dist/`, `output/`, `.env`, `worker/.dev.vars`, `node_modules/`;
- не публиковать реальные секреты в документации;
- не заменять Worker приватные secrets публичным frontend config;
- не использовать SVG для UI-иконок в HTML;
- не удалять реальные логотипы клиентов;
- не заменять официальный MAX на AI-иконку;
- не менять карту на заглушку;
- не ломать `24/24 PASS` в `audit:tz`;
- не делать broad redesign без явного требования пользователя.

### Если пользователь просит "докажи"

Нужно давать конкретные доказательства:

- команда и результат;
- screenshots path;
- GitHub Actions run URL;
- commit SHA;
- prod URL with `?sha=<commit-sha>`;
- что именно проверено.

## 18. Release checklist

Перед push:

- `git status --short` просмотрен;
- изменения ограничены задачей;
- `npm.cmd run build` прошел;
- `npm.cmd run check` прошел;
- для UI-правок сделаны screenshots минимум desktop + mobile;
- `npm.cmd run smoke` нужен, если проверяется production;
- нет секретов в diff;
- нет случайных файлов из `output/`, `dist/`, `.env`, `techtask/`.

После push:

- дождаться `Deploy GitHub Pages`;
- проверить, что Actions run относится к нужному `head_sha`;
- проверить production с `?sha=<commit-sha>`;
- при Worker-изменениях проверить Worker workflow или выполнить `wrangler deploy --dry-run`.

Минимальный финальный отчет пользователю:

- что изменено;
- какие команды прошли;
- где файл/страница;
- SHA или Actions run, если был push;
- какие ограничения остались, если они есть.
