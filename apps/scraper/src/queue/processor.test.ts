import { loggerMessages } from "@package/logger";
import { describe, expect, it } from "vitest";
import {
  buildImageKitFolder,
  createProcessorErrorCounter,
  getTmpImageFolderKey,
} from "./processor.js";

describe("createProcessorErrorCounter", () => {
  it("counts processor errors by message and total", () => {
    const counter = createProcessorErrorCounter();

    counter.record(loggerMessages.scraper.image.uploadFailed);
    counter.record(loggerMessages.scraper.image.uploadFailed);
    counter.record(loggerMessages.scraper.image.deleteFailed);

    expect(counter.summary()).toEqual({
      errorsByMessage: {
        [loggerMessages.scraper.image.deleteFailed]: 1,
        [loggerMessages.scraper.image.uploadFailed]: 2,
      },
      totalErrors: 3,
    });
  });
});

describe("buildImageKitFolder", () => {
  it("builds production product folders without a prefix", () => {
    expect(
      buildImageKitFolder({
        entityId: "1000",
      }),
    ).toBe("/products/1000");
  });

  it("builds isolated preview product folders with the PR prefix", () => {
    expect(
      buildImageKitFolder({
        entityId: "1000-1001",
        prefix: "preview/pr-52",
      }),
    ).toBe("/preview/pr-52/products/1000-1001");
  });

  it("normalizes surrounding slashes in the folder prefix", () => {
    expect(
      buildImageKitFolder({
        entityId: "1000",
        prefix: "/preview/",
      }),
    ).toBe("/preview/products/1000");
  });
});

describe("getTmpImageFolderKey", () => {
  it("uses the product id for product images", () => {
    expect(
      getTmpImageFolderKey({
        productId: 1000,
        productVariationId: null,
      }),
    ).toBe("1000");
  });

  it("combines product and variation ids for variation images", () => {
    expect(
      getTmpImageFolderKey({
        productId: 1000,
        productVariationId: 1001,
      }),
    ).toBe("1000-1001");
  });
});
