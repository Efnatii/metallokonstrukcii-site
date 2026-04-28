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

## AI-визуализации сайта

Эти изображения сгенерированы через встроенный ImageGen/ChatGPT Image для утвержденного концепта C. Текст, цифры, кнопки и навигация не запечены в изображения: они реализованы в HTML/CSS.

| Файл | Назначение |
| --- | --- |
| `generated/b2e-dashboard-hero.webp` | Hero-фон: темный производственный цех с металлоконструкциями и сварочными искрами. |
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
| `generated/service-powder.webp`, `generated/service-powder@2x.webp` | Услуга и производство: порошковая окраска. |
| `generated/b2e-product-sheet.png` | Исходный AI-лист продуктовых визуализаций. |
| `generated/b2e-service-sheet.png` | Исходный AI-лист сервисных визуализаций. |

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
