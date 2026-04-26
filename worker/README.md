# B2E Leads Cloudflare Worker

Cloudflare Worker принимает заявки с GitHub Pages и пересылает их в Telegram или внешний webhook. Приватные значения не должны попадать в frontend: они хранятся в Cloudflare Worker Secrets.

## Локальные команды

```powershell
npm install
npm test
npm run deploy -- --dry-run
```

Ручной деплой:

```powershell
npx wrangler login
npm run deploy
```

## Автоматический деплой из GitHub Actions

Workflow `.github/workflows/worker.yml`:

1. устанавливает зависимости;
2. запускает `npm --prefix worker run check`;
3. деплоит Worker через `wrangler deploy`, если заданы `CLOUDFLARE_ACCOUNT_ID` и `CLOUDFLARE_API_TOKEN`;
4. собирает непустые GitHub Secrets и загружает их в Cloudflare через `wrangler secret bulk`.

## Публичные vars

Публичные vars можно хранить в `wrangler.jsonc` как defaults и переопределять через GitHub Variables:

| GitHub Variable | Worker binding | Назначение |
| --- | --- | --- |
| `WORKER_ALLOWED_ORIGIN` | `ALLOWED_ORIGIN` | Origin сайта, которому разрешен POST. |
| `WORKER_SITE_LABEL` | `SITE_LABEL` | Название сайта в webhook payload. |
| `WORKER_LEAD_SUBJECT` | `LEAD_SUBJECT` | Тема заявки. |

`CLOUDFLARE_ACCOUNT_ID` тоже хранится в GitHub Variables. Это не Worker binding для кода заявок, а публичный идентификатор аккаунта, который нужен GitHub Actions для деплоя.

## Приватные secrets

| GitHub Secret | Cloudflare Worker Secret | Обязательно |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | не загружается в Worker | Да, для автоматического деплоя Worker из GitHub Actions. |
| `WORKER_LEAD_WEBHOOK_URL` | `LEAD_WEBHOOK_URL` | Нет, если настроен Telegram. |
| `WORKER_TELEGRAM_BOT_TOKEN` | `TELEGRAM_BOT_TOKEN` | Нет, если настроен webhook. |
| `WORKER_TELEGRAM_CHAT_ID` | `TELEGRAM_CHAT_ID` | Нет, если настроен webhook. |
| `WORKER_TURNSTILE_SECRET_KEY` | `TURNSTILE_SECRET_KEY` | Нет, опциональная captcha. |

`CLOUDFLARE_API_TOKEN` остается только в GitHub Secrets и используется GitHub Actions/Wrangler для публикации. Его нельзя загружать в `dist/config.js`, `wrangler.jsonc` или Worker vars.

Для автоматической доставки заявок нужен хотя бы один канал:

- `WORKER_LEAD_WEBHOOK_URL`
- или пара `WORKER_TELEGRAM_BOT_TOKEN` + `WORKER_TELEGRAM_CHAT_ID`

Если канала нет, Worker возвращает `503 Lead destination is not configured`; frontend после этого использует `mailto:` fallback.

## Endpoint

Текущий публичный URL:

```text
https://b2e-leads.egory780.workers.dev
```

Этот URL не является секретом. Его можно хранить в GitHub Variable `B2E_LEAD_ENDPOINT`.

## Проверка CORS

```powershell
curl.exe -i -X OPTIONS "https://b2e-leads.egory780.workers.dev" `
  -H "Origin: https://efnatii.github.io" `
  -H "Access-Control-Request-Method: POST" `
  -H "Access-Control-Request-Headers: Content-Type"
```

Ожидаемый статус: `204 No Content`, header `Access-Control-Allow-Origin: https://efnatii.github.io`.
