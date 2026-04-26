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
- В шапке используется простой знак B2E с балкой и фермой, связанный с производством металлоконструкций.
- Блок клиентов использует реальные логотипы компаний из ТЗ: АГРОТОРГ/Пятёрочка, Магнит, Гипроавтотранс, Горэлектротранс, Водоканал СПб, НПК Катарсис.
- Блок производственных фото использует реальные публичные фотографии производственных процессов. Подтвержденных публичных фото именно цехов B2E в найденных источниках нет, поэтому эти изображения не подписаны как собственность B2E. Источники перечислены в `src/assets/ASSET_SOURCES.md`.
- Карта в контактах - реальная интерактивная Leaflet/OpenStreetMap-карта. Она переключает главный офис и производственные направления из ТЗ: Петрозаводск, Никольское, Рыбацкое. Главный офис выставлен по координатам 2ГИС для `Санкт-Петербург, улица Седова, 57 лит В`: `59.879804, 30.425277`. Кнопка `Открыть в Яндекс Картах` ведет на выбранную точку в Яндексе.

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
| `B2E_CONTACT_EMAIL` | Почта для fallback через `mailto:`. |
| `B2E_MAX_URL` | Ссылка на MAX. |
| `B2E_ADDRESS` | Адрес компании. |
| `B2E_YANDEX_MAP_URL` | Ссылка на Яндекс Карты для главного офиса. |
| `B2E_YANDEX_MAP_EMBED_URL` | Legacy URL iframe Яндекс Карты для совместимости конфигурации. Текущая видимая карта работает через Leaflet/OpenStreetMap. |
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
| `WORKER_TURNSTILE_SECRET_KEY` | Опциональный секрет Cloudflare Turnstile. |

Workflow загружает только непустые `WORKER_*` secrets в Cloudflare Worker Secrets. Если ни `WORKER_LEAD_WEBHOOK_URL`, ни Telegram-секреты не заданы, Worker отвечает `503 Lead destination is not configured`, а сайт откатывается на `mailto:` fallback.

## Cloudflare Worker

Код Worker лежит в `worker/`. Он принимает POST-заявки только с `WORKER_ALLOWED_ORIGIN`, валидирует имя/телефон, опционально проверяет Turnstile и отправляет заявку в Telegram или webhook.

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

В футере выводятся публичные служебные файлы, которые имеет смысл открывать из браузера: `robots.txt`, `sitemap.xml`, `llms.txt`, `config.js`, `assets/ASSET_SOURCES.md`, а также copyright сайта. `.nojekyll` не выводится в футере, потому что это технический маркер GitHub Pages без пользовательского содержимого.
