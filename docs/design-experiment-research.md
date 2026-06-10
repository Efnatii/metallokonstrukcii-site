# Design Experiment Research

Accessed: 2026-06-09

## Question

How should the B2B metal structures landing page improve trust, lead quality, and conversion without losing its industrial positioning?

## Search Strategy

- Primary keywords: metal building systems manufacturer, steel building manufacturer, hall construction, metallokonstruktsii production, steel structures projects.
- Required sources: official company sites and first-party product/service pages.
- Excluded sources: agency inspiration lists and unsourced design galleries.

## Similar Successful Sites Reviewed

- [Nucor Buildings Group](https://www.nucorbuildingsgroup.com/) positions the offer around scale, distributed facilities, authorized builders, engineering practices, and single-source material supply.
- [Butler Manufacturing](https://www.butlermfg.com/) emphasizes precision-engineered systems, product/project libraries, builder network, and resources that help planning.
- [Astron](https://www.astron.biz/en/index.html) turns the industrial sale into a planning path: building type, fixed-price messaging, construction speed, single-source delivery, references, and planning PDFs.
- [Allied Steel Buildings](https://www.alliedbuildings.com/) brings quote intent forward with pricing, buyer-guide, and design-service entry points.
- [Severstal Steel Solutions](https://steelsolutions.severstal.com/) mirrors the Russian buyer context: full-cycle project/design/production/supply language, ready project solutions, and production-capacity proof.
- [Worldwide Steel Buildings request quote](https://www.worldwidesteelbuildings.com/contact/request-quote/) asks for project information because custom steel building pricing depends on dimensions, finish options, openings, and roof details.
- [Allied Steel quote flow](https://www.alliedbuildings.com/get-a-quote/) pairs the quote path with evaluation, structural design, installation support, fabrication, transportation, and project management proof.
- [Xometry sheet metal fabrication](https://www.xometry.com/capabilities/sheet-metal-fabrication/) makes quote speed and capability tables visible near the service entry point, reducing uncertainty for engineering buyers.
- [HiStruct building configurator](https://www.histruct.com/products-and-services/building-configurator) frames the configurator as a way to capture detailed requirements and route accurate quote requests.

## Design Direction

The first iteration should not redesign the brand from scratch. The current site already has a strong industrial visual system and relevant assets. The highest-value UX improvement is to reduce buyer uncertainty in the first session:

- make the catalog reachable instead of visibly disabled;
- tell the buyer what data is enough to start calculation;
- preserve the main "send task" CTA as the primary path;
- let product cards open a pre-classified request instead of acting as passive imagery;
- keep desktop/mobile layout stable so proof blocks do not clip at common viewport widths.

The second iteration should move from "clear CTA" to "structured RFQ". Buyers of metal structures often cannot submit a clean request because they do not know which first parameters matter. A lightweight quote builder directly under the hero is a better fit than a generic callback form:

- it collects type of structure, source-data maturity, approximate tonnage, and required scope;
- it turns those choices into a ready message inside the lead modal;
- it keeps the request human-reviewed instead of pretending to produce an automatic price;
- it keeps the industrial trust path intact while improving lead quality.

The third iteration moves the RFQ builder into the hero itself. This better matches the page purpose: the first screen is no longer only a promise plus proof, it becomes a working intake surface. Production proof is compressed into the same panel so the buyer sees both capacity and the next action without scrolling.

The fourth iteration adds role-based segmentation. A генподрядчик, проектировщик, and снабжение buyer each needs a different answer from the same manufacturer. The site now captures that scenario in the hero RFQ and exposes dedicated scenario cards with prefilled request text.

The fifth iteration clarifies the expected commercial proposal output. Industrial buyers compare not only a price number, but also scope, assumptions, timing, exclusions, and unresolved risks before metal is released to production. The new "Пакет КП" block makes this evaluation explicit and adds an engineering-risk CTA.

The sixth iteration separates request paths by source-data readiness. A buyer with full КМ/КМД should not follow the same mental route as a buyer with a sketch or a site that needs measurement. The new route cards explain what to send, what answer to expect, and open the lead modal with route-specific task text.

The seventh iteration moves the intelligence into the lead form itself. Once the modal opens, the buyer gets context-aware source-package prompts for full КМ/КМД, sketch/photo ideas, site-check cases, or standalone operations. Prompt buttons add structured lines into the task description, improving lead quality without adding a file-upload or fake instant-price flow.

The eighth iteration adds a lightweight request-readiness score inside the same lead form. The score checks whether the task text contains source data, approximate volume, and timing/site context. This gives the buyer a useful "good enough to submit" signal while still allowing incomplete requests to proceed for human engineering follow-up.

The ninth iteration connects readiness to an explicit next step after submission. This removes the remaining black-box concern in the lead flow: the buyer sees whether the engineer will verify a complete package, ask for missing inputs, check site restrictions, or route a production operation.

The tenth iteration adds a reusable lead brief before submission. The form now assembles the selected project type, readiness score, next engineering step, task text, and page URL into a visible readonly brief. The buyer can copy it, use it in MAX or another messenger, or open a prepared email draft. This protects conversion when a buyer does not want to submit through the site form or when browser clipboard policy blocks automatic copying.

The eleventh iteration adds a quote-factor matrix before the request routes. This answers the next buyer question after "what enters the КП": which inputs move price, timing, scope, and assumptions. The buyer can select known factors such as source documents, tonnage, coating, logistics, and schedule, then pass that context into the lead modal and generated brief.

## KPI Frame

Primary KPI: qualified lead submissions from users who provide a project type and contact.

Drivers:

- catalog downloads from the hero and catalog section;
- product-card CTA opens with a preselected `objectType`;
- hero RFQ builder opens the lead modal with a prepared task description;
- buyer scenario is captured in the lead text from hero RFQ or scenario cards;
- request route is captured from full КМ/КМД, incomplete source data, or site-check scenarios;
- "Пакет КП" / risk-check CTAs reach the lead modal with prepared engineering context;
- lead-form guidance buttons add missing source-data lines into the task description;
- readiness score reaches 2/3 or 3/3 before submission without blocking incomplete requests;
- next-step copy is visible before submission and changes by source readiness and request context;
- lead brief is visible, copyable/selectable, and available as a prepared `mailto:` draft before submission;
- quote-factor selections are transferred into the lead message and generated brief;
- share of leads containing source-data maturity, tonnage range, and scope;
- users reaching the lead modal with submit visible without scrolling on desktop;
- no horizontal overflow on mobile/desktop first viewport.

Guardrails:

- do not remove production proof points, client trust, contacts, or existing SEO/AI artifacts;
- keep the existing black/yellow/white industrial palette;
- avoid adding new external runtime dependencies.

## Local Evidence

- Baseline screenshots: `output/design-experiment/baseline-desktop-1440x920.png`, `output/design-experiment/baseline-mobile-390x844.png`
- Final screenshots: `output/design-experiment/final-desktop-1440x920.png`, `output/design-experiment/final-mobile-390x844.png`, `output/design-experiment/final-modal-product-type.png`
- Second-pass screenshots: `output/design-experiment/final-v2-desktop-1440x920.png`, `output/design-experiment/final-v2-mobile-390x844.png`, `output/design-experiment/final-v2-quote-prefill.png`
- Third-pass screenshots: `output/design-experiment/final-v3-desktop-1440x920.png`, `output/design-experiment/final-v3-mobile-390x844.png`, `output/design-experiment/final-v3-hero-rfq-prefill.png`
- Fourth-pass screenshots: `output/design-experiment/final-v4-desktop-1440x920.png`, `output/design-experiment/final-v4-mobile-390x844.png`, `output/design-experiment/final-v4-scenarios-1440x920.png`, `output/design-experiment/final-v4-scenario-prefill.png`
- Fifth-pass screenshots: `output/design-experiment/final-v5-desktop-1440x920.png`, `output/design-experiment/final-v5-quote-output-1440x920.png`, `output/design-experiment/final-v5-risk-prefill.png`, `output/design-experiment/final-v5-quote-output-mobile-390x844.png`
- Sixth-pass screenshots: `output/design-experiment/final-v6-request-routes-desktop-1440x920.png`, `output/design-experiment/final-v6-request-route-prefill.png`, `output/design-experiment/final-v6-request-routes-mobile-390x844.png`
- Seventh-pass screenshots: `output/design-experiment/final-v7-lead-guidance-desktop.png`, `output/design-experiment/final-v7-lead-guidance-mobile.png`
- Eighth-pass screenshots: `output/design-experiment/final-v8-lead-readiness-desktop.png`, `output/design-experiment/final-v8-lead-readiness-mobile.png`
- Ninth-pass screenshots: `output/design-experiment/final-v9-lead-next-step-desktop.png`, `output/design-experiment/final-v9-lead-next-step-mobile.png`
- Tenth-pass screenshots: `output/design-experiment/final-v15-lead-brief-desktop.png`, `output/design-experiment/final-v15-lead-brief-mobile-scrolled.png`
- Eleventh-pass screenshots: `output/design-experiment/final-v19-quote-factors-section-desktop.png`, `output/design-experiment/final-v18-quote-factors-modal-desktop.png`, `output/design-experiment/final-v18-quote-factors-section-mobile.png`
- QA report: `design-qa.md`
