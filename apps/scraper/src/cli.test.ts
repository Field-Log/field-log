import { describe, expect, it } from "vitest";
import { formatRedisEnvDebugValue, parseCommand } from "./cli.js";

describe("scraper CLI", () => {
  it("parses Railway cron commands", () => {
    expect(parseCommand(["cron:run"])).toEqual({
      type: "cron:run",
    });
  });

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

  it("parses dead-letter processor commands", () => {
    expect(parseCommand(["process:dead-letter"])).toEqual({
      type: "process:dead-letter",
    });
  });

  it("formats Redis env debug values without logging credentials", () => {
    expect(
      formatRedisEnvDebugValue("redis://user:password@example.com:6379/0"),
    ).toEqual({
      length: 40,
      present: true,
      reference: false,
      value: "redis://redacted:redacted@example.com:6379/0",
    });
    expect(formatRedisEnvDebugValue("${{scraper-queue.REDIS_URL}}")).toEqual({
      length: 28,
      present: true,
      reference: true,
      value: "${{scraper-queue.REDIS_URL}}",
    });
    expect(formatRedisEnvDebugValue(undefined)).toEqual({
      present: false,
    });
  });
});
