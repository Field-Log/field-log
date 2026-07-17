import type { Database } from "@package/database";
import { type Logger, loggerMessages } from "@package/logger";
import type { ImagesService } from "@package/services";
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
  imageFolderPrefix?: string;
  imageStorage: ImagesService;
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

export type ProcessorErrorSummary = {
  errorsByMessage: Record<string, number>;
  totalErrors: number;
};

type ProcessorErrorCounter = {
  record: (message: string) => void;
  summary: () => ProcessorErrorSummary;
};

export async function runQueueProcessor({
  batchSize,
  concurrency,
  connection,
  db,
  imageFolderPrefix,
  imageStorage,
  logger,
  queues,
}: RunQueueProcessorOptions): Promise<RunQueueProcessorResult> {
  const startedAt = Date.now();
  const errorCounter = createProcessorErrorCounter();
  logger.info(loggerMessages.scraper.processor.started, {
    attributes: {
      imageFolderPrefix,
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
      handler: (job) =>
        processItemJob({ db, errorCounter, job, logger, queues }),
      logger,
      queueName: scraperQueueNames.items,
    });
    const images = await drainQueue<ScraperImageJob>({
      batchSize: batchSize.images,
      concurrency,
      connection,
      handler: (job) =>
        processImageJob({
          db,
          errorCounter,
          imageFolderPrefix,
          imageStorage,
          job,
          logger,
        }),
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
  } finally {
    logProcessorErrorSummary({
      command: "process:queue",
      durationMs: Date.now() - startedAt,
      errorCounter,
      logger,
      processor: "queue",
    });
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
  errorCounter,
  job,
  logger,
  queues,
}: {
  db: Database;
  errorCounter: ProcessorErrorCounter;
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
          sourceImageId: imageJob.sourceImageId,
          sourceUrl: imageJob.sourceUrl,
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
        jobId: job.id,
        payload: {
          dbResponse: {
            images: {
              upserted: result.dbResponse.images.upserted,
            },
          },
          mutationInput: {
            images: result.mutationInput.images,
          },
        },
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
    errorCounter.record(loggerMessages.scraper.database.mutationFailed);
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
  errorCounter,
  imageFolderPrefix,
  imageStorage,
  job,
  logger,
}: {
  db: Database;
  errorCounter: ProcessorErrorCounter;
  imageFolderPrefix?: string;
  imageStorage: ImagesService;
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
      if (!["pending_upload", "upload_failed"].includes(row.image.status)) {
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

      const result = await imageStorage.uploadRemoteImage({
        fileName: getAutmogImageFileName({
          sourceHash: row.image.sourceHash,
          sourceImageId: job.data.sourceImageId,
        }),
        folder: buildImageKitFolder({
          entityId: row.pen.sourceProductId,
          prefix: imageFolderPrefix,
          type: "pens",
        }),
        overwriteFile: true,
        overwriteTags: true,
        sourceUrl: job.data.sourceUrl,
        tags: [
          "scraper",
          "autmog",
          "autmog-pen",
          `source-product:${row.pen.sourceProductId}`,
        ],
        transformation: {
          pre: "w-2000,h-2000,c-at_max,q-85,f-webp",
        },
        useUniqueFileName: false,
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

      const dbResponse = await markAutmogImageUploaded(db, {
        height: result.height,
        imageId: row.image.id,
        imageKitFileId: result.fileId,
        imageKitPath: result.filePath,
        imageKitThumbnailUrl: result.thumbnailUrl,
        imageKitUrl: result.url,
        width: result.width,
      });
      logger.info(loggerMessages.scraper.image.uploadCompleted, {
        attributes: {
          dbResponse,
          durationMs: Date.now() - startedAt,
          imageId: row.image.id,
          imageKitResponse: result,
          jobId: job.id,
          sourceProductId: row.pen.sourceProductId,
        },
      });
      return "completed";
    }

    if (!["pending_delete", "delete_failed"].includes(row.image.status)) {
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
    const primaryErrorMessage =
      job.data.type === "autmog.image.upload"
        ? loggerMessages.scraper.image.uploadFailed
        : loggerMessages.scraper.image.deleteFailed;

    errorCounter.record(primaryErrorMessage);
    logger.error(primaryErrorMessage, {
      attributes: {
        durationMs: Date.now() - startedAt,
        imageId: job.data.imageId,
        jobId: job.id,
        type: job.data.type,
      },
      error,
    });
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

function getAutmogImageFileName({
  sourceHash,
  sourceImageId,
}: {
  sourceHash: string;
  sourceImageId: string | null;
}): string {
  const suffix = sourceImageId ?? sourceHash.replace("sha256:", "");

  return `${suffix}.webp`;
}

export function createProcessorErrorCounter(): ProcessorErrorCounter {
  const errorsByMessage = new Map<string, number>();

  return {
    record(message) {
      errorsByMessage.set(message, (errorsByMessage.get(message) ?? 0) + 1);
    },
    summary() {
      const entries = [...errorsByMessage.entries()].sort(([left], [right]) =>
        left.localeCompare(right),
      );
      const errors = Object.fromEntries(entries);

      return {
        errorsByMessage: errors,
        totalErrors: Object.values(errors).reduce(
          (total, count) => total + count,
          0,
        ),
      };
    },
  };
}

export function buildImageKitFolder({
  entityId,
  prefix,
  type,
}: {
  entityId: string;
  prefix?: string;
  type: string;
}) {
  const normalizedPrefix = normalizeImageKitFolderPrefix(prefix);
  const pathSegments = [normalizedPrefix, "products", type, entityId].filter(
    Boolean,
  );

  return `/${pathSegments.join("/")}`;
}

function normalizeImageKitFolderPrefix(prefix: string | undefined) {
  return prefix?.replace(/^\/+|\/+$/g, "");
}

function logProcessorErrorSummary({
  command,
  durationMs,
  errorCounter,
  logger,
  processor,
}: {
  command: "process:queue";
  durationMs: number;
  errorCounter: ProcessorErrorCounter;
  logger: Logger;
  processor: "queue";
}) {
  const summary = errorCounter.summary();

  if (summary.totalErrors === 0) {
    return;
  }

  logger.error(loggerMessages.scraper.processor.errorSummary, {
    attributes: {
      command,
      durationMs,
      errorsByMessage: summary.errorsByMessage,
      processor,
      totalErrors: summary.totalErrors,
    },
  });
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
    let finishPromise: Promise<void> | null = null;
    let worker: Worker<TJobData> | null = null;
    const timeout = setTimeout(
      () => {
        void finishDrain({ force: true }).then(() => resolve(stats), reject);
      },
      5 * 60 * 1000,
    );
    const finishDrain = ({ force = false }: { force?: boolean } = {}) => {
      if (finishPromise) {
        return finishPromise;
      }

      finishPromise = (async () => {
        clearTimeout(timeout);
        await closeWorkerWithDeadline(worker, force);
        logger.info(loggerMessages.scraper.queue.drainCompleted, {
          attributes: {
            completedJobs: stats.completed,
            durationMs: Date.now() - startedAt,
            failedJobs: stats.failed,
            queue: queueName,
            skippedJobs: stats.skipped,
          },
        });
      })();

      return finishPromise;
    };
    const maybeCloseWorker = () => {
      if (stats.completed + stats.failed + stats.skipped >= batchSize) {
        void finishDrain().then(() => resolve(stats), reject);
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
      void finishDrain().then(() => resolve(stats), reject);
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
      void finishDrain({ force: true }).then(() => reject(error), reject);
    });
  });
}

async function closeWorkerWithDeadline<TJobData>(
  worker: Worker<TJobData> | null,
  force: boolean,
) {
  if (!worker) {
    return;
  }

  if (force) {
    await worker.close(true);
    return;
  }

  let forceClose: NodeJS.Timeout | undefined;

  await Promise.race([
    worker.close(),
    new Promise<void>((resolve) => {
      forceClose = setTimeout(() => {
        void worker.close(true).finally(resolve);
      }, 30_000);
    }),
  ]);

  clearTimeout(forceClose);
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
