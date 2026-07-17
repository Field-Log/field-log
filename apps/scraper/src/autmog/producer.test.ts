import { createNoopLogger } from "@package/logger";
import { describe, expect, it, vi } from "vitest";
import type { ScraperQueues } from "../queue/queues.js";
import { runAutmogProducer } from "./producer.js";

describe("runAutmogProducer", () => {
  it("fetches Autmog products and enqueues item and archive jobs", async () => {
    const addBulk = vi.fn().mockResolvedValue([]);
    const completedJob = {
      getState: vi.fn().mockResolvedValue("completed"),
      remove: vi.fn().mockResolvedValue(undefined),
    };
    const waitingJob = {
      getState: vi.fn().mockResolvedValue("waiting"),
      remove: vi.fn().mockResolvedValue(undefined),
    };
    const getJob = vi
      .fn()
      .mockResolvedValueOnce(completedJob)
      .mockResolvedValueOnce(waitingJob);
    const queues = {
      close: vi.fn(),
      images: { addBulk: vi.fn() },
      items: { addBulk, getJob },
    } as unknown as ScraperQueues;
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          products: [
            {
              available: true,
              body_html: "<p>36 click pen clipless Pilot G2.</p>",
              created_at: "2026-01-01T00:00:00Z",
              handle: "36-click-pen",
              id: 123,
              images: [],
              product_type: "Pens",
              published_at: "2026-01-02T00:00:00Z",
              tags: ["pen"],
              title: "36 Click Pen Clipless Pilot G2",
              updated_at: "2026-01-03T00:00:00Z",
              variants: [],
              vendor: "Autmog",
            },
          ],
        }),
      ),
    );

    const result = await runAutmogProducer({
      fetch: fetcher,
      logger: createNoopLogger({ app: "scraper" }),
      queues,
    });

    expect(result.fetchedCount).toBe(1);
    expect(result.removedCompletedItemJobs).toBe(1);
    expect(completedJob.remove).toHaveBeenCalledTimes(1);
    expect(waitingJob.remove).not.toHaveBeenCalled();
    expect(addBulk).toHaveBeenCalledTimes(1);
    const [jobs] = addBulk.mock.calls[0] ?? [];
    expect(jobs).toHaveLength(2);
    expect(jobs[0]).toMatchObject({
      data: {
        source: "autmog",
        type: "autmog.pen",
      },
      name: "autmog.pen",
    });
    expect(jobs[0].opts.jobId).toMatch(/^autmog--pen--123--sha256%3A/);
    expect(jobs[1]).toMatchObject({
      data: {
        seenSourceProductIds: ["123"],
        source: "autmog",
        type: "autmog.archiveMissing",
      },
      name: "autmog.archiveMissing",
    });
  });
});
