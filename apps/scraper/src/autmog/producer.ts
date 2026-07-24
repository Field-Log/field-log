import { type Logger, loggerMessages } from "@package/logger";
import { getAutmogArchiveJobId, getAutmogPenJobId } from "../queue/job-ids.js";
import {
  removeCompletedJobsById,
  type ScraperQueues,
} from "../queue/queues.js";
import {
  type NormalizedAutmogPen,
  type ScraperItemJob,
  scraperSources,
} from "../scraper-types.js";
import { normalizeAutmogProduct } from "./normalize.js";
import {
  type FetchAutmogProductsOptions,
  fetchAutmogProducts,
} from "./shopify.js";

export type RunAutmogProducerOptions = FetchAutmogProductsOptions & {
  logger: Logger;
  queues: ScraperQueues;
};

export type RunAutmogProducerResult = {
  enqueuedCount: number;
  fetchedCount: number;
  items: NormalizedAutmogPen[];
  removedCompletedItemJobs: number;
};

export async function runAutmogProducer({
  logger,
  queues,
  ...fetchOptions
}: RunAutmogProducerOptions): Promise<RunAutmogProducerResult> {
  const startedAt = Date.now();
  logger.info(loggerMessages.scraper.autmog.producerStarted, {
    attributes: {
      source: scraperSources.autmog,
    },
  });

  try {
    const products = await fetchAutmogProducts(fetchOptions);
    logger.info(loggerMessages.scraper.autmog.fetchCompleted, {
      attributes: {
        durationMs: Date.now() - startedAt,
        fetchedCount: products.length,
        source: scraperSources.autmog,
      },
    });

    const items = products.map(normalizeAutmogProduct);
    const jobs: {
      data: ScraperItemJob;
      jobId: string;
      name: string;
    }[] = items.map((item) => ({
      data: {
        item,
        source: scraperSources.autmog,
        type: "autmog.pen",
      },
      jobId: getAutmogPenJobId(item),
      name: "autmog.pen",
    }));
    const seenSourceProductIds = items.map((item) => item.sourceProductId);
    jobs.push({
      data: {
        seenSourceProductIds,
        source: scraperSources.autmog,
        type: "autmog.archiveMissing",
      },
      jobId: getAutmogArchiveJobId(seenSourceProductIds),
      name: "autmog.archiveMissing",
    });

    const removedCompletedItemJobs = await removeCompletedJobsById(
      queues.items,
      jobs.map((job) => job.jobId),
    );

    await queues.items.addBulk(
      jobs.map((job) => ({
        data: job.data,
        name: job.name,
        opts: {
          jobId: job.jobId,
        },
      })),
    );

    logger.info(loggerMessages.scraper.queue.enqueueCompleted, {
      attributes: {
        enqueuedItemJobs: jobs.length,
        queue: "scraper-items",
        removedCompletedItemJobs,
        source: scraperSources.autmog,
      },
    });
    logger.info(loggerMessages.scraper.autmog.producerCompleted, {
      attributes: {
        durationMs: Date.now() - startedAt,
        enqueuedItemJobs: jobs.length,
        fetchedCount: products.length,
        removedCompletedItemJobs,
        source: scraperSources.autmog,
      },
    });

    return {
      enqueuedCount: jobs.length,
      fetchedCount: products.length,
      items,
      removedCompletedItemJobs,
    };
  } catch (error) {
    logger.error(loggerMessages.scraper.autmog.fetchFailed, {
      attributes: {
        durationMs: Date.now() - startedAt,
        source: scraperSources.autmog,
      },
      error,
    });
    logger.error(loggerMessages.scraper.queue.enqueueFailed, {
      attributes: {
        source: scraperSources.autmog,
      },
      error,
    });
    throw error;
  }
}
