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
