
# System Instructions
- Before modifying or creating any frontend layout or UI code, you MUST inject the design guidelines explicitly detailed inside `/docs/design-system.md`.
- Translate all requested specs using these components directly.
- After implementing features or code changes, always run:
  - `pnpm format`
  - `pnpm test`
  - `pnpm lint`
- For changes that do not include code, such as documentation-only updates, run only `pnpm format`.
- If `pnpm lint` or `pnpm format` fail, determine whether the failure was caused by changes made during the current session. If so, fix those issues before finishing.
