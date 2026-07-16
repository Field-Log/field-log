import type { Database } from "@package/database";
import { type Logger, loggerMessages } from "@package/logger";
import { type Job, type Queue, Worker } from "bullmq";
import type { Redis } from "ioredis";
import {
  archiveMissingAutmogPens,
  getAutmogImageForProcessing,
  markAutmogImageDeleted,
  markAutmogImageFailed,
  markAutmogImageUploaded,
  syncAutmogPen,
} from "../db/autmog.js";
import type { ImageStorage } from "../image/imagekit.js";
import {
  type ScraperImageJob,
  type ScraperItemJob,
  scraperQueueNames,
  scraperSources,
} from "../scraper-types.js";
import {
  getAutmogImageDeleteJobId,
  getAutmogImageUploadJobId,
} from "./job-ids.js";
import type { ScraperQueues } from "./queues.js";

export type QueueDrainStats = {
  completed: number;
  failed: number;
  skipped: number;
};

export type RunQueueProcessorOptions = {
  batchSize: {
    images: number;
    items: number;
  };
  concurrency: number;
  connection: Redis;
  db: Database;
  imageStorage: ImageStorage;
  logger: Logger;
  queues: ScraperQueues;
};

export type RunQueueProcessorResult = {
  images: QueueDrainStats;
  items: QueueDrainStats;
};

export type QueueDeadLetterStats = {
  failed: number;
  requeueFailed: number;
  requeued: number;
};

export type RunQueueDeadLetterProcessorOptions = {
  batchSize: {
    images: number;
    items: number;
  };
  logger: Logger;
  queues: ScraperQueues;
};

export type RunQueueDeadLetterProcessorResult = {
  images: QueueDeadLetterStats;
  items: QueueDeadLetterStats;
};

export async function runQueueProcessor({
  batchSize,
  concurrency,
  connection,
  db,
  imageStorage,
  logger,
  queues,
}: RunQueueProcessorOptions): Promise<RunQueueProcessorResult> {
  const startedAt = Date.now();
  logger.info(loggerMessages.scraper.processor.started, {
    attributes: {
      imageBatchSize: batchSize.images,
      itemBatchSize: batchSize.items,
      queueConcurrency: concurrency,
    },
  });

  try {
    const items = await drainQueue<ScraperItemJob>({
      batchSize: batchSize.items,
      concurrency,
      connection,
      handler: (job) => processItemJob({ db, job, logger, queues }),
      logger,
      queueName: scraperQueueNames.items,
    });
    const images = await drainQueue<ScraperImageJob>({
      batchSize: batchSize.images,
      concurrency,
      connection,
      handler: (job) => processImageJob({ db, imageStorage, job, logger }),
      logger,
      queueName: scraperQueueNames.images,
    });

    logger.info(loggerMessages.scraper.processor.completed, {
      attributes: {
        durationMs: Date.now() - startedAt,
        failedImageJobs: images.failed,
        failedItemJobs: items.failed,
        processedImageJobs: images.completed,
        processedItemJobs: items.completed,
        skippedImageJobs: images.skipped,
      },
    });

    return {
      images,
      items,
    };
  } catch (error) {
    logger.error(loggerMessages.scraper.processor.failed, {
      attributes: {
        durationMs: Date.now() - startedAt,
      },
      error,
    });
    throw error;
  }
}

export async function runQueueDeadLetterProcessor({
  batchSize,
  logger,
  queues,
}: RunQueueDeadLetterProcessorOptions): Promise<RunQueueDeadLetterProcessorResult> {
  const startedAt = Date.now();
  logger.info(loggerMessages.scraper.queue.deadLetterStarted, {
    attributes: {
      imageBatchSize: batchSize.images,
      itemBatchSize: batchSize.items,
    },
  });

  try {
    const items = await processDeadLetters({
      batchSize: batchSize.items,
      logger,
      queue: queues.items,
      queueName: scraperQueueNames.items,
    });
    const images = await processDeadLetters({
      batchSize: batchSize.images,
      logger,
      queue: queues.images,
      queueName: scraperQueueNames.images,
    });

    logger.info(loggerMessages.scraper.queue.deadLetterCompleted, {
      attributes: {
        durationMs: Date.now() - startedAt,
        failedImageJobs: images.failed,
        failedItemJobs: items.failed,
        requeueFailedImageJobs: images.requeueFailed,
        requeueFailedItemJobs: items.requeueFailed,
        requeuedImageJobs: images.requeued,
        requeuedItemJobs: items.requeued,
      },
    });

    return {
      images,
      items,
    };
  } catch (error) {
    logger.error(loggerMessages.scraper.queue.deadLetterFailed, {
      attributes: {
        durationMs: Date.now() - startedAt,
      },
      error,
    });
    throw error;
  }
}

async function processItemJob({
  db,
  job,
  logger,
  queues,
}: {
  db: Database;
  job: Job<ScraperItemJob>;
  logger: Logger;
  queues: ScraperQueues;
}) {
  const startedAt = Date.now();

  try {
    if (job.data.type === "autmog.archiveMissing") {
      const archivedCount = await archiveMissingAutmogPens(
        db,
        job.data.seenSourceProductIds,
      );
      logger.info(loggerMessages.scraper.database.archiveCompleted, {
        attributes: {
          archivedCount,
          durationMs: Date.now() - startedAt,
          jobId: job.id,
          source: scraperSources.autmog,
        },
      });
      logger.info(loggerMessages.scraper.processor.itemJobCompleted, {
        attributes: {
          durationMs: Date.now() - startedAt,
          jobId: job.id,
          source: scraperSources.autmog,
          type: job.data.type,
        },
      });
      return;
    }

    const result = await syncAutmogPen(db, job.data.item);
    const imageJobs = [
      ...result.uploadImageJobs.map((imageJob) => ({
        data: {
          imageId: imageJob.imageId,
          source: scraperSources.autmog,
          type: "autmog.image.upload" as const,
        },
        name: "autmog.image.upload",
        opts: {
          jobId: getAutmogImageUploadJobId(imageJob),
        },
      })),
      ...result.deleteImageJobs.map((imageJob) => ({
        data: {
          imageId: imageJob.imageId,
          source: scraperSources.autmog,
          type: "autmog.image.delete" as const,
        },
        name: "autmog.image.delete",
        opts: {
          jobId: getAutmogImageDeleteJobId(imageJob),
        },
      })),
    ];

    if (imageJobs.length > 0) {
      await queues.images.addBulk(imageJobs);
    }

    logger.info(loggerMessages.scraper.database.mutationCompleted, {
      attributes: {
        created: result.created,
        deleteImageJobs: result.deleteImageJobs.length,
        durationMs: Date.now() - startedAt,
        enqueuedImageJobs: imageJobs.length,
        dbResponse: result.dbResponse,
        jobId: job.id,
        mutationInput: result.mutationInput,
        source: scraperSources.autmog,
        sourceProductId: job.data.item.sourceProductId,
        updated: result.updated,
        uploadImageJobs: result.uploadImageJobs.length,
        versioned: result.versioned,
      },
    });
    logger.info(loggerMessages.scraper.processor.itemJobCompleted, {
      attributes: {
        durationMs: Date.now() - startedAt,
        jobId: job.id,
        source: scraperSources.autmog,
        sourceProductId: job.data.item.sourceProductId,
        type: job.data.type,
      },
    });
  } catch (error) {
    logger.error(loggerMessages.scraper.database.mutationFailed, {
      attributes: {
        durationMs: Date.now() - startedAt,
        jobId: job.id,
        source: job.data.source,
        type: job.data.type,
      },
      error,
    });
    logger.error(loggerMessages.scraper.processor.itemJobFailed, {
      attributes: {
        durationMs: Date.now() - startedAt,
        jobId: job.id,
        source: job.data.source,
        type: job.data.type,
      },
      error,
    });
    throw error;
  }
}

async function processImageJob({
  db,
  imageStorage,
  job,
  logger,
}: {
  db: Database;
  imageStorage: ImageStorage;
  job: Job<ScraperImageJob>;
  logger: Logger;
}) {
  const startedAt = Date.now();

  try {
    const row = await getAutmogImageForProcessing(db, job.data.imageId);

    if (!row) {
      logger.warn(loggerMessages.scraper.processor.imageJobCompleted, {
        attributes: {
          durationMs: Date.now() - startedAt,
          imageId: job.data.imageId,
          jobId: job.id,
          skipped: true,
          skipReason: "missing-image-row",
          type: job.data.type,
        },
      });
      return "skipped";
    }

    if (job.data.type === "autmog.image.upload") {
      if (row.image.status !== "pending_upload") {
        logger.info(loggerMessages.scraper.image.uploadSkipped, {
          attributes: {
            durationMs: Date.now() - startedAt,
            imageId: row.image.id,
            jobId: job.id,
            status: row.image.status,
          },
        });
        return "skipped";
      }

      const result = await imageStorage.uploadAutmogPenImage({
        sourceHash: row.image.sourceHash,
        sourceImageId: row.image.sourceImageId,
        sourceProductId: row.pen.sourceProductId,
        sourceUrl: row.image.sourceUrl,
      });

      if (!result) {
        logger.info(loggerMessages.scraper.image.uploadSkipped, {
          attributes: {
            durationMs: Date.now() - startedAt,
            imageId: row.image.id,
            jobId: job.id,
            skipReason: "dry-run",
          },
        });
        return "skipped";
      }

      await markAutmogImageUploaded(db, {
        imageId: row.image.id,
        imageKitFileId: result.fileId,
        imageKitPath: result.filePath,
        imageKitUrl: result.url,
      });
      logger.info(loggerMessages.scraper.image.uploadCompleted, {
        attributes: {
          durationMs: Date.now() - startedAt,
          imageId: row.image.id,
          jobId: job.id,
          sourceProductId: row.pen.sourceProductId,
        },
      });
      return "completed";
    }

    if (row.image.status !== "pending_delete") {
      logger.info(loggerMessages.scraper.image.deleteSkipped, {
        attributes: {
          durationMs: Date.now() - startedAt,
          imageId: row.image.id,
          jobId: job.id,
          status: row.image.status,
        },
      });
      return "skipped";
    }

    if (row.image.imageKitFileId) {
      const deleteResult = await imageStorage.deleteFile(
        row.image.imageKitFileId,
      );

      if (deleteResult === "skipped") {
        logger.info(loggerMessages.scraper.image.deleteSkipped, {
          attributes: {
            durationMs: Date.now() - startedAt,
            imageId: row.image.id,
            jobId: job.id,
            skipReason: "dry-run",
          },
        });
        return "skipped";
      }
    }

    await markAutmogImageDeleted(db, row.image.id);
    logger.info(loggerMessages.scraper.image.deleteCompleted, {
      attributes: {
        durationMs: Date.now() - startedAt,
        imageId: row.image.id,
        jobId: job.id,
        sourceProductId: row.pen.sourceProductId,
      },
    });
    return "completed";
  } catch (error) {
    await markAutmogImageFailed(db, {
      imageId: job.data.imageId,
      status:
        job.data.type === "autmog.image.upload"
          ? "upload_failed"
          : "delete_failed",
    });
    logger.error(
      job.data.type === "autmog.image.upload"
        ? loggerMessages.scraper.image.uploadFailed
        : loggerMessages.scraper.image.deleteFailed,
      {
        attributes: {
          durationMs: Date.now() - startedAt,
          imageId: job.data.imageId,
          jobId: job.id,
          type: job.data.type,
        },
        error,
      },
    );
    logger.error(loggerMessages.scraper.processor.imageJobFailed, {
      attributes: {
        durationMs: Date.now() - startedAt,
        imageId: job.data.imageId,
        jobId: job.id,
        type: job.data.type,
      },
      error,
    });
    throw error;
  }
}

async function drainQueue<TJobData>({
  batchSize,
  concurrency,
  connection,
  handler,
  logger,
  queueName,
}: {
  batchSize: number;
  concurrency: number;
  connection: Redis;
  handler: (job: Job<TJobData>) => Promise<"completed" | "skipped" | void>;
  logger: Logger;
  queueName: string;
}): Promise<QueueDrainStats> {
  const startedAt = Date.now();
  const stats: QueueDrainStats = {
    completed: 0,
    failed: 0,
    skipped: 0,
  };

  return new Promise((resolve, reject) => {
    let closed = false;
    let worker: Worker<TJobData> | null = null;
    const timeout = setTimeout(
      () => {
        void closeWorker().then(() => resolve(stats), reject);
      },
      5 * 60 * 1000,
    );
    const closeWorker = async () => {
      if (closed) {
        return;
      }

      closed = true;
      clearTimeout(timeout);
      await worker?.close();
      logger.info(loggerMessages.scraper.queue.drainCompleted, {
        attributes: {
          completedJobs: stats.completed,
          durationMs: Date.now() - startedAt,
          failedJobs: stats.failed,
          queue: queueName,
          skippedJobs: stats.skipped,
        },
      });
    };
    const maybeCloseWorker = () => {
      if (stats.completed + stats.failed + stats.skipped >= batchSize) {
        void closeWorker().then(() => resolve(stats), reject);
      }
    };

    worker = new Worker<TJobData>(
      queueName,
      async (job) => {
        const result = await handler(job);

        if (result === "skipped") {
          stats.skipped += 1;
        } else {
          stats.completed += 1;
        }

        maybeCloseWorker();
      },
      {
        autorun: true,
        concurrency,
        connection,
      },
    );

    worker.on("drained", () => {
      void closeWorker().then(() => resolve(stats), reject);
    });
    worker.on("failed", () => {
      stats.failed += 1;
      maybeCloseWorker();
    });
    worker.on("error", (error) => {
      logger.error(loggerMessages.scraper.queue.drainFailed, {
        attributes: {
          queue: queueName,
        },
        error,
      });
      void closeWorker().then(() => reject(error), reject);
    });
  });
}

async function processDeadLetters<TJobData>({
  batchSize,
  logger,
  queue,
  queueName,
}: {
  batchSize: number;
  logger: Logger;
  queue: Queue<TJobData>;
  queueName: string;
}): Promise<QueueDeadLetterStats> {
  const startedAt = Date.now();
  const failedCount = await queue.getFailedCount();
  const jobs = batchSize > 0 ? await queue.getFailed(0, batchSize - 1) : [];
  const stats: QueueDeadLetterStats = {
    failed: failedCount,
    requeueFailed: 0,
    requeued: 0,
  };

  for (const job of jobs) {
    try {
      await job.retry("failed");
      stats.requeued += 1;
    } catch (error) {
      stats.requeueFailed += 1;
      logger.error(loggerMessages.scraper.queue.deadLetterFailed, {
        attributes: {
          attemptsMade: job.attemptsMade,
          failedReason: job.failedReason,
          jobId: job.id,
          jobName: job.name,
          queue: queueName,
        },
        error,
      });
    }
  }

  logger.info(loggerMessages.scraper.queue.deadLetterCompleted, {
    attributes: {
      batchSize,
      durationMs: Date.now() - startedAt,
      failedJobs: failedCount,
      queue: queueName,
      requeueFailedJobs: stats.requeueFailed,
      requeuedJobs: stats.requeued,
    },
  });

  return stats;
}
