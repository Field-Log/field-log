# Mobile Clerk Stage 2 Plan

Stage 1 keeps `apps/mobile` compatible with Expo Go by using Clerk's JavaScript custom email/password flow. Stage 2 should move the app to a development build so Clerk native components can replace the custom auth UI.

## Preconditions

- Confirm iOS bundle identifier and Android package name for Clerk Native Applications.
- Keep Apple disabled. The Clerk Expo plugin should continue to set `appleSignIn: false`.
- Confirm whether Google or any other OAuth connection will be enabled. Native OAuth requires provider credentials before enabling buttons in Clerk.

## Implementation Steps

1. Add development build scripts that use `expo run:ios` and `expo run:android`, or add EAS development build profiles if remote builds are preferred.
2. Verify `app.json` includes `expo-secure-store` and `["@clerk/expo", { "appleSignIn": false }]`.
3. Build and install a development client for iOS and Android.
4. Replace the Stage 1 auth form with `<AuthView />` from `@clerk/expo/native`, rendered in a modal at the same level as signed-in and signed-out content.
5. Replace the Stage 1 account modal with `<UserProfileView />` from `@clerk/expo/native`.
6. Keep the custom React Native user menu as the entry point for Account, Collections, and Sign out.
7. Pass `{ treatPendingAsSignedOut: false }` to `useAuth()` anywhere auth state controls native component visibility.
8. Test sign-in, sign-up, sign-out, profile dismissal, and pending session tasks on both iOS and Android development builds.

## Removal Checklist

- Remove custom sign-in/sign-up form state and handlers after `<AuthView />` is working.
- Remove custom account details UI after `<UserProfileView />` is working.
- Keep the Clerk provider, token cache, env validation, and Infisical alias.
