// Single source of truth for the compact ↔ regular ("two-pane") threshold.
//
// This mirrors Tailwind's `md` screen (min-width: 768px). Below it the app is
// the compact/phone tier (slim top bar, overlay filter drawer, thumb toolbar);
// at or above it the persistent filter sidebar / two-pane layout takes over.
// Keep this in sync with the `md:` utilities in the markup — they are the CSS
// half of the same breakpoint, this constant is the JS half (matchMedia).
export const TWO_PANE_MIN_WIDTH = 768;

// Matches viewports strictly below the two-pane threshold. The `.98` keeps the
// boundary flush with Tailwind's `min-width: 768px` so there is no dead gap for
// fractional (zoomed / hi-dpi) widths between 767 and 768.
export const compactMediaQuery = `(max-width: ${TWO_PANE_MIN_WIDTH - 0.02}px)`;
