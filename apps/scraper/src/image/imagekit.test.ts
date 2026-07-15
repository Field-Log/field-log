import { describe, expect, it } from "vitest";
import { createImageStorage } from "./imagekit.js";

describe("createImageStorage", () => {
  it("skips uploads and deletes in dry-run mode", async () => {
    const storage = createImageStorage({ dryRun: true });

    await expect(
      storage.uploadAutmogPenImage({
        sourceHash: "sha256:abc",
        sourceImageId: "123",
        sourceProductId: "456",
        sourceUrl: "https://cdn.shopify.com/image.jpg",
      }),
    ).resolves.toBeNull();
    await expect(storage.deleteFile("file-id")).resolves.toBe("skipped");
  });

  it("requires ImageKit config outside dry-run mode", () => {
    expect(() => createImageStorage({})).toThrow(
      "ImageKit configuration is required unless dry-run is on.",
    );
  });
});
