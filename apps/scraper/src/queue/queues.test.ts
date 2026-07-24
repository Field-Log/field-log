import { describe, expect, it, vi } from "vitest";
import { removeCompletedJobsById } from "./queues.js";

describe("removeCompletedJobsById", () => {
  it("removes only completed jobs and de-duplicates job ids", async () => {
    const completedJob = {
      getState: vi.fn().mockResolvedValue("completed"),
      remove: vi.fn().mockResolvedValue(undefined),
    };
    const waitingJob = {
      getState: vi.fn().mockResolvedValue("waiting"),
      remove: vi.fn().mockResolvedValue(undefined),
    };
    const queue = {
      getJob: vi
        .fn()
        .mockResolvedValueOnce(completedJob)
        .mockResolvedValueOnce(waitingJob)
        .mockResolvedValueOnce(null),
    };

    await expect(
      removeCompletedJobsById(queue as never, [
        "completed-job",
        "completed-job",
        "waiting-job",
        "missing-job",
      ]),
    ).resolves.toBe(1);
    expect(queue.getJob).toHaveBeenCalledTimes(3);
    expect(completedJob.remove).toHaveBeenCalledTimes(1);
    expect(waitingJob.remove).not.toHaveBeenCalled();
  });
});
