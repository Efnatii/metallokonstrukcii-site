# Источники изображений

## Логотипы, PNG-иконки и адаптивные размеры

Логотип B2E, интерфейсные пиктограммы и маркеры карты подключены только как PNG. Для каждого значимого значка подготовлены варианты 1x, 2x и 3x; в HTML они выбираются через `srcset`, а в CSS - через `image-set()`.

`logo/logo-b2e.png`, `logo/logo-b2e@2x.png`, `logo/logo-b2e@3x.png` - PNG-набор логотипа B2E для шапки сайта.

`logo/logo-b2e-generated-source.png` - исходный AI-логотип B2E на chroma key green, сгенерированный через встроенный ImageGen/ChatGPT Image и очищенный до прозрачного PNG-набора.

`icons/*.png`, `icons/*@2x.png`, `icons/*@3x.png` - PNG-наборы интерфейсных иконок: телефон, производственные показатели, этапы процесса, стрелки, скачивание, меню, успешная отправка формы и маркеры карты.

`logo-b2e-ai-concept.png` - AI-концепт логотипа, сгенерированный для проекта через встроенный ImageGen/ChatGPT Image.

`icons/generated-industrial-icons-source.png` - исходный лист плоских промышленных пиктограмм, сгенерированный через встроенный ImageGen/ChatGPT Image; из него подготовлены адаптивные PNG-иконки 1x/2x/3x.

`icons/max-logo.png`, `icons/max-logo@2x.png`, `icons/max-logo@3x.png` - официальный значок MAX из полного кода сайтов-примеров в `techtask/B2E STYLE EXAMPLE SITES/static.tildacdn.com/.../Max_logo-32x32.png`.

## AI-визуализации сайта

Эти изображения сгенерированы через встроенный ImageGen/ChatGPT Image для утвержденного концепта C. Текст, цифры, кнопки и навигация не запечены в изображения: они реализованы в HTML/CSS, а raster-ассеты используются как производственные фоны и карточки.

| Файл | Назначение |
| --- | --- |
| `generated/b2e-dashboard-hero.webp` | Hero-фон: темный производственный цех с металлоконструкциями, крановыми линиями и сварочными искрами. |
| `generated/product-frame.webp`, `generated/product-frame@2x.webp` | Карточка каталога: строительные металлоконструкции. |
| `generated/product-embedded.webp`, `generated/product-embedded@2x.webp` | Карточка каталога: закладные детали. |
| `generated/product-stairs.webp`, `generated/product-stairs@2x.webp` | Карточка каталога: металлические лестницы. |
| `generated/product-canopy.webp`, `generated/product-canopy@2x.webp` | Карточка каталога: навесы. |
| `generated/product-gates.webp`, `generated/product-gates@2x.webp` | Карточка каталога: ворота. |
| `generated/product-tank.webp`, `generated/product-tank@2x.webp` | Карточка каталога: резервуары. |
| `generated/product-arch.webp`, `generated/product-arch@2x.webp` | Карточка каталога: арочные конструкции. |
| `generated/product-custom.webp`, `generated/product-custom@2x.webp` | Карточка каталога: нестандартные конструкции. |
| `generated/service-montage.webp`, `generated/service-montage@2x.webp` | Услуга и производство: монтаж металлоконструкций. |
| `generated/service-cutting.webp`, `generated/service-cutting@2x.webp` | Услуга и производство: резка металла. |
| `generated/service-bending.webp`, `generated/service-bending@2x.webp` | Услуга и производство: гибка металла. |
| `generated/service-machining.webp`, `generated/service-machining@2x.webp` | Услуга и производство: металлообработка/сварка. |
| `generated/service-powder.webp`, `generated/service-powder@2x.webp` | Услуга: порошковая окраска. |
| `generated/b2e-product-sheet.png` | Исходный AI-лист продуктовых визуализаций, из которого подготовлены WebP-карточки. |
| `generated/b2e-service-sheet.png` | Исходный AI-лист сервисных визуализаций, из которого подготовлены WebP-карточки. |

## Логотипы клиентов и партнеров

Логотипы используются только для идентификации клиентов/партнеров из технического задания. Права на товарные знаки принадлежат их владельцам. Для сайта подготовлены PNG-версии 1x/2x/3x.

| Файл | Источник |
| --- | --- |
| `clients/pyaterochka.png`, `clients/pyaterochka@2x.png`, `clients/pyaterochka@3x.png` | PNG-версии на основе официального логотипа X5 Group/Пятерочка |
| `clients/magnit.png`, `clients/magnit@2x.png`, `clients/magnit@3x.png` | PNG-версии на основе официального логотипа Магнит |
| `clients/giproavtotrans.png`, `clients/giproavtotrans@2x.png`, `clients/giproavtotrans@3x.png` | `https://www.spbgat.ru/images/Logo2.png` |
| `clients/gorelektrotrans.png`, `clients/gorelektrotrans@2x.png`, `clients/gorelektrotrans@3x.png` | `https://electrotrans.spb.ru/theme/gupget/images/logo.png` |
| `clients/vodokanal-spb.png`, `clients/vodokanal-spb@2x.png`, `clients/vodokanal-spb@3x.png` | `https://www.vodokanal.spb.ru/local/templates/vodokanal/images/Logo_VDK2.png` |
| `clients/katarsis.png`, `clients/katarsis@2x.png`, `clients/katarsis@3x.png` | `https://kpower.ru/wp-content/uploads/2023/03/Katharsis_Logotype_Rus.png` |

## Legacy production photos

`workshop/*.jpg` - устаревшие публичные фотографии производственных процессов из предыдущей версии. Текущая страница их не использует, потому что по актуальному требованию все неофициальные производственные виды и фоны должны быть AI-сгенерированы.
