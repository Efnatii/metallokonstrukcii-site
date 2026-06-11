# ООО B2E - сайт металлоконструкций

Статический сайт и backend приема заявок для Yandex Cloud. Публичная часть собирается в `dist/`, API работает через Yandex API Gateway и Yandex Cloud Functions, секреты доставки хранятся в Yandex Lockbox.

## Архитектура

- Сайт: Yandex Object Storage bucket, публичная раздача через API Gateway.
- API заявок и статистики: Yandex Cloud Functions, адаптер `yandex/function/index.mjs`.
- Единая публичная точка: Yandex API Gateway из `yandex/gateway/openapi.yaml`.
- Маршруты API: `/api/leads`, `/api/stats`, `/api/stats/visit`.
- Домен: подключается к API Gateway через `YANDEX_CUSTOM_DOMAIN` и `YANDEX_CERTIFICATE_ID`.

Cloudflare больше не является активным deploy-target в `main`. Старый Worker-код сохранен как переносимая бизнес-логика, но стандартные команды, CI и документация ведут на Yandex Cloud.

## Команды

```powershell
npm test
npm run build
npm run check
npm run yandex:package
npm run yandex:deploy
```

`npm run check` проверяет синтаксис, unit-тесты, сборку, внутренний аудит и упаковку Yandex Function. `npm run deploy` является алиасом `npm run yandex:deploy`.

## Локальная сборка

```powershell
npm run build
npm run start
```

Для production deploy `scripts/Deploy-YandexCloud.ps1` сам выставляет:

- `B2E_SITE_URL=<gateway-url>/` или `https://<custom-domain>/`;
- `B2E_LEAD_ENDPOINT=/api/leads`;
- `B2E_STATS_ENDPOINT=/api/stats`.

## Yandex Cloud Deploy

Перед deploy нужен настроенный `yc`:

```powershell
yc init
yc config list
```

Минимальный набор runtime-секретов в текущем PowerShell-процессе:

```powershell
$env:SMTP_HOST = "smtp.yandex.ru"
$env:SMTP_PORT = "465"
$env:SMTP_SECURE = "on"
$env:SMTP_USERNAME = "<mailbox>"
$env:SMTP_PASSWORD = "<app-password>"
$env:SMTP_FROM = "B2E <zakaz@b2energy.ru>"
$env:SMTP_ENVELOPE_FROM = "zakaz@b2energy.ru"
$env:SMTP_TO = "zakaz@b2energy.ru"
```

Запуск:

```powershell
npm run yandex:deploy
```

Скрипт создает или обновляет service account, Object Storage buckets, Lockbox secret, Cloud Function, API Gateway, собирает сайт с относительными `/api/*` endpoints и загружает `dist/` в Object Storage.

## Домен

Когда домен и сертификат готовы в Yandex Certificate Manager:

```powershell
$env:YANDEX_CUSTOM_DOMAIN = "metallb2e.ru"
$env:YANDEX_CERTIFICATE_ID = "<certificate-id>"
npm run yandex:deploy
```

Deploy script привяжет домен к API Gateway, добавит домен и gateway origin в CORS, пересоберет canonical URL/sitemap/robots/llms под домен.

Для DNS учитывайте ограничение Yandex API Gateway: при внешнем DNS домен должен быть третьего уровня или ниже; для домена второго уровня нужен Cloud DNS/ANAME-сценарий.

## GitHub Actions

`.github/workflows/pages.yml` теперь деплоит в Yandex Cloud. Нужны secrets:

- `YC_SERVICE_ACCOUNT_KEY_JSON`;
- `YC_CLOUD_ID`;
- `YC_FOLDER_ID`;
- `SMTP_*` или `LEAD_WEBHOOK_URL`/`TELEGRAM_*`.

Публичные имена ресурсов задаются через GitHub Variables `YANDEX_*`. Для повторного deploy без обновления Lockbox можно выставить `YANDEX_SKIP_SECRET_UPDATE=true` и `YANDEX_FUNCTION_SECRET_KEYS`.

## Проверка после deploy

```powershell
$env:YANDEX_GATEWAY_URL = "https://<gateway-domain>"
npm run smoke:yandex
```

Ожидается: `/api/stats` возвращает `200`, CORS preflight для `/api/leads` возвращает `204`, тестовая заявка проходит до настроенного канала доставки.

Подробный runbook: `docs/yandex-cloud-migration.md`.
