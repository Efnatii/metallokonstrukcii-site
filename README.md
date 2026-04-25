# Сайт производства металлоконструкций ООО В2е

Одностраничный статический сайт под GitHub Pages. Контакты, карта, MAX-ссылка и endpoint заявок берутся из переменных окружения на этапе сборки и попадают в `dist/config.js`.

## Локальный запуск

```powershell
npm run build
npm start
```

Если PowerShell блокирует `npm.ps1`, используйте прямой запуск через `npm.cmd`:

```powershell
npm.cmd run build
npm.cmd start
```

По умолчанию локальный сервер поднимается на `http://127.0.0.1:4173/`. Если порт занят, скрипт выберет следующий свободный.

## Переменные окружения

Скопируйте `.env.example` в `.env` для локальной настройки или задайте переменные в GitHub:

- `B2E_SITE_URL`: публичный URL сайта.
- `B2E_CONTACT_PHONE`: телефон для `tel:` ссылки, например `+79650578270`.
- `B2E_CONTACT_PHONE_DISPLAY`: отображаемый телефон, например `+7 965 057 82 70`.
- `B2E_CONTACT_EMAIL`: почта для заявок.
- `B2E_MAX_URL`: реальная ссылка на MAX.
- `B2E_ADDRESS`: адрес производства/офиса.
- `B2E_YANDEX_MAP_URL`: ссылка на Яндекс Карты.
- `B2E_YANDEX_MAP_EMBED_URL`: ссылка для iframe Яндекс Карт.
- `B2E_LEAD_ENDPOINT`: публичный URL Cloudflare Worker для отправки форм.

Если `B2E_LEAD_ENDPOINT` не задан, формы используют fallback через `mailto:` на `B2E_CONTACT_EMAIL`.

## Cloudflare Worker для заявок

Код бесплатного proxy лежит в `worker/`. Он принимает заявки с GitHub Pages и пересылает их в Telegram или CRM/webhook, а приватные токены хранит в Cloudflare Worker Secrets.

```powershell
npm --prefix worker install
npx --prefix worker wrangler login
npm --prefix worker run deploy
```

После деплоя добавьте URL Worker в GitHub Actions variable `B2E_LEAD_ENDPOINT` и перезапустите workflow Pages.

Секреты Worker:

```powershell
npm --prefix worker run secret:telegram-token
npm --prefix worker run secret:telegram-chat
# или
npm --prefix worker run secret:webhook
```

`B2E_LEAD_ENDPOINT` сам по себе не является секретом. Секретными должны оставаться `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `LEAD_WEBHOOK_URL` и похожие значения внутри Cloudflare.

## GitHub Pages

Workflow уже добавлен в `.github/workflows/pages.yml`.

1. В GitHub откройте `Settings -> Pages`.
2. В `Build and deployment` выберите `Source: GitHub Actions`.
3. В `Settings -> Secrets and variables -> Actions -> Variables` добавьте публичные переменные из списка выше.
4. В `Secrets` добавьте `B2E_LEAD_ENDPOINT`, если заявки должны уходить в CRM/webhook.
5. Запушьте ветку `main`; workflow соберет `dist` и опубликует сайт.

## SEO и AI-доступность

Сайт содержит семантическую структуру, structured data (`Organization`/`LocalBusiness`), `robots.txt`, `sitemap.xml` и `llms.txt`, который генерируется при сборке из текущего конфига.
