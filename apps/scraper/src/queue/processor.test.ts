import { loggerMessages } from "@package/logger";
import { describe, expect, it } from "vitest";
import {
  buildImageKitFolder,
  createProcessorErrorCounter,
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
        entityId: "8383420301499",
        type: "pens",
      }),
    ).toBe("/products/pens/8383420301499");
  });

  it("builds isolated preview product folders with the PR prefix", () => {
    expect(
      buildImageKitFolder({
        entityId: "8383420301499",
        prefix: "preview/pr-52",
        type: "pens",
      }),
    ).toBe("/preview/pr-52/products/pens/8383420301499");
  });

  it("normalizes surrounding slashes in the folder prefix", () => {
    expect(
      buildImageKitFolder({
        entityId: "8383420301499",
        prefix: "/preview/",
        type: "pens",
      }),
    ).toBe("/preview/products/pens/8383420301499");
  });
});
