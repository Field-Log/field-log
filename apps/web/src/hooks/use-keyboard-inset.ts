import * as React from "react";

type ViewportMetrics = {
  height: number;
  offsetTop: number;
};

/**
 * Height (px) that the on-screen keyboard overlaps the layout viewport.
 *
 * iOS Safari does not shrink the layout viewport when the software keyboard
 * opens; it overlays the keyboard and shifts the *visual* viewport instead. A
 * `position: fixed` element anchored with `bottom` therefore stays pinned to
 * the bottom of the (unchanged) layout viewport — behind the keyboard — which
 * is why a docked search field appears detached and jumps while typing.
 *
 * The keyboard fills the gap between the bottom of the visual viewport
 * (`offsetTop + height`) and the bottom of the layout viewport, so a fixed
 * element can add this value to its `bottom` to sit flush on the keyboard tray.
 */
export function keyboardInsetFromViewport(
  layoutHeight: number,
  viewport: ViewportMetrics,
) {
  // Clamp to avoid sub-pixel negatives while the keyboard is closed.
  return Math.max(0, layoutHeight - viewport.height - viewport.offsetTop);
}

/**
 * Tracks the on-screen keyboard inset via the VisualViewport API. Returns 0 on
 * the server, in browsers without VisualViewport, and whenever the keyboard is
 * closed. Listeners only attach while `enabled` is true so we don't do viewport
 * bookkeeping when nothing is docked to the keyboard.
 */
export function useKeyboardInset(enabled: boolean) {
  const [inset, setInset] = React.useState(0);

  React.useEffect(() => {
    const viewport = window.visualViewport;

    if (!(enabled && viewport)) {
      setInset(0);
      return;
    }

    const update = () => {
      setInset(
        keyboardInsetFromViewport(window.innerHeight, {
          height: viewport.height,
          offsetTop: viewport.offsetTop,
        }),
      );
    };

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);

    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, [enabled]);

  return inset;
}
