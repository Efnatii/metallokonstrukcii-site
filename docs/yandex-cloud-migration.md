# Yandex Cloud deployment runbook

This repository now treats Yandex Cloud as the primary production target.

## Architecture

- Static site: Yandex Object Storage bucket.
- Backend/API: Yandex Cloud Functions, Node.js runtime.
- Public entrypoint: Yandex API Gateway.
- API routes: `/api/leads`, `/api/stats`, `/api/stats/visit`.
- Custom domain: attach the domain to API Gateway, not to the bucket.
- Secrets: Yandex Lockbox mounted into Cloud Functions as environment variables.

API Gateway keeps the site domain-independent until a domain is ready. The same Gateway serves static files and `/api/*`, so frontend endpoints stay relative.

## Official sources checked

- Object Storage static website hosting: `https://yandex.cloud/en/docs/storage/operations/hosting/setup`
- Yandex Cloud CLI installation: `https://yandex.cloud/en/docs/cli/operations/install-cli`
- Service-account CLI authentication: `https://yandex.cloud/en/docs/cli/operations/authentication/service-account`
- Lockbox secrets in Cloud Functions: `https://yandex.cloud/en/docs/functions/operations/function/lockbox-secret-transmit`
- API Gateway custom domain CLI: `https://yandex.cloud/en/docs/cli/cli-ref/serverless/cli-ref/api-gateway/add-domain`
- API Gateway custom domain DNS notes: `https://github.com/yandex-cloud/docs/blob/master/en/api-gateway/operations/api-gw-domains.md`
- SmartCaptcha server validation: `https://yandex.cloud/en/docs/smartcaptcha/concepts/validation`

## Repo files

- `yandex/function/index.mjs` - Yandex Cloud Functions adapter around existing backend logic.
- `yandex/gateway/openapi.yaml` - API Gateway OpenAPI spec.
- `scripts/Build-YandexFunctionPackage.ps1` - packages the function into `dist-yandex/b2e-yandex-function.zip`.
- `scripts/Deploy-YandexCloud.ps1` - creates/updates buckets, Lockbox secret, Function, Gateway, optional domain, and uploads `dist`.
- `scripts/yandex-smoke.mjs` - live smoke test for Yandex Gateway.
- `.github/workflows/pages.yml` - GitHub Actions deploy to Yandex Cloud.

Generated `dist-yandex/` is ignored by Git.

## Local prerequisites

Install and configure the Yandex Cloud CLI outside the repository:

```powershell
yc init
yc config list
```

Do not put `yc` profiles, OAuth tokens, service account keys, static keys, `.yc`, `.aws`, or secret files in this repo.

## Public deploy settings

The deploy script reads these optional env vars and has safe defaults:

```powershell
$env:YANDEX_SITE_BUCKET = "metallb2e.ru"
$env:YANDEX_STATS_BUCKET = "b2e-metallokonstrukcii-stats"
$env:YANDEX_FUNCTION_NAME = "b2e-leads"
$env:YANDEX_GATEWAY_NAME = "b2e-metallokonstrukcii-gateway"
$env:YANDEX_SERVICE_ACCOUNT_NAME = "b2e-metallokonstrukcii-sa"
$env:YANDEX_SECRET_NAME = "b2e-metallokonstrukcii-smtp"
```

For a domain-ready deploy:

```powershell
$env:YANDEX_CUSTOM_DOMAIN = "metallb2e.ru"
$env:YANDEX_CERTIFICATE_ID = "<certificate-id>"
```

Both values must be set together. The script then attaches the domain to API Gateway and rebuilds canonical URL, sitemap, robots and `llms.txt` for `https://<domain>/`.

## Secrets

Before running deploy, load the backend secrets into the current PowerShell process. The script uploads non-empty values to Yandex Lockbox and mounts them into Cloud Functions.

Minimum SMTP set:

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

Alternative delivery channels:

```powershell
$env:LEAD_WEBHOOK_URL = "<https webhook>"
$env:TELEGRAM_BOT_TOKEN = "<bot token>"
$env:TELEGRAM_CHAT_ID = "<chat id>"
```

Optional Yandex SmartCaptcha:

```powershell
$env:SMARTCAPTCHA_SERVER_KEY = "<ysc2_...>"
```

For a repeat deploy without updating Lockbox:

```powershell
$env:YANDEX_FUNCTION_SECRET_KEYS = "SMTP_HOST,SMTP_PORT,SMTP_SECURE,SMTP_USERNAME,SMTP_PASSWORD,SMTP_FROM,SMTP_ENVELOPE_FROM,SMTP_TO"
npm run yandex:deploy -- -SkipSecretUpdate
```

For a backend-only redeploy after adapter/function changes:

```powershell
$env:YANDEX_FUNCTION_SECRET_KEYS = "SMTP_HOST,SMTP_PORT,SMTP_SECURE,SMTP_USERNAME,SMTP_PASSWORD,SMTP_FROM,SMTP_ENVELOPE_FROM,SMTP_TO"
npm run yandex:deploy -- -SkipSecretUpdate -SkipSiteUpload
```

## Deploy

From the repo root:

```powershell
npm run check
npm run yandex:deploy
```

The script:

1. Creates or reuses a service account.
2. Adds required folder roles: `storage.editor`, `serverless.functions.invoker`, `lockbox.payloadViewer`.
3. Creates neutral Object Storage buckets for the site and stats.
4. Enables SPA-friendly website settings on the site bucket.
5. Uploads backend secrets to Lockbox.
6. Creates or updates the Cloud Function.
7. Creates or updates API Gateway with `yandex/gateway/openapi.yaml`.
8. Optionally attaches `YANDEX_CUSTOM_DOMAIN` to API Gateway.
9. Rebuilds the static site with `B2E_SITE_URL` equal to the public HTTPS site URL.
10. Uploads `dist/` to Object Storage.

## GitHub Actions

`.github/workflows/pages.yml` installs the Yandex Cloud CLI non-interactively, configures a service-account profile, runs `npm run check`, deploys, and smoke-tests the Gateway.

Required GitHub Secrets:

- `YC_SERVICE_ACCOUNT_KEY_JSON`
- `YC_CLOUD_ID`
- `YC_FOLDER_ID`
- `SMTP_*` or `LEAD_WEBHOOK_URL`/`TELEGRAM_*`

Optional GitHub Variables:

- `YANDEX_CUSTOM_DOMAIN`
- `YANDEX_CERTIFICATE_ID`
- `YANDEX_ALLOWED_ORIGIN`
- `YANDEX_SKIP_SECRET_UPDATE`
- `YANDEX_FUNCTION_SECRET_KEYS`

## Verify

After deploy, set the printed Gateway URL:

```powershell
$env:YANDEX_GATEWAY_URL = "https://<gateway-domain>"
npm run smoke:yandex
```

Expected result:

- `/api/stats` returns `200`;
- CORS preflight for `/api/leads` returns `204`;
- `/api/leads` returns `200` when at least one delivery channel is configured.

When `B2E_SITE_URL` and `YANDEX_GATEWAY_URL` are both set, the smoke test calls
the Gateway endpoint with the public site origin. This catches `http`/`https`
CORS mismatches before the form and visitor counter reach production.

## DNS notes for domain activation

Use Yandex Certificate Manager for the certificate, then attach it:

```powershell
yc serverless api-gateway add-domain b2e-metallokonstrukcii-gateway `
  --domain metallb2e.ru `
  --certificate-id <certificate-id>
```

For third-party DNS, Yandex API Gateway custom domains are suitable for third-level domains or lower. For an apex/second-level domain, use Yandex Cloud DNS and the ANAME scenario described in Yandex docs.

Function and bucket names do not need to change when the domain changes.
