import {
  createDb,
  type Database,
  type ScraperRunStats,
  schema,
} from "@package/database";
import { and, eq, isNull, lt, notInArray } from "drizzle-orm";
import type { NormalizedAutmogPen } from "../scraper-types.js";

const autmogMaker = {
  name: "Autmog",
  rootUrl: "https://www.autmog.com",
};

export type AutmogPenSyncResult = {
  created: boolean;
  dbResponse: AutmogPenSyncDbResponse;
  deleteImageJobs: { imageId: number }[];
  mutationInput: AutmogPenSyncMutationInput;
  uploadImageJobs: {
    imageId: number;
    sourceHash: string;
    sourceImageId: string | null;
    sourceUrl: string;
  }[];
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
    clip: string | null;
    currencyCode: string;
    description: string | null;
    detailsHash: string;
    finish: string | null;
    grip: string | null;
    imageSetHash: string;
    makerId: number;
    materials: string[];
    mechanism: string | null;
    mechanismId: number | null;
    nose: string | null;
    priceMaxCents: number | null;
    priceMinCents: number | null;
    productTypes: string[];
    productUrl: string;
    refill: string | null;
    size: string | null;
    sourceHandle: string;
    sourceProductId: string;
    tags: string[];
    title: string;
  };
};

export type AutmogPenSyncDbResponse = {
  images: {
    deleteJobImageIds: number[];
    uploadJobImageIds: number[];
    upserted: {
      altText: string | null;
      height: number | null;
      id: number;
      imageKitFileId: string | null;
      imageKitPath: string | null;
      imageKitThumbnailUrl: string | null;
      imageKitUrl: string | null;
      penId: number;
      sourceHash: string;
      status: string;
      width: number | null;
    }[];
  };
  pen: {
    detailsHash: string;
    archivedAt: Date | null;
    id: number;
    imageSetHash: string;
    makerId: number;
    sourceHandle: string;
    sourceProductId: string;
    title: string;
  };
  product: {
    autmogPenId: number | null;
    id: number;
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
  runId: number,
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
  const mechanism = await ensureAutmogMechanism(db, item.mechanism);
  const now = new Date();
  const mutationInput = getAutmogPenSyncMutationInput(
    item,
    maker.id,
    mechanism?.id ?? null,
  );
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
      clip: item.clip,
      currencyCode: item.currencyCode,
      description: item.description,
      detailsHash: item.detailsHash,
      finish: item.finish,
      grip: item.grip,
      imageSetHash: item.imageSetHash,
      makerId: maker.id,
      mechanismId: mechanism?.id ?? null,
      normalizedData: item.normalizedData,
      nose: item.nose,
      priceMaxCents: item.priceMaxCents,
      priceMinCents: item.priceMinCents,
      productUrl: item.productUrl,
      refill: item.refill,
      size: item.size,
      sourceHandle: item.sourceHandle,
      sourceProductId: item.sourceProductId,
      tags: item.tags,
      title: item.title,
      variants: item.variants,
    })
    .onConflictDoUpdate({
      set: {
        availableForSale: item.availableForSale,
        archivedAt: null,
        bodyDetails: item.bodyDetails,
        clip: item.clip,
        currencyCode: item.currencyCode,
        description: item.description,
        detailsHash: item.detailsHash,
        finish: item.finish,
        grip: item.grip,
        imageSetHash: item.imageSetHash,
        makerId: maker.id,
        mechanismId: mechanism?.id ?? null,
        normalizedData: item.normalizedData,
        nose: item.nose,
        priceMaxCents: item.priceMaxCents,
        priceMinCents: item.priceMinCents,
        productUrl: item.productUrl,
        refill: item.refill,
        size: item.size,
        sourceHandle: item.sourceHandle,
        tags: item.tags,
        title: item.title,
        updatedAt: now,
        variants: item.variants,
      },
      target: schema.tmpAutmogPens.sourceProductId,
    })
    .returning();

  if (!pen) {
    throw new Error(`Failed to upsert Autmog pen ${item.sourceProductId}.`);
  }

  await syncAutmogPenMaterials(db, pen.id, item.materials);

  const [product] = await db
    .insert(schema.tmpProducts)
    .values({
      autmogPenId: pen.id,
    })
    .onConflictDoUpdate({
      set: {
        autmogPenId: pen.id,
      },
      target: schema.tmpProducts.autmogPenId,
    })
    .returning({
      autmogPenId: schema.tmpProducts.autmogPenId,
      id: schema.tmpProducts.id,
    });

  if (!product) {
    throw new Error(`Failed to upsert product for Autmog pen ${pen.id}.`);
  }

  await syncTmpProductProductTypes(db, product.id, item.productTypes);

  const [existingImages, uploadImageJobs, deleteImageJobs] = await Promise.all([
    db
      .select()
      .from(schema.tmpAutmogPenImages)
      .where(eq(schema.tmpAutmogPenImages.penId, pen.id)),
    Promise.resolve(
      [] as {
        imageId: number;
        sourceHash: string;
        sourceImageId: string | null;
        sourceUrl: string;
      }[],
    ),
    Promise.resolve([] as { imageId: number }[]),
  ]);
  const currentSourceHashes = new Set(
    item.images.map((image) => image.sourceHash),
  );
  const existingBySourceHash = new Map(
    existingImages.map((image) => [image.sourceHash, image]),
  );
  const upsertedImages: AutmogPenSyncDbResponse["images"]["upserted"] = [];

  for (const image of item.images) {
    const existingImage = existingBySourceHash.get(image.sourceHash);
    const shouldUpload =
      !existingImage ||
      existingImage.status === "deleted" ||
      existingImage.status === "pending_delete" ||
      existingImage.status === "upload_failed";
    const [row] = await db
      .insert(schema.tmpAutmogPenImages)
      .values({
        altText: image.altText,
        lastSeenAt: now,
        penId: pen.id,
        sourceHash: image.sourceHash,
        status: shouldUpload ? "pending_upload" : existingImage.status,
      })
      .onConflictDoUpdate({
        set: {
          altText: image.altText,
          deletedAt: null,
          lastSeenAt: now,
          pendingDeleteAt: null,
          status: shouldUpload ? "pending_upload" : existingImage?.status,
          updatedAt: now,
        },
        target: [
          schema.tmpAutmogPenImages.penId,
          schema.tmpAutmogPenImages.sourceHash,
        ],
      })
      .returning();

    if (!row) {
      throw new Error(`Failed to upsert Autmog image ${image.sourceUrl}.`);
    }

    if (shouldUpload) {
      uploadImageJobs.push({
        imageId: row.id,
        sourceHash: image.sourceHash,
        sourceImageId: image.sourceImageId,
        sourceUrl: image.sourceUrl,
      });
    }

    upsertedImages.push({
      altText: row.altText,
      height: row.height,
      id: row.id,
      imageKitFileId: row.imageKitFileId,
      imageKitPath: row.imageKitPath,
      imageKitThumbnailUrl: row.imageKitThumbnailUrl,
      imageKitUrl: row.imageKitUrl,
      penId: row.penId,
      sourceHash: row.sourceHash,
      status: row.status,
      width: row.width,
    });
  }

  for (const existingImage of existingImages) {
    if (currentSourceHashes.has(existingImage.sourceHash)) {
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
        archivedAt: pen.archivedAt,
        id: pen.id,
        imageSetHash: pen.imageSetHash,
        makerId: pen.makerId,
        sourceHandle: pen.sourceHandle,
        sourceProductId: pen.sourceProductId,
        title: pen.title,
      },
      product,
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
          isNull(schema.tmpAutmogPens.archivedAt),
          notInArray(schema.tmpAutmogPens.sourceProductId, [
            ...seenSourceProductIds,
          ]),
        )
      : isNull(schema.tmpAutmogPens.archivedAt);
  const archived = await db
    .update(schema.tmpAutmogPens)
    .set({
      archivedAt: now,
      updatedAt: now,
    })
    .where(where)
    .returning({ id: schema.tmpAutmogPens.id });

  return archived.length;
}

export async function getAutmogImageForProcessing(
  db: Database,
  imageId: number,
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
    height: number;
    imageId: number;
    imageKitFileId: string;
    imageKitPath: string;
    imageKitThumbnailUrl: string;
    imageKitUrl: string;
    width: number;
  },
) {
  const [image] = await db
    .update(schema.tmpAutmogPenImages)
    .set({
      height: input.height,
      imageKitFileId: input.imageKitFileId,
      imageKitPath: input.imageKitPath,
      imageKitThumbnailUrl: input.imageKitThumbnailUrl,
      imageKitUrl: input.imageKitUrl,
      status: "uploaded",
      updatedAt: new Date(),
      uploadedAt: new Date(),
      width: input.width,
    })
    .where(eq(schema.tmpAutmogPenImages.id, input.imageId))
    .returning({
      height: schema.tmpAutmogPenImages.height,
      id: schema.tmpAutmogPenImages.id,
      imageKitFileId: schema.tmpAutmogPenImages.imageKitFileId,
      imageKitPath: schema.tmpAutmogPenImages.imageKitPath,
      imageKitThumbnailUrl: schema.tmpAutmogPenImages.imageKitThumbnailUrl,
      imageKitUrl: schema.tmpAutmogPenImages.imageKitUrl,
      status: schema.tmpAutmogPenImages.status,
      width: schema.tmpAutmogPenImages.width,
    });

  if (!image) {
    throw new Error(`Failed to mark Autmog image ${input.imageId} uploaded.`);
  }

  return image;
}

export async function markAutmogImageDeleted(db: Database, imageId: number) {
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
  input: { imageId: number; status: "delete_failed" | "upload_failed" },
) {
  await db
    .update(schema.tmpAutmogPenImages)
    .set({
      status: input.status,
      updatedAt: new Date(),
    })
    .where(eq(schema.tmpAutmogPenImages.id, input.imageId));
}

async function syncAutmogPenMaterials(
  db: Database,
  penId: number,
  materialNames: readonly string[],
) {
  const names = [...new Set(materialNames.map((name) => name.trim()))].filter(
    (name) => name.length > 0,
  );
  const materialRows = [];

  for (const name of names) {
    const [material] = await db
      .insert(schema.materials)
      .values({
        name,
        slug: slugifyCanonicalName(name),
      })
      .onConflictDoUpdate({
        set: {
          name,
          updatedAt: new Date(),
        },
        target: schema.materials.slug,
      })
      .returning({
        id: schema.materials.id,
      });

    if (!material) {
      throw new Error(`Failed to ensure material ${name}.`);
    }

    materialRows.push(material);
  }

  await db
    .delete(schema.tmpAutmogPenMaterials)
    .where(eq(schema.tmpAutmogPenMaterials.penId, penId));

  if (materialRows.length === 0) {
    return;
  }

  await db.insert(schema.tmpAutmogPenMaterials).values(
    materialRows.map((material) => ({
      materialId: material.id,
      penId,
    })),
  );
}

async function ensureAutmogMechanism(
  db: Database,
  mechanismName: string | null,
) {
  const name = mechanismName?.trim();

  if (!name) {
    return null;
  }

  const [mechanism] = await db
    .insert(schema.mechanisms)
    .values({
      name,
      slug: slugifyCanonicalName(name),
    })
    .onConflictDoUpdate({
      set: {
        name,
        updatedAt: new Date(),
      },
      target: schema.mechanisms.slug,
    })
    .returning({
      id: schema.mechanisms.id,
    });

  if (!mechanism) {
    throw new Error(`Failed to ensure mechanism ${name}.`);
  }

  return mechanism;
}

async function syncTmpProductProductTypes(
  db: Database,
  productId: number,
  productTypeNames: readonly string[],
) {
  const names = [
    ...new Set(productTypeNames.map((name) => name.trim())),
  ].filter((name) => name.length > 0);
  const productTypeRows = [];

  for (const name of names) {
    const [productType] = await db
      .insert(schema.productTypes)
      .values({
        name,
        slug: slugifyCanonicalName(name),
      })
      .onConflictDoUpdate({
        set: {
          name,
          updatedAt: new Date(),
        },
        target: schema.productTypes.slug,
      })
      .returning({
        id: schema.productTypes.id,
      });

    if (!productType) {
      throw new Error(`Failed to ensure product type ${name}.`);
    }

    productTypeRows.push(productType);
  }

  await db
    .delete(schema.tmpProductProductTypes)
    .where(eq(schema.tmpProductProductTypes.productId, productId));

  if (productTypeRows.length === 0) {
    return;
  }

  await db.insert(schema.tmpProductProductTypes).values(
    productTypeRows.map((productType) => ({
      productId,
      productTypeId: productType.id,
    })),
  );
}

function slugifyCanonicalName(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "value"
  );
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
  makerId: number,
  mechanismId: number | null,
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
      clip: item.clip,
      currencyCode: item.currencyCode,
      description: item.description,
      detailsHash: item.detailsHash,
      finish: item.finish,
      grip: item.grip,
      imageSetHash: item.imageSetHash,
      makerId,
      materials: item.materials,
      mechanism: item.mechanism,
      mechanismId,
      nose: item.nose,
      priceMaxCents: item.priceMaxCents,
      priceMinCents: item.priceMinCents,
      productTypes: item.productTypes,
      productUrl: item.productUrl,
      refill: item.refill,
      size: item.size,
      sourceHandle: item.sourceHandle,
      sourceProductId: item.sourceProductId,
      tags: item.tags,
      title: item.title,
    },
  };
}
