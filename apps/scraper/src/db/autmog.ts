import {
  createDb,
  type Database,
  type ScraperRunStats,
  schema,
} from "@package/database";
import { and, eq, inArray, lt, notInArray } from "drizzle-orm";
import { parseDate } from "../lib/dates.js";
import type { NormalizedAutmogPen } from "../scraper-types.js";

const autmogMaker = {
  name: "Autmog",
  rootUrl: "https://www.autmog.com",
};

export type AutmogPenSyncResult = {
  created: boolean;
  dbResponse: AutmogPenSyncDbResponse;
  deleteImageJobs: { imageId: string }[];
  mutationInput: AutmogPenSyncMutationInput;
  uploadImageJobs: { imageId: string; sourceHash: string }[];
  updated: boolean;
  versioned: boolean;
};

export type AutmogPenSyncMutationInput = {
  images: {
    altText: string | null;
    height: number | null;
    position: number;
    sourceHash: string;
    sourceImageId: string | null;
    sourceUrl: string;
    width: number | null;
  }[];
  pen: {
    availableForSale: boolean;
    bodyDetails: string[];
    bodyShape: string | null;
    category: string | null;
    clip: string | null;
    currencyCode: string;
    detailsHash: string;
    finish: string | null;
    grip: string | null;
    imageSetHash: string;
    makerId: string;
    materials: string[];
    mechanism: string | null;
    nose: string | null;
    priceMaxCents: number | null;
    priceMinCents: number | null;
    productType: string | null;
    productUrl: string;
    rawPayloadHash: string;
    refill: string | null;
    size: string | null;
    sourceHandle: string;
    sourceProductId: string;
    tags: string[];
    title: string;
    vendor: string | null;
  };
};

export type AutmogPenSyncDbResponse = {
  images: {
    deleteJobImageIds: string[];
    uploadJobImageIds: string[];
    upserted: {
      id: string;
      penId: string;
      sourceHash: string;
      sourceImageId: string | null;
      sourceUrl: string;
      status: string;
    }[];
  };
  pen: {
    detailsHash: string;
    id: string;
    imageSetHash: string;
    isArchived: boolean;
    makerId: string;
    sourceHandle: string;
    sourceProductId: string;
    title: string;
  };
};

export type ScraperRunUpdate = {
  errorMessage?: string;
  stats?: ScraperRunStats;
  status: "completed" | "failed";
};

export function createScraperDb(databaseUrl: string): Database {
  return createDb({ databaseUrl });
}

export async function startScraperRun(
  db: Database,
  input: {
    jobType: string;
    source: string;
  },
) {
  const staleBefore = new Date(Date.now() - 2 * 60 * 60 * 1000);

  await db
    .update(schema.scraperRuns)
    .set({
      errorMessage: "Run marked failed after exceeding stale lock threshold.",
      finishedAt: new Date(),
      status: "failed",
    })
    .where(
      and(
        eq(schema.scraperRuns.source, input.source),
        eq(schema.scraperRuns.jobType, input.jobType),
        eq(schema.scraperRuns.status, "running"),
        lt(schema.scraperRuns.startedAt, staleBefore),
      ),
    );

  const [activeRun] = await db
    .select({ id: schema.scraperRuns.id })
    .from(schema.scraperRuns)
    .where(
      and(
        eq(schema.scraperRuns.source, input.source),
        eq(schema.scraperRuns.jobType, input.jobType),
        eq(schema.scraperRuns.status, "running"),
      ),
    )
    .limit(1);

  if (activeRun) {
    throw new Error(
      `Scraper run already active for ${input.source}:${input.jobType}.`,
    );
  }

  const [run] = await db
    .insert(schema.scraperRuns)
    .values({
      jobType: input.jobType,
      source: input.source,
      status: "running",
    })
    .returning();

  if (!run) {
    throw new Error("Failed to create scraper run.");
  }

  return run;
}

export async function finishScraperRun(
  db: Database,
  runId: string,
  update: ScraperRunUpdate,
) {
  const [run] = await db
    .update(schema.scraperRuns)
    .set({
      errorMessage: update.errorMessage,
      finishedAt: new Date(),
      stats: update.stats ?? {},
      status: update.status,
    })
    .where(eq(schema.scraperRuns.id, runId))
    .returning();

  if (!run) {
    throw new Error(`Failed to update scraper run ${runId}.`);
  }

  return run;
}

export async function syncAutmogPen(
  db: Database,
  item: NormalizedAutmogPen,
): Promise<AutmogPenSyncResult> {
  const maker = await ensureAutmogMaker(db);
  const now = new Date();
  const mutationInput = getAutmogPenSyncMutationInput(item, maker.id);
  const [existing] = await db
    .select()
    .from(schema.tmpAutmogPens)
    .where(eq(schema.tmpAutmogPens.sourceProductId, item.sourceProductId))
    .limit(1);
  const versioned = Boolean(
    existing &&
      (existing.detailsHash !== item.detailsHash ||
        existing.imageSetHash !== item.imageSetHash),
  );

  if (existing && versioned) {
    await db.insert(schema.tmpAutmogPenVersions).values({
      changeReason: getChangeReason(existing, item),
      nextDetailsHash: item.detailsHash,
      nextImageSetHash: item.imageSetHash,
      penId: existing.id,
      previousDetailsHash: existing.detailsHash,
      previousImageSetHash: existing.imageSetHash,
      sourceProductId: existing.sourceProductId,
      snapshot: existing.normalizedData,
    });
  }

  const [pen] = await db
    .insert(schema.tmpAutmogPens)
    .values({
      availableForSale: item.availableForSale,
      bodyDetails: item.bodyDetails,
      bodyHtml: item.bodyHtml,
      bodyShape: item.bodyShape,
      bodyText: item.bodyText,
      category: item.category,
      clip: item.clip,
      currencyCode: item.currencyCode,
      detailsHash: item.detailsHash,
      finish: item.finish,
      grip: item.grip,
      imageSetHash: item.imageSetHash,
      isArchived: false,
      makerId: maker.id,
      materials: item.materials,
      mechanism: item.mechanism,
      normalizedData: item.normalizedData,
      nose: item.nose,
      priceMaxCents: item.priceMaxCents,
      priceMinCents: item.priceMinCents,
      productType: item.productType,
      productUrl: item.productUrl,
      rawPayloadHash: item.rawPayloadHash,
      rawShopifyData: item.rawShopifyData,
      refill: item.refill,
      size: item.size,
      sourceCreatedAt: parseDate(item.sourceCreatedAt),
      sourceHandle: item.sourceHandle,
      sourceProductId: item.sourceProductId,
      sourcePublishedAt: parseDate(item.sourcePublishedAt),
      sourceUpdatedAt: parseDate(item.sourceUpdatedAt),
      tags: item.tags,
      title: item.title,
      variants: item.variants,
      vendor: item.vendor,
    })
    .onConflictDoUpdate({
      set: {
        availableForSale: item.availableForSale,
        archivedAt: null,
        bodyDetails: item.bodyDetails,
        bodyHtml: item.bodyHtml,
        bodyShape: item.bodyShape,
        bodyText: item.bodyText,
        category: item.category,
        clip: item.clip,
        currencyCode: item.currencyCode,
        detailsHash: item.detailsHash,
        finish: item.finish,
        grip: item.grip,
        imageSetHash: item.imageSetHash,
        isArchived: false,
        lastSeenAt: now,
        makerId: maker.id,
        materials: item.materials,
        mechanism: item.mechanism,
        normalizedData: item.normalizedData,
        nose: item.nose,
        priceMaxCents: item.priceMaxCents,
        priceMinCents: item.priceMinCents,
        productType: item.productType,
        productUrl: item.productUrl,
        rawPayloadHash: item.rawPayloadHash,
        rawShopifyData: item.rawShopifyData,
        refill: item.refill,
        size: item.size,
        sourceCreatedAt: parseDate(item.sourceCreatedAt),
        sourceHandle: item.sourceHandle,
        sourcePublishedAt: parseDate(item.sourcePublishedAt),
        sourceUpdatedAt: parseDate(item.sourceUpdatedAt),
        tags: item.tags,
        title: item.title,
        updatedAt: now,
        variants: item.variants,
        vendor: item.vendor,
      },
      target: schema.tmpAutmogPens.sourceProductId,
    })
    .returning();

  if (!pen) {
    throw new Error(`Failed to upsert Autmog pen ${item.sourceProductId}.`);
  }

  const [existingImages, uploadImageJobs, deleteImageJobs] = await Promise.all([
    db
      .select()
      .from(schema.tmpAutmogPenImages)
      .where(eq(schema.tmpAutmogPenImages.penId, pen.id)),
    Promise.resolve([] as { imageId: string; sourceHash: string }[]),
    Promise.resolve([] as { imageId: string }[]),
  ]);
  const currentSourceUrls = new Set(
    item.images.map((image) => image.sourceUrl),
  );
  const existingBySourceUrl = new Map(
    existingImages.map((image) => [image.sourceUrl, image]),
  );
  const upsertedImages: AutmogPenSyncDbResponse["images"]["upserted"] = [];

  for (const image of item.images) {
    const existingImage = existingBySourceUrl.get(image.sourceUrl);
    const shouldUpload =
      !existingImage ||
      existingImage.sourceHash !== image.sourceHash ||
      existingImage.status === "deleted" ||
      existingImage.status === "pending_delete";
    const [row] = await db
      .insert(schema.tmpAutmogPenImages)
      .values({
        altText: image.altText,
        height: image.height,
        lastSeenAt: now,
        penId: pen.id,
        position: image.position,
        sourceHash: image.sourceHash,
        sourceImageId: image.sourceImageId,
        sourceUrl: image.sourceUrl,
        status: shouldUpload ? "pending_upload" : existingImage.status,
        width: image.width,
      })
      .onConflictDoUpdate({
        set: {
          altText: image.altText,
          deletedAt: null,
          height: image.height,
          lastSeenAt: now,
          pendingDeleteAt: null,
          position: image.position,
          sourceHash: image.sourceHash,
          sourceImageId: image.sourceImageId,
          status: shouldUpload ? "pending_upload" : existingImage?.status,
          updatedAt: now,
          width: image.width,
        },
        target: [
          schema.tmpAutmogPenImages.penId,
          schema.tmpAutmogPenImages.sourceUrl,
        ],
      })
      .returning();

    if (!row) {
      throw new Error(`Failed to upsert Autmog image ${image.sourceUrl}.`);
    }

    if (shouldUpload) {
      uploadImageJobs.push({ imageId: row.id, sourceHash: image.sourceHash });
    }

    upsertedImages.push({
      id: row.id,
      penId: row.penId,
      sourceHash: row.sourceHash,
      sourceImageId: row.sourceImageId,
      sourceUrl: row.sourceUrl,
      status: row.status,
    });
  }

  for (const existingImage of existingImages) {
    if (currentSourceUrls.has(existingImage.sourceUrl)) {
      continue;
    }

    if (
      existingImage.status === "pending_delete" &&
      existingImage.pendingDeleteAt
    ) {
      deleteImageJobs.push({ imageId: existingImage.id });
      continue;
    }

    if (existingImage.status === "pending_upload") {
      await db
        .update(schema.tmpAutmogPenImages)
        .set({
          deletedAt: now,
          status: "deleted",
          updatedAt: now,
        })
        .where(eq(schema.tmpAutmogPenImages.id, existingImage.id));
      continue;
    }

    if (existingImage.status !== "deleted") {
      await db
        .update(schema.tmpAutmogPenImages)
        .set({
          pendingDeleteAt: now,
          status: "pending_delete",
          updatedAt: now,
        })
        .where(eq(schema.tmpAutmogPenImages.id, existingImage.id));
    }
  }

  return {
    created: !existing,
    dbResponse: {
      images: {
        deleteJobImageIds: deleteImageJobs.map((job) => job.imageId),
        uploadJobImageIds: uploadImageJobs.map((job) => job.imageId),
        upserted: upsertedImages,
      },
      pen: {
        detailsHash: pen.detailsHash,
        id: pen.id,
        imageSetHash: pen.imageSetHash,
        isArchived: pen.isArchived,
        makerId: pen.makerId,
        sourceHandle: pen.sourceHandle,
        sourceProductId: pen.sourceProductId,
        title: pen.title,
      },
    },
    deleteImageJobs,
    mutationInput,
    updated: Boolean(existing && existing.detailsHash !== item.detailsHash),
    uploadImageJobs,
    versioned,
  };
}

export async function archiveMissingAutmogPens(
  db: Database,
  seenSourceProductIds: readonly string[],
) {
  const now = new Date();
  const where =
    seenSourceProductIds.length > 0
      ? and(
          eq(schema.tmpAutmogPens.isArchived, false),
          notInArray(schema.tmpAutmogPens.sourceProductId, [
            ...seenSourceProductIds,
          ]),
        )
      : eq(schema.tmpAutmogPens.isArchived, false);
  const archived = await db
    .update(schema.tmpAutmogPens)
    .set({
      archivedAt: now,
      isArchived: true,
      updatedAt: now,
    })
    .where(where)
    .returning({ id: schema.tmpAutmogPens.id });

  return archived.length;
}

export async function getAutmogImageForProcessing(
  db: Database,
  imageId: string,
) {
  const [row] = await db
    .select({
      image: schema.tmpAutmogPenImages,
      pen: schema.tmpAutmogPens,
    })
    .from(schema.tmpAutmogPenImages)
    .innerJoin(
      schema.tmpAutmogPens,
      eq(schema.tmpAutmogPenImages.penId, schema.tmpAutmogPens.id),
    )
    .where(eq(schema.tmpAutmogPenImages.id, imageId))
    .limit(1);

  return row ?? null;
}

export async function markAutmogImageUploaded(
  db: Database,
  input: {
    imageId: string;
    imageKitFileId: string;
    imageKitPath: string;
    imageKitUrl: string;
  },
) {
  await db
    .update(schema.tmpAutmogPenImages)
    .set({
      imageKitFileId: input.imageKitFileId,
      imageKitPath: input.imageKitPath,
      imageKitUrl: input.imageKitUrl,
      status: "uploaded",
      updatedAt: new Date(),
      uploadedAt: new Date(),
    })
    .where(eq(schema.tmpAutmogPenImages.id, input.imageId));
}

export async function markAutmogImageDeleted(db: Database, imageId: string) {
  const now = new Date();

  await db
    .update(schema.tmpAutmogPenImages)
    .set({
      deletedAt: now,
      status: "deleted",
      updatedAt: now,
    })
    .where(eq(schema.tmpAutmogPenImages.id, imageId));
}

export async function markAutmogImageFailed(
  db: Database,
  input: { imageId: string; status: "delete_failed" | "upload_failed" },
) {
  await db
    .update(schema.tmpAutmogPenImages)
    .set({
      status: input.status,
      updatedAt: new Date(),
    })
    .where(eq(schema.tmpAutmogPenImages.id, input.imageId));
}

export async function enqueuePendingAutmogImageUploads(db: Database) {
  const rows = await db
    .select({
      id: schema.tmpAutmogPenImages.id,
      sourceHash: schema.tmpAutmogPenImages.sourceHash,
    })
    .from(schema.tmpAutmogPenImages)
    .where(inArray(schema.tmpAutmogPenImages.status, ["pending_upload"]));

  return rows;
}

async function ensureAutmogMaker(db: Database) {
  const [maker] = await db
    .insert(schema.makers)
    .values(autmogMaker)
    .onConflictDoUpdate({
      set: {
        name: autmogMaker.name,
        updatedAt: new Date(),
      },
      target: schema.makers.rootUrl,
    })
    .returning();

  if (!maker) {
    throw new Error("Failed to ensure Autmog maker.");
  }

  return maker;
}

function getChangeReason(
  existing: { detailsHash: string; imageSetHash: string },
  item: NormalizedAutmogPen,
) {
  const changes = [];

  if (existing.detailsHash !== item.detailsHash) {
    changes.push("details");
  }

  if (existing.imageSetHash !== item.imageSetHash) {
    changes.push("images");
  }

  return changes.join("+") || "unknown";
}

function getAutmogPenSyncMutationInput(
  item: NormalizedAutmogPen,
  makerId: string,
): AutmogPenSyncMutationInput {
  return {
    images: item.images.map((image) => ({
      altText: image.altText,
      height: image.height,
      position: image.position,
      sourceHash: image.sourceHash,
      sourceImageId: image.sourceImageId,
      sourceUrl: image.sourceUrl,
      width: image.width,
    })),
    pen: {
      availableForSale: item.availableForSale,
      bodyDetails: item.bodyDetails,
      bodyShape: item.bodyShape,
      category: item.category,
      clip: item.clip,
      currencyCode: item.currencyCode,
      detailsHash: item.detailsHash,
      finish: item.finish,
      grip: item.grip,
      imageSetHash: item.imageSetHash,
      makerId,
      materials: item.materials,
      mechanism: item.mechanism,
      nose: item.nose,
      priceMaxCents: item.priceMaxCents,
      priceMinCents: item.priceMinCents,
      productType: item.productType,
      productUrl: item.productUrl,
      rawPayloadHash: item.rawPayloadHash,
      refill: item.refill,
      size: item.size,
      sourceHandle: item.sourceHandle,
      sourceProductId: item.sourceProductId,
      tags: item.tags,
      title: item.title,
      vendor: item.vendor,
    },
  };
}
