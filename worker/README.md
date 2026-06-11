# B2E Leads Backend

`worker/src/index.js` содержит переносимую бизнес-логику приема заявок, статистики посещений и доставки уведомлений. В `main` этот код запускается через Yandex Cloud Functions adapter `yandex/function/index.mjs`.

## Yandex Cloud runtime

Активная схема:

- API Gateway проксирует `/api/*` в Cloud Function.
- `yandex/function/index.mjs` снимает `/api` prefix и передает запрос в `worker.fetch`.
- SMTP работает через Node `net`/`tls`, которые adapter передает как `SOCKET_CONNECT`.
- Статистика хранится в Object Storage mount через file-backed KV.
- Секреты приходят из Yandex Lockbox как env vars.

## Runtime secrets

Поддерживаются каналы доставки:

| Env var | Назначение |
| --- | --- |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` | SMTP transport. |
| `SMTP_USERNAME`, `SMTP_PASSWORD` | SMTP auth. |
| `SMTP_FROM`, `SMTP_FROM_NAME`, `SMTP_ENVELOPE_FROM`, `SMTP_TO` | Отправитель и получатели. |
| `LEAD_WEBHOOK_URL` | Внешний webhook. |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Telegram delivery. |
| `SMARTCAPTCHA_SERVER_KEY` | Опциональная Yandex SmartCaptcha проверка. |
| `TURNSTILE_SECRET_KEY` | Legacy fallback, не основной путь для Yandex Cloud. |

Если ни один канал доставки не задан, API возвращает `503 Lead destination is not configured`.

## Проверки

```powershell
npm --prefix worker test
npm --prefix worker run check
```

Для штатного deploy используйте `npm run yandex:deploy` из корня репозитория.
