import { describe, expect, it, vi } from "vitest";
import {
  assertFeatureFlagSlug,
  createFlagChecker,
  defineFlag,
  isFeatureFlagSlug,
} from "./index.js";

describe("feature flag domain helpers", () => {
  it("accepts lower-kebab feature flag slugs", () => {
    expect(isFeatureFlagSlug("marketing-banner")).toBe(true);
    expect(isFeatureFlagSlug("a1-b2")).toBe(true);
    expect(defineFlag("new-library-ui")).toBe("new-library-ui");
  });

  it("rejects inconsistent feature flag slugs", () => {
    expect(isFeatureFlagSlug("MarketingBanner")).toBe(false);
    expect(isFeatureFlagSlug("marketing_banner")).toBe(false);
    expect(isFeatureFlagSlug("-marketing-banner")).toBe(false);
    expect(() => assertFeatureFlagSlug("marketing_banner")).toThrow(
      "Feature flag slug",
    );
  });

  it("creates async flag checkers through a resolver", async () => {
    const resolver = vi.fn().mockResolvedValue(true);
    const flag = createFlagChecker(resolver)("marketing-banner");

    await expect(flag({ clerkId: "user_123" })).resolves.toBe(true);
    expect(resolver).toHaveBeenCalledWith("marketing-banner", {
      clerkId: "user_123",
    });
  });
});
