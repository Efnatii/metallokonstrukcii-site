# Design QA

source visual truth path: `output/design-experiment/baseline-desktop-1440x920.png`, `output/design-experiment/baseline-mobile-390x844.png`, `docs/design-experiment-research.md`
implementation screenshot path: `output/design-experiment/final-v19-quote-factors-section-desktop.png`, `output/design-experiment/final-v18-quote-factors-modal-desktop.png`, `output/design-experiment/final-v18-quote-factors-section-mobile.png`
viewport: desktop `1440x920` browser override, mobile `390x844` browser override
state: homepage with hero RFQ builder, quote-output risk panel, interactive quote-factor matrix, readiness-based request routes, contextual lead-form guidance, lead readiness score, dynamic next step, visible/copyable/email lead brief, role scenario selection flow, product-card CTA modal for `Закладные детали`
full-view comparison evidence: `output/design-experiment/comparison-desktop-1440x920.png`, `output/design-experiment/comparison-mobile-390x844.png`
focused region comparison evidence: `output/design-experiment/final-v5-risk-prefill.png`, `output/design-experiment/final-v6-request-route-prefill.png`, `output/design-experiment/final-v17-quote-factors-modal-desktop.png`

## Findings

No remaining P0/P1/P2 issues after fixes.

Fonts and typography: the existing industrial condensed heading language is preserved. New brief chips and modal text use the existing type scale and weights; no negative letter spacing or oversized compact-panel text was introduced.

Spacing and layout rhythm: the desktop first screen now keeps the RFQ panel, workflow bar, and header contact block inside the viewport with right-edge breathing room. Mobile has no horizontal overflow and the hero CTA stack remains stable.
On mobile, the overloaded hero proof/workflow blocks are suppressed in the first viewport so the RFQ panel follows immediately after the primary CTA. The request-route cards collapse to one column and their internal plan rows become single-column blocks to avoid narrow text wrapping.
The mobile lead modal now hides the older static checklist when contextual guidance is present. The readiness score, next-step copy, and ready lead brief remain usable without horizontal overflow; on mobile, the lower submit action remains reachable through normal dialog scrolling.

Colors and visual tokens: new CTA/link states reuse the existing black/yellow/white tokens with a restrained steel-blue support accent in the quote section, avoiding a one-note palette while preserving the industrial look.

Image quality and asset fidelity: no visible product or logo assets were replaced. New UI uses existing PNG icons and current hero/catalog assets.

Copy and content: the page now makes the calculation path clearer with required input hints, active catalog download, product-type preselection, a hero RFQ builder, role-based buyer scenarios, quote package boundaries, quote-factor selection, risk-check CTA, readiness-based request routes, contextual source-package prompts, readiness score, next-step expectation, a reusable lead brief, and a more specific lead-form heading.

## Open Questions

- No Figma node or screenshot was provided, so this QA compares against the current site baseline plus research-derived product goals, not a Figma source of truth.
- Figma MCP tools are available, but no new Figma file was created because the Figma file-creation skill requires an explicit create-file request or an existing file target.

## Patches Made Since Previous QA Pass

- Enabled catalog links in hero and catalog header.
- Added first-screen calculation input brief.
- Added product-card CTA buttons that preselect `objectType`.
- Reworked lead modal with project type select and compact source-data checklist.
- Tightened desktop-stage header and hero layout to prevent clipped controls.
- Reduced lead modal height so submit is visible without scrolling.
- Added a structured quote builder after the hero with type, source-data maturity, volume, and scope options.
- Quote builder now opens the lead modal with matching `objectType` and a prepared task description.
- Hero primary CTA now routes to the quote builder instead of dropping the user into an empty form.
- Moved the RFQ builder into the hero and compressed production proof into the same first-screen panel.
- Reworked the former quote section into a support block explaining what enters the engineering calculation.
- Added extra right-edge spacing for desktop header and hero panel.
- Added buyer-scenario segmentation for генподрядчик, проектировщик, and снабжение.
- Scenario buttons now open the lead modal with prepared role-specific request text.
- Added "Пакет КП" section with scope, assumptions, timing, exclusions, and engineering-risk CTA.
- Added readiness-based request routes for full КМ/КМД, incomplete source data, and site-check/measurement cases.
- Route buttons open the lead modal with prepared route-specific request text.
- Suppressed non-critical local visit-stats fetch errors so localhost QA does not report false console failures.
- Added contextual source-package guidance inside the lead modal for ready КМ/КМД, sketch/photo, site-check, and standalone operation cases.
- Guidance buttons append structured missing-input lines to the task description.
- Mobile modal hides the older static checklist and keeps the submit action reachable after guidance is used.
- Added a dynamic readiness score inside the lead modal: source data, volume, and срок/адрес.
- Readiness updates on prefill, manual textarea input, project-type changes, and guidance-button inserts.
- Added dynamic "После отправки" copy inside readiness so the buyer sees the expected engineering next step before submitting.
- Added a visible "Готовый бриф" block inside the lead modal.
- Lead brief now assembles project type, contact placeholders, readiness score, expected next step, task text, and page URL.
- Added `mailto:` draft generation from the same brief for buyers who prefer sending through email.
- Added copy/select fallback: when browser clipboard policy blocks automatic copy, the readonly brief field is selected and starts from the first line for manual Ctrl+C.
- Added an interactive "Факторы КП" matrix between quote output and request routes.
- Factor selections cover source documents, tonnage/repeatability, coating/environment, node complexity, logistics/mounting, and schedule.
- The factor matrix updates a summary panel and opens the lead modal with selected factors transferred into the task, readiness score, lead brief, and email draft.
- Tightened the quote-factor summary CTA so text and arrow icon stay inside the button at desktop width.

## Implementation Checklist

- Desktop first viewport screenshot checked.
- Mobile first viewport screenshot checked.
- Quote builder opens modal with prepared task text.
- Product-card CTA opens modal with selected project type.
- Catalog CTA resolves to `./assets/documents/b2e-metallokonstrukcii-catalog.pdf`.
- `npm run check` passed after the eleventh-pass changes with `34/34` TZ-audit checks.
- Browser proof passed: no horizontal overflow, hero RFQ visible on desktop/mobile, hero scenario summary updates, scenario CTA modal prefill works, risk CTA prefill works, quote-factor matrix works and passes selected factors into the modal/brief/email, request-route CTA prefill works, lead guidance switches by selected project type, guidance inserts text into the message, readiness reaches `3/3` on ready комплект and `2/3` on site-check mobile flow, next-step copy changes for ready/site scenarios, lead brief builds a `mailto:` draft, brief copy/select fallback works on desktop/mobile, new current-session console errors/warnings are empty.

final result: passed
