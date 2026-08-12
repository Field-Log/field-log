import { type JobsOptions, Queue } from "bullmq";
import type { Redis } from "ioredis";
import {
  type ScraperImageJob,
  type ScraperItemJob,
  scraperQueueNames,
} from "../scraper-types.js";

const defaultJobOptions: JobsOptions = {
  attempts: 5,
  backoff: {
    delay: 30_000,
    type: "exponential",
  },
  removeOnComplete: {
    age: 60 * 60 * 24,
    count: 1_000,
  },
  removeOnFail: {
    age: 60 * 60 * 24 * 7,
  },
};

export type ScraperQueues = {
  close: () => Promise<void>;
  images: Queue<ScraperImageJob>;
  items: Queue<ScraperItemJob>;
};

export type ScraperQueueJobCounts = {
  active: number;
  delayed: number;
  waiting: number;
};

export function createScraperQueues(connection: Redis): ScraperQueues {
  const items = new Queue<ScraperItemJob>(scraperQueueNames.items, {
    connection,
    defaultJobOptions,
  });
  const images = new Queue<ScraperImageJob>(scraperQueueNames.images, {
    connection,
    defaultJobOptions,
  });

  return {
    async close() {
      await Promise.all([items.close(), images.close()]);
    },
    images,
    items,
  };
}

export async function removeCompletedJobsById<TJobData>(
  queue: Queue<TJobData>,
  jobIds: readonly string[],
) {
  let removed = 0;

  for (const jobId of new Set(jobIds)) {
    const job = await queue.getJob(jobId);

    if (!job || (await job.getState()) !== "completed") {
      continue;
    }

    await job.remove();
    removed += 1;
  }

  return removed;
}

export async function getScraperQueueJobCounts(
  queues: Pick<ScraperQueues, "images" | "items">,
) {
  const [items, images] = await Promise.all([
    queues.items.getJobCounts("active", "delayed", "waiting"),
    queues.images.getJobCounts("active", "delayed", "waiting"),
  ]);

  return {
    images: normalizeQueueCounts(images),
    items: normalizeQueueCounts(items),
  };
}

export function hasActionableQueueJobs(counts: {
  images: ScraperQueueJobCounts;
  items: ScraperQueueJobCounts;
}) {
  return (
    counts.images.active +
      counts.images.delayed +
      counts.images.waiting +
      counts.items.active +
      counts.items.delayed +
      counts.items.waiting >
    0
  );
}

function normalizeQueueCounts(counts: Partial<ScraperQueueJobCounts>) {
  return {
    active: counts.active ?? 0,
    delayed: counts.delayed ?? 0,
    waiting: counts.waiting ?? 0,
  };
}
