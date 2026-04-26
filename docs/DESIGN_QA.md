# Design and QA checklist

## Визуальный контракт

- Утвержденный пользователем концепт: C.
- Реализация переписана как чистая структура, а не как слой overrides поверх старого дизайна.
- Первый экран: темная industrial-сцена, крупный B2E header, телефонный блок как в референсе, CTA, карточка `Производственные мощности`, KPI-ряд и workflow-линия.
- Сразу после hero идет светлый `Каталог продукции` из 8 карточек, затем услуги, компания, калькулятор, производство, клиенты, контакты и footer.
- Все неофициальные иконки интерфейса подключены как PNG 1x/2x/3x из `src/assets/icons/concept-c-industrial-icons-source.png`.
- Реальные ассеты, которые не заменяются генерацией: логотипы клиентов/партнеров и официальный значок MAX.

## Покрытие ТЗ

- Продукция: строительные металлоконструкции, закладные детали, лестницы металлические, навесы, ворота, резервуары, арочные конструкции, нестандартные конструкции.
- Услуги: монтаж металлоконструкций, резка металла, гибка металла, металлообработка, порошковая окраска.
- Калькулятор тоннажа: коэффициенты `0.05`, `0.065`, `0.08`, `0.09`.
- Компания: группа компаний, мощность `1000+ т/мес`, инженерный отдел, `200+` решений КМ/КМД, выезд на производство/объект.
- Контакты: телефон, email, MAX, callback modal, интерактивная карта с офисом и площадками Петрозаводск, Никольское, Рыбацкое.
- Footer: copyright, `robots.txt`, `sitemap.xml`, `llms.txt`, `config.js`, `assets/ASSET_SOURCES.md`.

## Env split

- Browser/public GitHub Variables: `B2E_SITE_URL`, `B2E_CONTACT_PHONE`, `B2E_CONTACT_PHONE_DISPLAY`, `B2E_WORK_HOURS`, `B2E_CONTACT_EMAIL`, `B2E_MAX_URL`, `B2E_ADDRESS`, `B2E_YANDEX_MAP_URL`, `B2E_YANDEX_MAP_EMBED_URL`, `B2E_LEAD_ENDPOINT`, `CLOUDFLARE_ACCOUNT_ID`, `WORKER_ALLOWED_ORIGIN`, `WORKER_SITE_LABEL`, `WORKER_LEAD_SUBJECT`.
- Private GitHub Secrets: `CLOUDFLARE_API_TOKEN`, `WORKER_TELEGRAM_BOT_TOKEN`, `WORKER_TELEGRAM_CHAT_ID`, `WORKER_LEAD_WEBHOOK_URL`, `WORKER_TURNSTILE_SECRET_KEY`.
- `B2E_LEAD_ENDPOINT` is public and must be a GitHub Variable, not a Secret in the Pages build.

## Required checks before release

```powershell
npm.cmd run build
npm.cmd run check
npm.cmd run smoke
npm.cmd --prefix worker run deploy -- --dry-run
```

Browser proof should cover desktop `1536x1024`, laptop `1366x900`, and mobile `390x844`: hero, catalog, services, calculator, callback popup, map, footer, no horizontal overflow, all generated assets loaded, 4 map locations available.
