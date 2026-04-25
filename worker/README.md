# B2E Leads Cloudflare Worker

Free serverless proxy for lead forms from GitHub Pages.

The public website sends requests to this Worker. Private tokens and webhooks stay inside Cloudflare Worker secrets and never appear in `config.js`.

## Deploy

```powershell
npm install
npx wrangler login
npm run deploy
```

The Worker name is `b2e-leads`, so the default URL will look like:

```text
https://b2e-leads.<cloudflare-subdomain>.workers.dev
```

## Secrets

Configure at least one delivery target.

Telegram:

```powershell
npm run secret:telegram-token
npm run secret:telegram-chat
```

Generic CRM/webhook:

```powershell
npm run secret:webhook
```

Optional Cloudflare Turnstile:

```powershell
npm run secret:turnstile
```

## Public Variables

Configured in `wrangler.jsonc`:

- `ALLOWED_ORIGIN`: `https://efnatii.github.io`
- `SITE_LABEL`: `ООО В2е`
- `LEAD_SUBJECT`: `Новая заявка с сайта В2е`

## Connect to GitHub Pages

Set the GitHub Actions variable or secret `B2E_LEAD_ENDPOINT` to the deployed Worker URL, then rerun the `Deploy GitHub Pages` workflow.
