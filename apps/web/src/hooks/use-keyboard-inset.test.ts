import { describe, expect, it } from "vitest";
import { keyboardInsetFromViewport } from "./use-keyboard-inset";

describe("keyboardInsetFromViewport", () => {
  it("returns the keyboard height when the visual viewport shrinks", () => {
    // 844pt layout viewport; keyboard shrinks the visible area to 508pt.
    expect(keyboardInsetFromViewport(844, { height: 508, offsetTop: 0 })).toBe(
      336,
    );
  });

  it("accounts for a visual viewport Safari has scrolled down", () => {
    expect(keyboardInsetFromViewport(844, { height: 500, offsetTop: 8 })).toBe(
      336,
    );
  });

  it("is zero when the keyboard is closed", () => {
    expect(keyboardInsetFromViewport(844, { height: 844, offsetTop: 0 })).toBe(
      0,
    );
  });

  it("never returns a negative inset", () => {
    expect(keyboardInsetFromViewport(844, { height: 850, offsetTop: 0 })).toBe(
      0,
    );
  });
});
