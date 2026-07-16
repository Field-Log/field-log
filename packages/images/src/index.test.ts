import { describe, expect, it } from "vitest";
import { createImageStorage } from "./index.js";

describe("createImageStorage", () => {
  it("skips image mutations in dry-run mode", async () => {
    const storage = createImageStorage({ dryRun: true });

    await expect(
      storage.uploadRemoteImage({
        fileName: "test.webp",
        sourceUrl: "https://cdn.example.test/image.jpg",
      }),
    ).resolves.toBeNull();
    await expect(storage.updateFile("file-id", {})).resolves.toBeNull();
    await expect(storage.deleteFile("file-id")).resolves.toBe("skipped");
  });

  it("requires ImageKit config outside dry-run mode", () => {
    expect(() => createImageStorage({})).toThrow(
      "ImageKit configuration is required unless dry-run is on.",
    );
  });
});
