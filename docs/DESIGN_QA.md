# Design and QA checklist

## Визуальный контракт

- Утвержденный пользователем концепт: C.
- Реализация переписана как чистая структура, а не как слой overrides поверх старого дизайна.
- Первый экран: темная industrial-сцена, крупный B2E header, телефонный блок как в референсе, CTA, карточка `Производственные мощности` и workflow-линия.
- Сразу после hero идет светлый `Каталог продукции` из 8 карточек, затем услуги, компания, производство, инженерный блок с письмами, клиенты, контакты и footer.
- Все неофициальные иконки интерфейса подключены как PNG 1x/2x/3x из `src/assets/icons/concept-c-industrial-icons-source.png`.
- Реальные ассеты, которые не заменяются генерацией: логотипы клиентов/партнеров и официальный значок MAX.
- Карточки каталога и услуг заменены на реальные фото из открытых источников и существующие фото проекта; инженерная иллюстрация перед производством сгенерирована через ImageGen и не выдается за фотографию объекта B2E.

## Покрытие ТЗ

- Продукция: строительные металлоконструкции, закладные детали, лестницы металлические, навесы, ворота, резервуары, арочные конструкции, нестандартные конструкции.
- Услуги в порядке из ТЗ: монтаж металлоконструкций, резка металла, гибка металла, металлообработка, порошковая окраска.
- Раздел калькулятора тоннажа удален по актуальному требованию; заявки на расчет идут через callback, телефон, email и MAX.
- Компания: группа компаний, мощность `1000+ т/мес`, инженерный отдел, `200+` решений КМ/КМД, выезд на производство/объект.
- Доверие: отдельный блок с примером КМ/КМД и благодарственными письмами СЕВЗАПЭНЕРГО и ГК ИНЕРГО без неподтвержденных формулировок.
- Каталог: публичные CTA `Скачать каталог` и `Смотреть весь каталог` неактивны до подготовки финального каталога.
- Контакты: телефон, email, MAX, универсальная форма заявки, точная ссылка Яндекс.Карт, интерактивная карта с офисом, площадками Петрозаводск/Никольское/Рыбацкое и кликабельной зоной покрытия. Профили РБК/Руспрофиль оставлены в публичной конфигурации и llms, но не выводятся как видимые ссылки в контенте.
- Footer: многострочный колонтитул с реквизитами, контактами, copyright, `robots.txt`, `sitemap.xml`, `llms.txt`; ссылки `config.js`, `Каталог PDF`, `Источники изображений` скрыты из публичного футера.

## Env split

- Browser/public GitHub Variables: `B2E_SITE_URL`, `B2E_CONTACT_PHONE`, `B2E_CONTACT_PHONE_DISPLAY`, `B2E_WORK_HOURS`, `B2E_CONTACT_EMAIL`, `B2E_MAX_URL`, `B2E_ADDRESS`, `B2E_YANDEX_MAP_URL`, `B2E_YANDEX_MAP_EMBED_URL`, `B2E_RBC_PROFILE_URL`, `B2E_RUSPROFILE_URL`, `B2E_CATALOG_URL`, `B2E_LEAD_ENDPOINT`, `CLOUDFLARE_ACCOUNT_ID`, `WORKER_ALLOWED_ORIGIN`, `WORKER_SITE_LABEL`, `WORKER_LEAD_SUBJECT`.
- Private GitHub Secrets: `CLOUDFLARE_API_TOKEN`, `WORKER_TELEGRAM_BOT_TOKEN`, `WORKER_TELEGRAM_CHAT_ID`, `WORKER_LEAD_WEBHOOK_URL`, `WORKER_SMTP_HOST`, `WORKER_SMTP_PORT`, `WORKER_SMTP_SECURE`, `WORKER_SMTP_USERNAME`, `WORKER_SMTP_PASSWORD`, `WORKER_SMTP_FROM`, `WORKER_SMTP_FROM_NAME`, `WORKER_SMTP_ENVELOPE_FROM`, `WORKER_SMTP_TO`, `WORKER_TURNSTILE_SECRET_KEY`.
- `B2E_LEAD_ENDPOINT` is public and must be a GitHub Variable, not a Secret in the Pages build.

## Required checks before release

```powershell
npm.cmd run build
npm.cmd run check
npm.cmd run smoke
npm.cmd --prefix worker run deploy -- --dry-run
```

Browser proof should cover desktop `1536x1024`, laptop `1366x900`, and mobile `390x844`: hero, catalog, services, production, callback popup, map, footer, no horizontal overflow, all generated assets loaded, 4 map locations and clickable coverage mode available.
