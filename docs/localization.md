# Localization

Locale-prefixed URLs are not needed for this release. The archive content is
the same for every supported locale, and the selected language is resolved from
saved account settings, local preference, and browser/device language.

## QA Record

Checked on 2026-08-10 for ENG-62.

- Web: app-owned archive, settings, account, admin feature-flag, lightbox,
  drawer, sheet, and sidebar labels route through the local web UI catalog.
- Mobile: app-owned auth, account, beta feature, library, stats, add-log,
  add-item, edit-item, and item-detail labels route through the local mobile UI
  catalog.
- API: localized error responses include both a stable `error.key` and localized
  `error.message`.
- Fallback: unsupported browser/device languages are passed through
  `resolveLocale(...)`, which falls back to English.
- Clerk: web and mobile `ClerkProvider` instances pass `getClerkLocalization`
  for the active locale, so Clerk sign-in and sign-up copy changes for es-MX.

## Third-Party Surfaces

- Clerk owns hosted/sign-in/sign-up/account profile component copy; this release
  passes Clerk's localization object and does not override individual Clerk
  strings.
- Base UI and Vaul drawer/sheet primitives do not own visible copy in this app;
  app wrappers provide localized titles, descriptions, close text, and ARIA
  labels.
- React Native Picker and Expo ImagePicker do not expose app-owned text here
  beyond the labels/placeholders supplied by Field Log.
