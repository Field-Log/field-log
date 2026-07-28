import { describe, expect, it } from "vitest";
import {
  getSourceScrapeLimit,
  nonProductionSourceScrapeLimit,
} from "./source-limit.js";

describe("getSourceScrapeLimit", () => {
  it("does not limit production source scrapes", () => {
    expect(getSourceScrapeLimit("production")).toBeUndefined();
  });

  it("limits non-production source scrapes", () => {
    expect(getSourceScrapeLimit("development")).toBe(
      nonProductionSourceScrapeLimit,
    );
    expect(getSourceScrapeLimit("preview")).toBe(
      nonProductionSourceScrapeLimit,
    );
    expect(getSourceScrapeLimit("staging")).toBe(
      nonProductionSourceScrapeLimit,
    );
  });

  it("treats missing APP_ENV as local development", () => {
    expect(getSourceScrapeLimit(undefined)).toBe(
      nonProductionSourceScrapeLimit,
    );
  });
});
