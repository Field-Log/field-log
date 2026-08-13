import { describe, expect, it } from "vitest";
import { getTmpImageSyncValues, isTmpImageSyncNoop } from "./images.js";

describe("tmp image sync", () => {
  it("treats unchanged active image metadata as a no-op", () => {
    const now = new Date("2026-08-12T12:00:00.000Z");
    const values = getTmpImageSyncValues({
      image: {
        altText: "Front",
        height: 800,
        position: 1,
        sourceHash: "sha256:image",
        sourceImageId: "gid://shopify/ProductImage/1",
        sourceUrl: "https://example.com/front.jpg",
        width: 1200,
      },
      now,
      productId: 100,
      productVariationId: 200,
      shouldUpload: false,
      status: "uploaded",
    });

    expect(
      isTmpImageSyncNoop(
        {
          ...values,
          deletedAt: null,
          pendingDeleteAt: null,
        },
        values,
      ),
    ).toBe(true);
  });

  it("updates when image metadata changes", () => {
    const now = new Date("2026-08-12T12:00:00.000Z");
    const values = getTmpImageSyncValues({
      image: {
        altText: "Front",
        height: 800,
        position: 1,
        sourceHash: "sha256:image",
        sourceImageId: "gid://shopify/ProductImage/1",
        sourceUrl: "https://example.com/front.jpg",
        width: 1200,
      },
      now,
      productId: 100,
      productVariationId: 200,
      shouldUpload: false,
      status: "uploaded",
    });

    expect(
      isTmpImageSyncNoop(
        {
          ...values,
          altText: "Old front",
          deletedAt: null,
          pendingDeleteAt: null,
        },
        values,
      ),
    ).toBe(false);
  });
});
