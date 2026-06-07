# Yandex Cloud migration

This project can run on Yandex Cloud without depending on a domain name.

## Architecture

- Static site: Yandex Object Storage bucket.
- Backend/API: Yandex Cloud Functions, Node.js runtime.
- Public entrypoint: Yandex API Gateway.
- API routes: `/api/leads`, `/api/stats`, `/api/stats/visit`.
- Future custom domain: attach the domain to API Gateway, not to the bucket.

The bucket name is intentionally neutral. Object Storage static website hosting can be tied to a bucket/domain setup, but this project should stay domain-independent until a domain is ready. API Gateway gives one stable URL now and accepts a custom domain later.

## Official sources checked

- Object Storage static website hosting: `https://yandex.cloud/en/docs/storage/operations/hosting/setup`
- Object Storage AWS CLI: `https://yandex.cloud/en/docs/storage/tools/aws-cli`
- Cloud Functions Node.js quickstart and handler format:
  `https://yandex.cloud/en/docs/functions/quickstart/create-function/node-function-quickstart`
  and `https://yandex.cloud/en/docs/functions/lang/nodejs/handler`
- `yc serverless function version create` flags: `--runtime`, `--entrypoint`, `--source-path`, `--environment`, `--secret`, `--mount`
- API Gateway extensions:
  `x-yc-apigateway-integration:cloud_functions`,
  `x-yc-apigateway-integration:object_storage`,
  greedy parameters `{file+}`,
  and spec variables `${var.*}`
- `yc serverless api-gateway create/update --spec --variables`
- `yc serverless api-gateway add-domain --domain --certificate-id`
- Yandex Cloud MCP GitHub repo: `https://github.com/yandex-cloud/mcp`

## Repo files

- `yandex/function/index.mjs` - Yandex Cloud Functions adapter around existing backend logic.
- `yandex/gateway/openapi.yaml` - API Gateway OpenAPI spec.
- `scripts/Build-YandexFunctionPackage.ps1` - packages the function into `dist-yandex/b2e-yandex-function.zip`.
- `scripts/Deploy-YandexCloud.ps1` - creates/updates buckets, Lockbox secret, Function, Gateway, and uploads `dist`.
- `scripts/yandex-smoke.mjs` - live smoke test for Yandex Gateway.

Generated `dist-yandex/` is ignored by Git.

## Local prerequisites

Install and configure these outside the repository:

```powershell
yc init
yc config list
```

`aws` is optional. The deploy script uses `yc storage s3 cp`, so AWS CLI is not required for the normal path. If AWS CLI is used manually, Yandex docs require the Object Storage endpoint `https://storage.yandexcloud.net`.

Do not put `yc` profiles, OAuth tokens, static keys, `.aws`, `.yc`, or secret files in this repo.

## Secrets

Before running deploy, load the backend secrets into the current PowerShell process. The script uploads non-empty values to Yandex Lockbox and then mounts them into Cloud Functions.

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

Alternative delivery channels are also supported:

```powershell
$env:LEAD_WEBHOOK_URL = "<https webhook>"
$env:TELEGRAM_BOT_TOKEN = "<bot token>"
$env:TELEGRAM_CHAT_ID = "<chat id>"
```

For a repeat deploy without updating Lockbox, use `-SkipSecretUpdate` and set:

```powershell
$env:YANDEX_FUNCTION_SECRET_KEYS = "SMTP_HOST,SMTP_PORT,SMTP_SECURE,SMTP_USERNAME,SMTP_PASSWORD,SMTP_FROM,SMTP_ENVELOPE_FROM,SMTP_TO"
```

## Deploy

From the repo root:

```powershell
npm test
npm run yandex:package
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Deploy-YandexCloud.ps1 `
  -SiteBucket "b2e-metallokonstrukcii-site" `
  -StatsBucket "b2e-metallokonstrukcii-stats" `
  -FunctionName "b2e-leads" `
  -GatewayName "b2e-metallokonstrukcii-gateway" `
  -ServiceAccountName "b2e-metallokonstrukcii-sa" `
  -SecretName "b2e-metallokonstrukcii-smtp"
```

The script:

1. Creates or reuses a service account.
2. Adds required folder roles: `storage.editor`, `serverless.functions.invoker`, `lockbox.payloadViewer`.
3. Creates neutral Object Storage buckets for the site and stats.
4. Uploads backend secrets to Lockbox.
5. Creates or updates the Cloud Function.
6. Creates or updates API Gateway with `yandex/gateway/openapi.yaml`.
7. Rebuilds the static site with:
   - `B2E_SITE_URL=<gateway-url>/`
   - `B2E_LEAD_ENDPOINT=/api/leads`
   - `B2E_STATS_ENDPOINT=/api/stats`
8. Uploads `dist/` to Object Storage.

## Verify

After deploy, set the printed Gateway URL:

```powershell
$env:YANDEX_GATEWAY_URL = "https://<gateway-domain>"
npm run smoke:yandex
```

Expected result:

- `/api/stats` returns `200`;
- CORS preflight for `/api/leads` returns `204`;
- `/api/leads` returns `200` and SMTP/webhook result is successful.

## Connect a domain later

When the domain is ready:

1. Issue or import a certificate in Yandex Certificate Manager.
2. Attach the domain to API Gateway:

```powershell
yc serverless api-gateway add-domain b2e-metallokonstrukcii-gateway `
  --domain metallb2e.ru `
  --certificate-id <certificate-id>
```

3. Point DNS to the Yandex API Gateway domain as required by Yandex Cloud.
4. Re-run deploy with `-CustomDomain metallb2e.ru -CertificateId <certificate-id>` or set `B2E_SITE_URL=https://metallb2e.ru/` and rebuild/upload the site.

The Function and buckets do not need to be renamed when the domain changes.
