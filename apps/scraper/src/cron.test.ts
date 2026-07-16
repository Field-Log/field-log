import { describe, expect, it } from "vitest";
import { getRecurringTaskDueState } from "./cron.js";

describe("Railway scraper cron", () => {
  it("runs a recurring task that has never completed", () => {
    expect(
      getRecurringTaskDueState({
        intervalMinutes: 60,
        lastRunAt: null,
        now: new Date("2026-07-16T12:00:00.000Z"),
      }),
    ).toEqual({
      due: true,
      reason: "never-run",
    });
  });

  it("skips a recurring task before the interval has elapsed", () => {
    expect(
      getRecurringTaskDueState({
        intervalMinutes: 60,
        lastRunAt: "2026-07-16T11:15:00.000Z",
        now: new Date("2026-07-16T12:00:00.000Z"),
      }),
    ).toEqual({
      due: false,
      lastRunAt: "2026-07-16T11:15:00.000Z",
      minutesSinceLastRun: 45,
      nextRunAt: "2026-07-16T12:15:00.000Z",
      reason: "interval-not-elapsed",
    });
  });

  it("runs a recurring task after the interval has elapsed", () => {
    expect(
      getRecurringTaskDueState({
        intervalMinutes: 60,
        lastRunAt: "2026-07-16T11:00:00.000Z",
        now: new Date("2026-07-16T12:02:00.000Z"),
      }),
    ).toEqual({
      due: true,
      lastRunAt: "2026-07-16T11:00:00.000Z",
      minutesSinceLastRun: 62,
      nextRunAt: "2026-07-16T12:00:00.000Z",
      reason: "interval-elapsed",
    });
  });
});
