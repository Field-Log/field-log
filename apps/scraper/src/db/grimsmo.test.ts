import { describe, expect, it } from "vitest";
import { shouldUpdateGrimsmoVariation } from "./grimsmo.js";

describe("Grimsmo variation sync", () => {
  it("skips unchanged inventory variations", () => {
    expect(
      shouldUpdateGrimsmoVariation({
        existing: {
          archivedAt: null,
          detailsHash: "sha256:details",
          imageSetHash: "sha256:images",
          sourceCollection: "inventory",
        },
        next: {
          archivedAt: null,
          detailsHash: "sha256:details",
          imageSetHash: "sha256:images",
          sourceCollection: "inventory",
        },
      }),
    ).toBe(false);
  });

  it("updates archive transitions even when hashes are unchanged", () => {
    expect(
      shouldUpdateGrimsmoVariation({
        existing: {
          archivedAt: null,
          detailsHash: "sha256:details",
          imageSetHash: "sha256:images",
          sourceCollection: "inventory",
        },
        next: {
          archivedAt: new Date("2026-08-12T12:00:00.000Z"),
          detailsHash: "sha256:details",
          imageSetHash: "sha256:images",
          sourceCollection: "archive",
        },
      }),
    ).toBe(true);
  });
});
