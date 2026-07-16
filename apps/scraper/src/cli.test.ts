import { describe, expect, it } from "vitest";
import { parseCommand } from "./cli.js";

describe("scraper CLI", () => {
  it("parses source scrape commands", () => {
    expect(parseCommand(["scrape", "autmog"])).toEqual({
      source: "autmog",
      type: "scrape",
    });
  });

  it("parses source scrape commands with pnpm argument separators", () => {
    expect(parseCommand(["scrape", "--", "autmog"])).toEqual({
      source: "autmog",
      type: "scrape",
    });
  });

  it("parses compact source scrape commands", () => {
    expect(parseCommand(["scrape:autmog"])).toEqual({
      source: "autmog",
      type: "scrape",
    });
  });

  it("parses queue processor commands", () => {
    expect(parseCommand(["process:queue"])).toEqual({
      type: "process:queue",
    });
  });
});
