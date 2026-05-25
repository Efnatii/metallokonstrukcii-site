# Research Topic: B2E metal structures site photo replacement

## Question

Which visual sources can replace AI-looking production images on the B2E metal structures site while keeping the page honest about what is a real photo, what is a KМ/КМД example, and what is a customer document?

## Search Strategy

- Verification date: 2026-05-24.
- Primary keywords: Wikimedia Commons metal fabrication, steel frame construction, propane storage tanks, powder coating gun, Pixabay metal fabrication.
- Required sources: public web pages with reusable imagery, local `update` assets supplied by the user, and existing project assets.
- Excluded sources: images that would need secret credentials, unclear social-media reuse, or competitor site screenshots.

## Findings

- Wikimedia Commons has usable real industrial photos for metal processing, steel-frame монтаж, reservoirs and powder-coating equipment:
  - https://commons.wikimedia.org/wiki/File:Making_sparks_for_parts_(8625883).jpg
  - https://commons.wikimedia.org/wiki/File:Moscow,_1st_Brestskaya_Street_-_steel_frame_construction.jpg
  - https://commons.wikimedia.org/wiki/File:Propane_Storage_Tanks_1.jpg
  - https://commons.wikimedia.org/wiki/File:Pulverspr%C3%BChpistole_mit_Ableitring.JPG
- The user-provided ZIP contains only example metal-structure/KМ/КМД drawings. These should be shown as engineering examples, not as real B2E photos.
- The supplied благодарственные письма can be published as trust documents; page previews were rendered locally and linked to the original PDFs.
- The supplied mail file contains SMTP/IMAP credentials and application passwords. These must not be published in frontend files or documentation.
- The supplemental info file adds a precise Yandex Maps link and public company profiles at RBC Companies and Rusprofile.

## Decision

Use real public photos for the hero, mounting, reservoirs, machining and powder-coating equipment; use the supplied drawings only as engineering context, not as real B2E photos; add a compact engineering/trust section with PDF letters. Keep the existing `assets/generated/` paths for compatibility, but document which files contain real photos and which contain generated technical visuals. Add the precise map link to the site; keep public company-profile URLs in configuration/AI metadata without visible page buttons; keep catalog CTAs disabled until the final catalog is approved. Support no-reply email delivery only through Worker secrets.

## Local Artifacts

- Notes file: `docs/research-photo-sources.md`
- Updated asset source registry: `src/assets/ASSET_SOURCES.md`
- New public trust documents: `src/assets/documents/letters/`
- Downloadable catalog: `src/assets/documents/b2e-metallokonstrukcii-catalog.pdf`
- Temporary preview/contact sheets were used during QA and then removed with the rest of `tmp/`.

## Follow-up

- If B2E later provides real photos from its own площадки, replace the remaining example drawings in product cards with those company-owned photos and keep the drawings in the engineering proof block.
