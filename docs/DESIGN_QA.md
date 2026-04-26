# Design and QA checklist

## Визуальный контракт

- Утвержденный пользователем концепт: C.
- Над первым экраном: темный industrial dashboard hero, панель `Производство сегодня`, workflow-линия, KPI-ряд.
- После hero: светлый каталог продукции из 8 карточек, затем темные секции услуг, процесса, калькулятора, производства, клиентов и контактов.
- Все производственные виды, продуктовые карточки, сервисные сцены и B2E brand imagery: AI-сгенерированные ImageGen/ChatGPT Image ассеты в `src/assets/generated`.
- Реальные ассеты, которые не заменяются генерацией: логотипы клиентов/партнеров и официальный значок MAX.

## Покрытие ТЗ

- Продукция: строительные металлоконструкции, закладные детали, лестницы металлические, навесы, ворота, резервуары, арочные конструкции, нестандартные конструкции.
- Услуги: монтаж металлоконструкций, резка металла, гибка металла, металлообработка, порошковая окраска.
- Калькулятор тоннажа: коэффициенты `0.05`, `0.065`, `0.08`, `0.09`.
- Компания: производство группы компаний свыше `1000+ т/мес`, инженерный отдел, `200+` решений КМ/КМД, выезд на производство/объект.
- Контакты: телефон, email, MAX, callback modal, интерактивная карта с офисом и площадками Петрозаводск, Никольское, Рыбацкое.
- Footer: copyright, `robots.txt`, `sitemap.xml`, `llms.txt`, `config.js`, `assets/ASSET_SOURCES.md`.

## Env split

- Browser/public GitHub Variables: `B2E_*`, `CLOUDFLARE_ACCOUNT_ID`, `WORKER_ALLOWED_ORIGIN`, `WORKER_SITE_LABEL`, `WORKER_LEAD_SUBJECT`.
- Private GitHub Secrets: `CLOUDFLARE_API_TOKEN`, `WORKER_TELEGRAM_BOT_TOKEN`, `WORKER_TELEGRAM_CHAT_ID`, `WORKER_LEAD_WEBHOOK_URL`, `WORKER_TURNSTILE_SECRET_KEY`.
- `B2E_LEAD_ENDPOINT` is public and must be a GitHub Variable, not a Secret in the Pages build.

## Required checks before release

```powershell
npm.cmd run build
npm.cmd run check
npm.cmd run smoke
```

Browser proof should cover desktop `1536x1024`, laptop `1366x900`, and mobile `390x844`: hero, catalog, services, calculator, callback popup, map, footer, no horizontal overflow, all generated assets loaded, 4 map locations available.
