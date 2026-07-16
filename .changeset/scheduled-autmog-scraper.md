---
"field-log.app": minor
---

- Add a scheduled Autmog scraper service with producer, queue processor, and dead-letter processing commands.
- Persist scraper runs, item snapshots, and image processing state through the shared database package.
- Upload, update, and delete scraper images through shared services-backed ImageKit storage.
- Add `@package/images` as the shared ImageKit integration package using `@imagekit/nodejs`.
- Expose image operations from `@package/services` with centralized logger instrumentation.
- Add Railway, environment variable, and database documentation for the scraper workflow.
