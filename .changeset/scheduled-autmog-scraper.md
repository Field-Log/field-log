---
"field-log.app": major
---

- Add a scheduled Autmog scraper service with producer, queue processor, and dead-letter processing commands.
- Persist scraper runs, item snapshots, and image processing state through the shared database package.
- Upload, update, and delete scraper images through shared services-backed ImageKit storage.
- Add `@package/images` as the shared ImageKit integration package using `@imagekit/nodejs`.
- Expose image operations from `@package/services` with centralized logger instrumentation.
- Add `@package/markdown` for shared Markdown conversion of scraped descriptions.
- Normalize scraped materials, mechanisms, and product types into relational tables.
- Replace obsolete Autmog scraper columns with canonical maker and product metadata relationships.
- Add Grimsmo Saga, Rask, Fjell, and Norseman scraping with product variation records.
- Store scraper images through shared product and optional variation image ownership.
- Add Railway, environment variable, and database documentation for the scraper workflow.
