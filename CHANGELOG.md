# field-log.app








## 0.1.6

### Patch Changes

- Fix Vercel release workflow

## Mobile Release Status

| Platform | Build | Submit | Destination | Review / Live |
| --- | --- | --- | --- | --- |
| iOS | Pending | Pending | App Store Connect / TestFlight | Manual update required |
| Android | Pending | Pending | Google Play track from /tools/fastlane | Manual update required |

## 0.1.5

### Patch Changes

- Fix Vercel release builds from the web app root.

## Mobile Release Status

| Platform | Build | Submit | Destination | Review / Live |
| --- | --- | --- | --- | --- |
| iOS | Pending | Pending | App Store Connect / TestFlight | Manual update required |
| Android | Pending | Pending | Google Play track from /tools/fastlane | Manual update required |

## 0.1.4

### Patch Changes

- Fix Vercel production build output detection.

## Mobile Release Status

| Platform | Build | Submit | Destination | Review / Live |
| --- | --- | --- | --- | --- |
| iOS | Pending | Pending | App Store Connect / TestFlight | Manual update required |
| Android | Pending | Pending | Google Play track from /tools/fastlane | Manual update required |

## 0.1.3

### Patch Changes

- Fix Vercel production build output detection.

## Mobile Release Status

| Platform | Build | Submit | Destination | Review / Live |
| --- | --- | --- | --- | --- |
| iOS | Pending | Pending | App Store Connect / TestFlight | Manual update required |
| Android | Pending | Pending | Google Play track from /tools/fastlane | Manual update required |

## 0.1.2

### Patch Changes

- Harden production API health checks.

## Mobile Release Status

| Platform | Build | Submit | Destination | Review / Live |
| --- | --- | --- | --- | --- |
| iOS | Pending | Pending | App Store Connect / TestFlight | Manual update required |
| Android | Pending | Pending | Google Play track from /tools/fastlane | Manual update required |

## 0.1.1

### Patch Changes

- Fix scraper Axiom environment labels.
- Fix release validation for clean GitHub runners.

## Mobile Release Status

| Platform | Build | Submit | Destination | Review / Live |
| --- | --- | --- | --- | --- |
| iOS | Pending | Pending | App Store Connect / TestFlight | Manual update required |
| Android | Pending | Pending | Google Play track from /tools/fastlane | Manual update required |

## 0.1.0

### Minor Changes

- Replace ImageKit with Bunny image storage.
- Limit non-production scraper runs and include all sources.
- Add feature flag management and beta opt-ins.
- Improve logger field metadata.
- Add Clerk authentication to the mobile app.
- Add OpenAPI documentation routes.
- - Add a scheduled Autmog scraper service with producer, queue processor, and dead-letter processing commands.
  - Persist scraper runs, item snapshots, and image processing state through the shared database package.
  - Upload, update, and delete scraper images through shared services-backed ImageKit storage.
  - Add `@package/images` as the shared ImageKit integration package using `@imagekit/nodejs`.
  - Expose image operations from `@package/services` with centralized logger instrumentation.
  - Add `@package/markdown` for shared Markdown conversion of scraped descriptions.
  - Normalize scraped materials, mechanisms, and product types into relational tables.
  - Replace obsolete Autmog scraper columns with canonical maker and product metadata relationships.
  - Add Grimsmo Saga, Rask, Fjell, and Norseman scraping with product variation records.
  - Store scraper images through shared product and optional variation image ownership.
  - Bound Shopify fetch waits and fail interrupted scraper runs so local retries do not stay locked.
  - Add Railway, environment variable, and database documentation for the scraper workflow.

### Patch Changes

- Add a Bunny services audit script.
- Add regenerable infrastructure diagrams.
- Convert the mobile app to shared NativeWind styling.
- Update PR template AI sections.
- Align non-production environments around preview.
- Add Railway scraper production deploys to the release flow.
- Remove legacy Field Log Expo and Autmog static app workspaces.
- Add a pull request template for generated and human-authored sections.

## Mobile Release Status

| Platform | Build | Submit | Destination | Review / Live |
| --- | --- | --- | --- | --- |
| iOS | Pending | Pending | App Store Connect / TestFlight | Manual update required |
| Android | Pending | Pending | Google Play track from /tools/fastlane | Manual update required |

## 0.0.1

### Minor Changes

- Add release automation and API versioning.

## Mobile Release Status

| Platform | Build | Submit | Destination | Review / Live |
| --- | --- | --- | --- | --- |
| iOS | Pending | Pending | App Store Connect / TestFlight | Manual update required |
| Android | Pending | Pending | Google Play track from /tools/fastlane | Manual update required |
