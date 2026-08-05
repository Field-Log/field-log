import { describe, expect, it } from "vitest";
import {
  nativeDarkColors,
  nativeLightColors,
  nativeNavigationTheme,
  nativePlaceholders,
  nativeStatusBar,
} from "./index";

describe("@package/theme native exports", () => {
  it("keeps native colors aligned with canonical web tokens", () => {
    expect(nativeLightColors.background).toBe("#FFFFFF");
    expect(nativeLightColors.foreground).toBe("#0A0A0A");
    expect(nativeDarkColors.primary).toBe("#FCEC0A");
    expect(nativeDarkColors.accent).toBe("#2B2A5C");
  });

  it("exports native-only semantic consumers", () => {
    expect(nativeNavigationTheme.colors.background).toBe(
      nativeDarkColors.background,
    );
    expect(nativeStatusBar.backgroundColor).toBe(nativeDarkColors.background);
    expect(nativePlaceholders.textInput).toBe(nativeDarkColors.mutedForeground);
  });
});
