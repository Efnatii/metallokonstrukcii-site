# Сайт производства металлоконструкций ООО B2E

Статический сайт для GitHub Pages и Cloudflare Worker для приема заявок. Публичные настройки сайта попадают в `dist/config.js` при сборке. Приватные токены не попадают в сайт: они хранятся в GitHub Actions Secrets и при деплое синхронизируются в Cloudflare Worker Secrets.

## Быстрый старт

```powershell
npm run build
npm start
```

Если PowerShell блокирует `npm.ps1`, используйте:

```powershell
npm.cmd run build
npm.cmd start
```

Локальный сервер поднимается на `http://127.0.0.1:4173/` или на следующем свободном порту.

## Проверки

```powershell
npm test
npm run check
npm run smoke
```

- `npm test` проверяет сборочный конфиг сайта и логику Worker.
- `npm run check` дополнительно проверяет синтаксис, сборку и `wrangler deploy --dry-run`.
- `npm run smoke` проверяет опубликованный GitHub Pages сайт, `config.js`, `sitemap.xml` и CORS Cloudflare Worker.

## Контент и карты

- Название бренда в интерфейсе, сборке, JSON-LD и `llms.txt`: `ООО B2E`.
- Текущая визуальная версия реализует утвержденный концепт C как чистую HTML/CSS-структуру: темный industrial dashboard hero, карточка производственных мощностей, KPI-ряд, workflow-линия, светлый каталог продукции сразу после hero и темные производственные секции ниже.
- В шапке используется горизонтальная PNG-версия логотипа B2E, сгенерированная под темный industrial header: белый знак/wordmark, желтая `2`, без белой плашки.
- Все интерфейсные и производственные иконки заменены на единый адаптивный PNG-набор 1x/2x/3x из нового сгенерированного ChatGPT Image листа `icons/concept-c-industrial-icons-source.png`; SVG-иконки в интерфейсе не используются.
- Значок MAX подключен отдельным PNG-набором 1x/2x/3x из полного кода сайтов-примеров в `techtask`.
- Блок клиентов использует реальные логотипы компаний из ТЗ: АГРОТОРГ/Пятёрочка, Магнит, Гипроавтотранс, Горэлектротранс, Водоканал СПб, НПК Катарсис.
- Hero, каталог продукции, услуги и блок производства переведены на реальные фото из открытых источников, существующие фото проекта и пользовательские примеры КМ/КМД. Чертежи из обновлений используются только как примеры металлоконструкций и проектной документации, не как фотографии объектов B2E.
- На страницу добавлен блок `Инженерия и опыт`: пример КМ/КМД и благодарственные письма СЕВЗАПЭНЕРГО и ГК ИНЕРГО. Публичные реквизиты вынесены в hero-плашку и многострочный footer.
- Кнопки каталога на публичной странице сейчас неактивны до подготовки финального каталога.
- Карта в контактах - реальная интерактивная Leaflet/OpenStreetMap-карта. Она переключает главный офис и производственные направления из ТЗ: Петрозаводск, Никольское, Рыбацкое, а также отдельную кнопку зоны покрытия с масштабом СЗФО/ЦФО. Для Никольского указан адрес: `Ленинградская обл., Тосненский р-н, г. Никольское, Театральная ул., 6`. Главный офис выставлен по координатам 2ГИС для `Санкт-Петербург, улица Седова, 57 лит В`: `59.879804, 30.425277`. Кнопка `Открыть в Яндекс Картах` ведет на выбранную точку или общий масштаб покрытия.

## GitHub Actions

В репозитории два workflow:

- `.github/workflows/pages.yml` собирает и публикует GitHub Pages.
- `.github/workflows/worker.yml` тестирует, деплоит Cloudflare Worker и синхронизирует приватные Worker Secrets.

Если `CLOUDFLARE_API_TOKEN` или `CLOUDFLARE_ACCOUNT_ID` не заданы, workflow Worker не падает, а пропускает деплой с warning. Это сделано, чтобы тесты и Pages не ломались из-за еще не добавленных секретов.

## Публичные GitHub Variables

Эти значения можно хранить в `Settings -> Secrets and variables -> Actions -> Variables`. Они не являются секретами и могут оказаться в браузере или логах сборки.

| Variable | Назначение |
| --- | --- |
| `B2E_SITE_URL` | Публичный URL сайта для canonical, sitemap и `llms.txt`. |
| `B2E_CONTACT_PHONE` | Телефон для `tel:` ссылки. |
| `B2E_CONTACT_PHONE_DISPLAY` | Отображаемый телефон. |
| `B2E_WORK_HOURS` | Отображаемые часы работы в шапке сайта. |
| `B2E_CONTACT_EMAIL` | Почта для fallback через `mailto:`. |
| `B2E_MAX_URL` | Ссылка на MAX. |
| `B2E_ADDRESS` | Адрес компании. |
| `B2E_YANDEX_MAP_URL` | Ссылка на Яндекс Карты для главного офиса. |
| `B2E_YANDEX_MAP_EMBED_URL` | Публичный URL iframe Яндекс Карты для совместимости конфигурации. Текущая видимая карта работает через Leaflet/OpenStreetMap с четырьмя точками и зоной покрытия. |
| `B2E_RBC_PROFILE_URL` | Публичный профиль компании в РБК Компании. |
| `B2E_RUSPROFILE_URL` | Публичный профиль компании в Руспрофиль. |
| `B2E_CATALOG_URL` | Публичный URL PDF-каталога для кнопки `Скачать каталог`. |
| `B2E_LEAD_ENDPOINT` | Публичный URL Worker, сейчас `https://b2e-leads.egory780.workers.dev`. |
| `CLOUDFLARE_ACCOUNT_ID` | ID аккаунта Cloudflare для деплоя Worker. |
| `WORKER_ALLOWED_ORIGIN` | Разрешенный origin сайта, сейчас `https://efnatii.github.io`. |
| `WORKER_SITE_LABEL` | Название сайта в заявках. |
| `WORKER_LEAD_SUBJECT` | Тема заявки для Telegram/webhook. |

## Приватные GitHub Secrets

Эти значения задаются в `Settings -> Secrets and variables -> Actions -> Secrets`. Их нельзя добавлять в `.env`, `config.js`, README, коммиты или `wrangler.jsonc`.

| Secret | Куда используется |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Деплой Worker из GitHub Actions. Нужны права Workers Scripts Edit. |
| `WORKER_LEAD_WEBHOOK_URL` | CRM, Make, Zapier, Formspree или другой webhook для заявок. |
| `WORKER_TELEGRAM_BOT_TOKEN` | Токен Telegram-бота для отправки заявок. |
| `WORKER_TELEGRAM_CHAT_ID` | ID Telegram-чата/канала. |
| `WORKER_SMTP_HOST` | SMTP host для отправки заявки с no-reply почты. |
| `WORKER_SMTP_PORT` | SMTP port, для Yandex SSL обычно `465`. |
| `WORKER_SMTP_SECURE` | Режим TLS: `on` для 465 или `starttls` для 587. |
| `WORKER_SMTP_USERNAME` | SMTP-логин no-reply. |
| `WORKER_SMTP_PASSWORD` | Пароль приложения SMTP. |
| `WORKER_SMTP_FROM` | Адрес отправителя. |
| `WORKER_SMTP_FROM_NAME` | Отображаемое имя отправителя. |
| `WORKER_SMTP_ENVELOPE_FROM` | Опциональный SMTP envelope sender для `MAIL FROM`; по умолчанию используется `WORKER_SMTP_USERNAME`. |
| `WORKER_SMTP_TO` | Адрес получателя заявок. |
| `WORKER_TURNSTILE_SECRET_KEY` | Опциональный секрет Cloudflare Turnstile. |

Workflow загружает только непустые `WORKER_*` secrets в Cloudflare Worker Secrets. Если ни `WORKER_LEAD_WEBHOOK_URL`, ни Telegram-секреты, ни SMTP-секреты не заданы, Worker отвечает `503 Lead destination is not configured`, а сайт откатывается на `mailto:` fallback.

SMTP/IMAP-логины, пароли приложений и почтовые пароли из локальных материалов нельзя добавлять в `src`, `dist`, README, `.env.example`, frontend config или GitHub Variables. Для автоматической доставки заявок используйте приватные `WORKER_SMTP_*` secrets, Telegram или внешний webhook.

## Cloudflare Worker

Код Worker лежит в `worker/`. Он принимает POST-заявки только с `WORKER_ALLOWED_ORIGIN`, валидирует имя/телефон, опционально проверяет Turnstile и отправляет заявку в Telegram, webhook или SMTP.

Для Cloudflare Workers Builds / git-deploy в корне репозитория есть `wrangler.jsonc`. Он указывает на `worker/src/index.js`, поэтому в Cloudflare можно оставить root directory корнем репозитория и deploy command по умолчанию `npx wrangler deploy`.

Если Worker подключен к репозиторию напрямую через Cloudflare Workers Builds, SMTP нужно задавать в Cloudflare как Worker Secrets с runtime-именами без префикса `WORKER_`: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM`, `SMTP_FROM_NAME`, `SMTP_ENVELOPE_FROM`, `SMTP_TO`. GitHub Secrets вида `WORKER_SMTP_*` используются только workflow `.github/workflows/worker.yml`, который синхронизирует их через `wrangler secret bulk`.

Локально:

```powershell
npm --prefix worker install
npm --prefix worker test
npm --prefix worker run deploy -- --dry-run
```

Ручной деплой:

```powershell
npx --prefix worker wrangler login
npm --prefix worker run deploy
```

## Как проверить переменные на сайте

Откройте:

```text
https://efnatii.github.io/metallokonstrukcii-site/config.js
```

Если переменная изменена в GitHub Variables, но сайт не поменялся, нужно дождаться или вручную перезапустить workflow `Deploy GitHub Pages`. Статический сайт получает переменные только во время сборки.

## Безопасность

Все, что попало в `dist/config.js`, доступно любому посетителю. Поэтому туда можно класть только публичные значения: телефоны, email, URL сайта, URL Worker. Токены Telegram, webhook с ключом доступа, Turnstile secret и Cloudflare API token должны храниться только в GitHub Secrets и Cloudflare Worker Secrets.

## SEO и AI-доступность

Сборка генерирует `config.js`, `sitemap.xml`, `robots.txt`, `llms.txt` и `.nojekyll`. HTML содержит семантические секции и structured data для `Organization`/`LocalBusiness`.

В футере выводятся только публичные служебные файлы `robots.txt`, `sitemap.xml`, `llms.txt`, а также copyright сайта. `config.js`, `assets/ASSET_SOURCES.md`, каталог PDF и `.nojekyll` не выводятся в футере.

Дополнительный чеклист соответствия концепту C, ТЗ, env split и browser QA лежит в `docs/DESIGN_QA.md`.
