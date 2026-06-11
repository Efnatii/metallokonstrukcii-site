# Projects Section Design Research

## Question

Как улучшить раздел "Проекты КМ/КМД", если текущая карточная сетка выглядит слишком блочно и не гармонирует с инженерным B2B-сайтом.

## Search Strategy

- Primary keywords: card view vs list view, structured list design system, document list UX, summary list actions.
- Required sources: UX research, design systems, accessibility-aware component guidance.
- Excluded sources: decorative portfolio galleries without information-architecture rationale.

## Findings

- NN/g compares list and card views: list view is more space-efficient and easier to sort/scan, while cards are more visually grouped and engaging. For a PDF/document index, the priority is scanning and comparison, not isolated visual cards.
  Source: https://www.nngroup.com/videos/card-view-vs-list-view/
- IBM Carbon structured list guidance describes structured lists as a way to present many related rows in logical, scannable patterns. It recommends stacked content inside rows to create hierarchy.
  Source: https://carbondesignsystem.com/components/structured-list/usage/
- GOV.UK summary list guidance uses row borders to connect row-level actions with the relevant information and stresses contextual actions.
  Source: https://design-system.service.gov.uk/components/summary-list/
- Material list guidance treats lists as continuous groups of text/images with primary text, supporting visuals, and actions.
  Source: https://m3.material.io/components/lists/guidelines

## Decision

Use a document-index pattern instead of cards:

- remove the outer boxed showcase surface,
- replace two-column project cards with one continuous structured list,
- keep one thumbnail per row as a document anchor,
- keep metadata, title, description, and "Открыть проект" in one row,
- use lines and typography for hierarchy instead of individual card borders/shadows,
- apply the same list logic to благодарственные письма.

This makes the section feel like engineering documentation rather than a marketing card gallery.

## Local Artifacts

- Notes file: `docs/projects-section-design-research.md`
- Screenshots: temporary Playwright screenshots under `%TEMP%`

## Follow-up

Verify that the document list remains readable on mobile and that the section transition into clients/FAQ keeps the page rhythm.
