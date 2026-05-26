# Источники изображений

## Логотипы и иконки

Логотип B2E, интерфейсные пиктограммы и маркеры карты подключены только как PNG. Для значимых UI-иконок есть варианты 1x, 2x и 3x, которые выбираются через `srcset`.

`logo/logo-b2e.png`, `logo/logo-b2e@2x.png`, `logo/logo-b2e@3x.png` - PNG-набор логотипа B2E для темной industrial-шапки.

`logo/logo-b2e-generated-source.png` - исходный AI-логотип B2E, сгенерированный через встроенный ImageGen/ChatGPT Image и очищенный до прозрачного PNG-набора.

`icons/concept-c-industrial-icons-source.png` - новый исходный лист пиктограмм для реализации концепта C. Лист сгенерирован через встроенный ImageGen/ChatGPT Image в едином black/yellow industrial 3D стиле, затем разрезан на адаптивные PNG-иконки 1x/2x/3x.

`icons/arrow-download-simple-source.png` - отдельный ImageGen/ChatGPT Image исходник для упрощенных CTA-иконок `arrow-right` и `download`. После генерации фон был очищен, а цвета сведены к плоскому black/yellow стилю без 3D-пластики.

`icons/arrow-download-contrast-source.png` - новый ChatGPT Image/ImageGen исходник для контрастных CTA-иконок в двух цветовых вариантах: темный знак для желтого фона и желтый знак для темного фона. Из него нарезаны `arrow-right-on-yellow`, `arrow-right-on-dark`, `download-on-yellow`, `download-on-dark` и их `@2x`/`@3x` PNG-версии.

`icons/hamburger-simple-source.png` - отдельный ImageGen/ChatGPT Image исходник для упрощенной кнопки мобильного меню. Финальные PNG сведены к плоскому набору из трех полос без рамки, внутренней кнопки, теней и 3D-эффектов.

`icons/phone-gold.png`, `icons/arrow-right.png`, `icons/download.png`, `icons/arrow-right-on-yellow.png`, `icons/arrow-right-on-dark.png`, `icons/download-on-yellow.png`, `icons/download-on-dark.png`, `icons/chevron-down.png`, `icons/hamburger.png`, `icons/factory.png`, `icons/truss.png`, `icons/capacity-cube.png`, `icons/document-kmd.png`, `icons/team.png`, `icons/quality-shield.png`, `icons/request-doc.png`, `icons/calc-truss.png`, `icons/cutting.png`, `icons/delivery.png`, `icons/success-check.png` и их `@2x`/`@3x` версии - UI icon pack концепта C.

`icons/max-logo.png`, `icons/max-logo@2x.png`, `icons/max-logo@3x.png` - официальный значок MAX из полного кода сайтов-примеров в `techtask/B2E STYLE EXAMPLE SITES/static.tildacdn.com/.../Max_logo-32x32.png`.

## Рабочие изображения сайта

Пути в `assets/generated/` сохранены ради совместимости сборки, sitemap и уже существующей разметки. В этой версии карточки каталога и услуг заменены на реальные фотографии из открытых источников. Единственное сгенерированное изображение в публичной разметке - инженерная иллюстрация КМ/КМД в доказательном блоке.

| Файл | Назначение |
| --- | --- |
| `generated/b2e-dashboard-hero.webp` | Hero-фон: реальная фотография металлообработки с искрами. |
| `generated/product-frame.webp`, `generated/product-frame@2x.webp` | Карточка каталога: реальная фотография строительного металлического каркаса. |
| `generated/product-embedded.webp`, `generated/product-embedded@2x.webp` | Карточка каталога: реальная фотография анкерных закладных деталей. |
| `generated/product-stairs.webp`, `generated/product-stairs@2x.webp` | Карточка каталога: реальная фотография промышленной металлической лестницы и площадки. |
| `generated/product-canopy.webp`, `generated/product-canopy@2x.webp` | Карточка каталога: реальная фотография металлического каркаса навеса. |
| `generated/product-gates.webp`, `generated/product-gates@2x.webp` | Карточка каталога: реальная фотография промышленных металлических ворот. |
| `generated/product-tank.webp`, `generated/product-tank@2x.webp` | Карточка каталога: реальная фотография промышленных резервуаров. |
| `generated/product-arch.webp`, `generated/product-arch@2x.webp` | Карточка каталога: реальная фотография арочной стальной конструкции. |
| `generated/product-custom.webp`, `generated/product-custom@2x.webp` | Карточка каталога: реальная фотография нестандартных балок и рам в производстве. |
| `generated/service-montage.webp`, `generated/service-montage@2x.webp` | Услуга и производство: реальная фотография монтажа металлического каркаса. |
| `generated/service-cutting.webp`, `generated/service-cutting@2x.webp` | Услуга и производство: реальная фотография плазменной резки из существующих assets проекта. |
| `generated/service-bending.webp`, `generated/service-bending@2x.webp` | Услуга: реальная фотография листогибочного пресса. |
| `generated/service-machining.webp`, `generated/service-machining@2x.webp` | Услуга и производство: реальная фотография металлообработки с искрами. |
| `generated/service-powder.webp`, `generated/service-powder@2x.webp` | Услуга и производство: реальная фотография пистолета для порошковой окраски. |
| `generated/proof-kmkd-generated.png`, `generated/proof-kmkd-generated@2x.png` | Инженерный блок: сгенерированная через ImageGen техническая схема металлического каркаса без подписей и декоративной рамки. |
| `generated/b2e-product-sheet.png` | Старый исходный AI-лист продуктовых визуализаций; не используется в публичной разметке. |
| `generated/b2e-service-sheet.png` | Старый исходный AI-лист сервисных визуализаций; не используется в публичной разметке. |

### Источники фото и примеров

| Использовано для | Источник |
| --- | --- |
| Hero, металлообработка | Wikimedia Commons: `Making sparks for parts (8625883).jpg` - https://commons.wikimedia.org/wiki/File:Making_sparks_for_parts_(8625883).jpg |
| Строительный каркас, монтаж | Wikimedia Commons: `Moscow, 1st Brestskaya Street - steel frame construction.jpg` - https://commons.wikimedia.org/wiki/File:Moscow,_1st_Brestskaya_Street_-_steel_frame_construction.jpg |
| Закладные детали | Wikimedia Commons: `Ancor bolt for concrete.JPG` - https://commons.wikimedia.org/wiki/File:Ancor_bolt_for_concrete.JPG |
| Лестницы металлические | Wikimedia Commons: `Laufgitter Treppe und Laufgitter-Gang P4420737-HDR.jpg` - https://commons.wikimedia.org/wiki/File:Laufgitter_Treppe_und_Laufgitter-Gang_P4420737-HDR.jpg |
| Навесы | Wikimedia Commons: `Artà railway station unfinished platform canopy.jpg` - https://commons.wikimedia.org/wiki/File:Art%C3%A0_railway_station_unfinished_platform_canopy.jpg |
| Ворота | Wikimedia Commons: `Substantial locked steel gate - geograph.org.uk - 2703380.jpg` - https://commons.wikimedia.org/wiki/File:Substantial_locked_steel_gate_-_geograph.org.uk_-_2703380.jpg |
| Резервуары | Wikimedia Commons: `Propane Storage Tanks 1.jpg` - https://commons.wikimedia.org/wiki/File:Propane_Storage_Tanks_1.jpg |
| Арочные конструкции | Wikimedia Commons: `Whittier Bridge Completed Steel Arch (17636361050).jpg` - https://commons.wikimedia.org/wiki/File:Whittier_Bridge_Completed_Steel_Arch_(17636361050).jpg |
| Нестандартные конструкции | Wikimedia Commons: `Steel Fabrication Shop Columns and Beams. Bar-Joist Roof Trusses on Ground in Foreground, 9-6-68 (16843105081).jpg` - https://commons.wikimedia.org/wiki/File:Steel_Fabrication_Shop_Columns_and_Beams._Bar-Joist_Roof_Trusses_on_Ground_in_Foreground,_9-6-68_(16843105081).jpg |
| Гибка металла | Wikimedia Commons: `EHT-Biegepresse.jpg` - https://commons.wikimedia.org/wiki/File:EHT-Biegepresse.jpg |
| Порошковая окраска | Wikimedia Commons: `Pulversprühpistole mit Ableitring.JPG` - https://commons.wikimedia.org/wiki/File:Pulverspr%C3%BChpistole_mit_Ableitring.JPG |
| Резка и обработка металла | Существующие реальные фото проекта: `workshop/cnc-plasma-cutting.jpg`, `workshop/plasma-table.jpg`. |
| Инженерная иллюстрация КМ/КМД | ImageGen, prompt: isometric KM/KMD style line drawing of an industrial steel building frame with columns, roof trusses, bracing, base plates and bolted nodes. |

Все новые фото были локально кадрированы, выровнены по размеру и слегка приведены по контрасту/цвету под темный industrial-стиль сайта. Полноценная AI-генерация для фото-замен не использовалась.

### Company section generated scene assets

`generated/company-master-seamless.png` - ImageGen master background generated as one continuous vertical factory scene for the `О компании` section.

`generated/company-info-seamless.png`, `generated/company-services-seamless.png`, `generated/company-route-seamless.png` - contiguous cropped chunks from `generated/company-master-seamless.png` for main company information, services, and production road-map scenes.

`generated/company-float-truss.png`, `generated/company-float-stairs.png`, `generated/company-float-frame.png` - ImageGen metal-structure objects generated on green chroma-key and locally converted to transparent PNG for the floating background layer. The `*-key.png` siblings are the retained green-screen source images.

## Документы доверия

| Файл | Источник |
| --- | --- |
| `documents/letters/sevzapenergo-letter.pdf`, `documents/letters/sevzapenergo-letter.webp` | Пользовательский файл `update/Благодарственные письма/Благодарственное_письмо_от_СЕВЗАПЭНЕРГО_18_05_26.pdf`. |
| `documents/letters/inergo-letter.pdf`, `documents/letters/inergo-letter.webp` | Пользовательский файл `update/Благодарственные письма/исх.25-117.pdf`. |

## Логотипы клиентов и партнеров

Логотипы используются только для идентификации клиентов/партнеров из технического задания. Права на товарные знаки принадлежат их владельцам. Для сайта подготовлены PNG-версии 1x/2x/3x.

| Файл | Источник |
| --- | --- |
| `clients/pyaterochka.png`, `clients/pyaterochka@2x.png`, `clients/pyaterochka@3x.png` | PNG-версии на основе официального логотипа X5 Group/Пятерочка. |
| `clients/magnit.png`, `clients/magnit@2x.png`, `clients/magnit@3x.png` | PNG-версии на основе официального логотипа Магнит. |
| `clients/giproavtotrans.png`, `clients/giproavtotrans@2x.png`, `clients/giproavtotrans@3x.png` | `https://www.spbgat.ru/images/Logo2.png` |
| `clients/gorelektrotrans.png`, `clients/gorelektrotrans@2x.png`, `clients/gorelektrotrans@3x.png` | `https://electrotrans.spb.ru/theme/gupget/images/logo.png` |
| `clients/vodokanal-spb.png`, `clients/vodokanal-spb@2x.png`, `clients/vodokanal-spb@3x.png` | `https://www.vodokanal.spb.ru/local/templates/vodokanal/images/Logo_VDK2.png` |
| `clients/katarsis.png`, `clients/katarsis@2x.png`, `clients/katarsis@3x.png` | `https://kpower.ru/wp-content/uploads/2023/03/Katharsis_Logotype_Rus.png` |
