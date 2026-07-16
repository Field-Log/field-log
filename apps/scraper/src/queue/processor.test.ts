import { loggerMessages } from "@package/logger";
import { describe, expect, it } from "vitest";
import { createProcessorErrorCounter } from "./processor.js";

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
