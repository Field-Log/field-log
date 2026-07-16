# Mobile Release With Fastlane

`apps/mobile` uses Expo for the React Native app, but production store builds
should use fastlane instead of Expo's paid EAS Build cloud service. Fastlane is
an open-source CLI that runs on local or CI infrastructure. Android builds can
run on Linux or macOS; iOS release builds require macOS with Xcode.

## Release Model

Production mobile releases are tied to the repo release tag:

1. `pnpm release` determines the next version from Changesets.
2. The release commit updates `apps/mobile/app.json` `expo.version`.
3. The `v*` tag workflow builds web/API and runs production database migrations.
4. Mobile production builds are created from the same tagged SHA with fastlane.
5. Fastlane uploads Android to Google Play and iOS to App Store Connect or
   TestFlight.

Apple and Google review happens after upload, so mobile availability can lag
behind web and API production. Minor and patch releases must stay compatible
with the currently available mobile app. Major releases must keep API and
database changes backward-compatible for at least one major mobile version.

The `Mobile Release` GitHub workflow runs iOS and Android as separate jobs on
macOS runners:

| Platform | Runner labels |
| --- | --- |
| iOS | `macOS`, `mobile-release`, `ios` |
| Android | `macOS`, `mobile-release`, `android` |

Mobile release job failures do not roll back the production API deploy. The
GitHub Release body includes a mobile status table that each platform job
updates after its fastlane run.

## Version Policy

The API exposes `GET /api/v0/mobile-version` for launch and resume checks in
the mobile app. Configure it from `/apps/api` production secrets:

| Variable | What it controls |
| --- | --- |
| `MOBILE_MIN_SUPPORTED_VERSION` | Versions below this value show a blocking update screen. |
| `MOBILE_LATEST_VERSION` | Versions below this value can show a recommended update banner. |
| `MOBILE_UPDATE_SEVERITY` | `none`, `recommended`, or `required`. |
| `MOBILE_IOS_STORE_URL` | Store URL opened from iOS update prompts. |
| `MOBILE_ANDROID_STORE_URL` | Store URL opened from Android update prompts. |

Use the current API major in the route path. The baseline `0.x` release uses
`/api/v0`; a future major release should add `/api/v<major>` while keeping the
previous major route available through the mobile compatibility window.

## EAS Build

EAS Build is not production-only; it supports development, preview/internal, and
production profiles. In this repo it is optional for development builds only.
Do not use EAS Build or EAS Submit for the production release path unless the
release plan is changed again.

## Infisical Paths

Use two Infisical paths for mobile release work:

| Path | Purpose |
| --- | --- |
| `/apps/mobile` | App runtime values compiled into the mobile bundle. |
| `/tools/fastlane` | Build, signing, and store-upload credentials used by fastlane. |

Local production build commands load both `/tools/fastlane` and `/apps/mobile`
from the `prod` Infisical environment. Submit-only commands load
`/tools/fastlane` from `prod`.

Preview mobile builds, when needed, should use Infisical `preview` for
`/apps/mobile` and `/tools/fastlane`. Development builds normally use local
Expo dev-client commands and Infisical `dev` values from `/apps/mobile`; they
do not need production store credentials.

## `/tools/fastlane` Values

Create `/tools/fastlane` in Infisical. At minimum, production release commands
need these values in the `prod` environment.

| Variable | What it is for |
| --- | --- |
| `APPLE_TEAM_ID` | Apple Developer Team ID used for signing and upload. |
| `ASC_KEY_ID` | App Store Connect API key ID. |
| `ASC_ISSUER_ID` | App Store Connect API issuer ID. |
| `ASC_KEY_P8_BASE64` | Base64-encoded App Store Connect API private key content. |
| `MATCH_GIT_URL` | Private repository URL for fastlane match signing assets. |
| `MATCH_PASSWORD` | Encryption password for the match repository. |
| `MATCH_GIT_BASIC_AUTHORIZATION` | Optional auth header for the match repository. |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64` | Base64-encoded Google Play service account JSON. |
| `GOOGLE_PLAY_TRACK` | Google Play track, such as `internal`, `beta`, or `production`. |
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded Android release keystore. |
| `ANDROID_KEYSTORE_PASSWORD` | Android keystore password. |
| `ANDROID_KEY_ALIAS` | Android signing key alias. |
| `ANDROID_KEY_PASSWORD` | Android signing key password. |

Prefer least-privilege service accounts:

- App Store Connect API key: app-management permissions for this app only when
  possible.
- Google Play service account: access only to the Field Log app and the tracks
  fastlane needs to upload to.
- Match repository credentials: read/write access only to the signing-assets
  repository.

## Commands

Production build commands:

```sh
pnpm build:mobile:fastlane:android
pnpm build:mobile:fastlane:ios
```

Production submit commands:

```sh
pnpm submit:mobile:fastlane:android
pnpm submit:mobile:fastlane:ios
```

Build-and-submit commands:

```sh
pnpm release:mobile:fastlane:android
pnpm release:mobile:fastlane:ios
```

These commands run `bundle exec fastlane` through the Infisical runner. Install
Ruby dependencies from `apps/mobile` before running them:

```sh
cd apps/mobile
bundle install
```

## Fastlane Setup

The implementation should add:

- `apps/mobile/fastlane/Fastfile` with `android build`, `android submit`,
  `android release`, `ios build`, `ios submit`, and `ios release` lanes.
- Android signing material generation from `ANDROID_KEYSTORE_BASE64`.
- App Store Connect API key generation from `ASC_*` values.
- Google Play service account JSON generation from
  `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64`.
- `expo prebuild` or committed native projects before native compilation.

If using Expo continuous native generation, fastlane lanes should run
`pnpm exec expo prebuild --clean --platform <platform>` before native build
steps. If native projects become committed, lanes can skip prebuild and build
the checked-in native projects directly.

## Development And Preview Builds

EAS Build can still be useful for paid cloud development builds, but it is not
required. Alternatives:

- Local Expo dev builds: `pnpm dev:ios:no-api` and `pnpm dev:android:no-api`.
- Existing optional EAS development commands: `pnpm dev:eas:ios` and
  `pnpm dev:eas:android`.
- Fastlane preview lanes, if added later, using Infisical `preview` and internal
  distribution tracks.

Only configure `/tools/fastlane` in `dev` or `preview` if you intend to build
signed internal artifacts from those environments. Otherwise, keep production
signing and store-upload credentials only in Infisical `prod`.

## References

- Expo local builds: <https://docs.expo.dev/build-reference/local-builds/>
- Expo prebuild: <https://docs.expo.dev/workflow/prebuild/>
- fastlane iOS setup: <https://docs.fastlane.tools/getting-started/ios/setup/>
- fastlane Android setup:
  <https://docs.fastlane.tools/getting-started/android/setup/>
