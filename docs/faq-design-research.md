# FAQ Design Research

## Question

Как оформить FAQ на лендинге B2E, чтобы раздел был гармоничен с остальными секциями, вопросы оставались видимыми, а ответы не перегружали страницу.

## Search Strategy

- Primary keywords: FAQ accordion UX, accordion design system, disclosure component, accessible accordion.
- Required sources: design systems, accessibility standards, UX research.
- Excluded sources: purely decorative Dribbble-style examples without UX rationale.

## Findings

- GOV.UK recommends using accordions only when users benefit from seeing an overview of related sections and revealing only the relevant parts. It also allows a heading plus a summary line inside the accordion header.
  Source: https://design-system.service.gov.uk/components/accordion/
- NN/g notes that accordions reduce visible content and increase interaction cost, so they work best when the page is content-heavy and users do not need to open many panels.
  Source: https://www.nngroup.com/articles/accordions-on-desktop/
- WAI-ARIA defines the accordion as a header control plus associated panel, and stresses clear header controls, keyboard interaction, and state semantics.
  Source: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
- GOV.UK Details guidance says disclosure is suitable for information only some users need and is less visually prominent than full accordion/tabs.
  Source: https://design-system.service.gov.uk/components/details/

## Decision

For this section, use a disclosure-style FAQ list rather than cards or a purely empty accordion. Each row should show:

- a small numeric marker,
- the full question,
- one short visible answer line,
- a minimal plus/minus indicator,
- the full answer only on expansion.

This keeps the FAQ useful without interaction, preserves a compact scan pattern, and avoids both previous failure modes: heavy cards and a thin, empty list.

## Local Artifacts

- Notes file: `docs/faq-design-research.md`
- Screenshots: temporary Playwright screenshots under `%TEMP%`

## Follow-up

Verify desktop and mobile screenshots against the rest of the page rhythm, especially the transition into the contacts section.
