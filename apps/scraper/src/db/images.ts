import { type Database, schema } from "@package/database";
import { and, eq, isNull } from "drizzle-orm";

export type TmpImageInput = {
  altText: string | null;
  height: number | null;
  position: number;
  sourceHash: string;
  sourceImageId: string | null;
  sourceUrl: string;
  width: number | null;
};

export type TmpImageUploadJobCandidate = {
  imageId: number;
  sourceHash: string;
};

export type TmpImageSyncResult = {
  deleteImageJobs: { imageId: number }[];
  uploadImageJobs: TmpImageUploadJobCandidate[];
  upsertedImages: {
    altText: string | null;
    height: number | null;
    id: number;
    imageFileId: string | null;
    imagePath: string | null;
    imageProvider: string | null;
    imageUrl: string | null;
    productId: number;
    productVariationId: number | null;
    sourceHash: string;
    status: string;
    width: number | null;
  }[];
};

export async function createTmpProduct(db: Database, source: string) {
  const [product] = await db
    .insert(schema.tmpProducts)
    .values({
      source,
    })
    .returning();

  if (!product) {
    throw new Error(`Failed to create tmp product for source ${source}.`);
  }

  return product;
}

export async function ensureTmpProductVariation(
  db: Database,
  input: {
    productId: number;
    sourceKey: string;
  },
) {
  const [variation] = await db
    .insert(schema.tmpProductVariations)
    .values({
      productId: input.productId,
      sourceKey: input.sourceKey,
    })
    .onConflictDoNothing({
      target: [
        schema.tmpProductVariations.productId,
        schema.tmpProductVariations.sourceKey,
      ],
    })
    .returning();

  const row =
    variation ??
    (await getTmpProductVariation(db, input.productId, input.sourceKey));

  if (!row) {
    throw new Error(
      `Failed to ensure tmp product variation ${input.productId}:${input.sourceKey}.`,
    );
  }

  return row;
}

export async function syncTmpImages(
  db: Database,
  input: {
    images: readonly TmpImageInput[];
    now: Date;
    productId: number;
    productVariationId: number | null;
  },
): Promise<TmpImageSyncResult> {
  const existingImages = await db
    .select()
    .from(schema.tmpImages)
    .where(getTmpImagesScopeWhere(input.productId, input.productVariationId));
  const currentSourceHashes = new Set(
    input.images.map((image) => image.sourceHash),
  );
  const existingBySourceHash = new Map(
    existingImages.map((image) => [image.sourceHash, image]),
  );
  const deleteImageJobs: { imageId: number }[] = [];
  const uploadImageJobs: TmpImageUploadJobCandidate[] = [];
  const upsertedImages: TmpImageSyncResult["upsertedImages"] = [];

  for (const image of input.images) {
    const existingImage = existingBySourceHash.get(image.sourceHash);
    const shouldUpload =
      !existingImage ||
      existingImage.status === "deleted" ||
      existingImage.status === "pending_delete" ||
      existingImage.status === "upload_failed";
    const values = getTmpImageSyncValues({
      image,
      now: input.now,
      productId: input.productId,
      productVariationId: input.productVariationId,
      shouldUpload,
      status: existingImage?.status,
    });

    const [row] = existingImage
      ? isTmpImageSyncNoop(existingImage, values)
        ? [existingImage]
        : await db
            .update(schema.tmpImages)
            .set(values)
            .where(eq(schema.tmpImages.id, existingImage.id))
            .returning()
      : await db.insert(schema.tmpImages).values(values).returning();

    if (!row) {
      throw new Error(`Failed to upsert tmp image ${image.sourceUrl}.`);
    }

    if (shouldUpload) {
      uploadImageJobs.push({
        imageId: row.id,
        sourceHash: image.sourceHash,
      });
    }

    upsertedImages.push({
      altText: row.altText,
      height: row.height,
      id: row.id,
      imageFileId: row.imageFileId,
      imagePath: row.imagePath,
      imageProvider: row.imageProvider,
      imageUrl: row.imageUrl,
      productId: row.productId,
      productVariationId: row.productVariationId,
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
      await markTmpImageDeleted(db, existingImage.id, input.now);
      continue;
    }

    if (existingImage.status !== "deleted") {
      await db
        .update(schema.tmpImages)
        .set({
          pendingDeleteAt: input.now,
          status: "pending_delete",
          updatedAt: input.now,
        })
        .where(eq(schema.tmpImages.id, existingImage.id));
    }
  }

  return {
    deleteImageJobs,
    uploadImageJobs,
    upsertedImages,
  };
}

export async function getTmpImageForProcessing(db: Database, imageId: number) {
  const [row] = await db
    .select({
      image: schema.tmpImages,
      product: schema.tmpProducts,
      productVariation: schema.tmpProductVariations,
    })
    .from(schema.tmpImages)
    .innerJoin(
      schema.tmpProducts,
      eq(schema.tmpImages.productId, schema.tmpProducts.id),
    )
    .leftJoin(
      schema.tmpProductVariations,
      eq(schema.tmpImages.productVariationId, schema.tmpProductVariations.id),
    )
    .where(eq(schema.tmpImages.id, imageId))
    .limit(1);

  return row ?? null;
}

export async function markTmpImageUploaded(
  db: Database,
  input: {
    height: number;
    imageId: number;
    imageFileId: string;
    imagePath: string;
    imageProvider: string;
    imageUrl: string;
    width: number;
  },
) {
  const now = new Date();
  const [image] = await db
    .update(schema.tmpImages)
    .set({
      height: input.height,
      imageFileId: input.imageFileId,
      imagePath: input.imagePath,
      imageProvider: input.imageProvider,
      imageUrl: input.imageUrl,
      status: "uploaded",
      updatedAt: now,
      uploadedAt: now,
      width: input.width,
    })
    .where(eq(schema.tmpImages.id, input.imageId))
    .returning();

  if (!image) {
    throw new Error(`Failed to mark tmp image ${input.imageId} uploaded.`);
  }

  return image;
}

export async function markTmpImageDeleted(
  db: Database,
  imageId: number,
  now = new Date(),
) {
  await db
    .update(schema.tmpImages)
    .set({
      deletedAt: now,
      status: "deleted",
      updatedAt: now,
    })
    .where(eq(schema.tmpImages.id, imageId));
}

export async function markTmpImageFailed(
  db: Database,
  input: { imageId: number; status: "delete_failed" | "upload_failed" },
) {
  await db
    .update(schema.tmpImages)
    .set({
      status: input.status,
      updatedAt: new Date(),
    })
    .where(eq(schema.tmpImages.id, input.imageId));
}

function getTmpImagesScopeWhere(
  productId: number,
  productVariationId: number | null,
) {
  return productVariationId === null
    ? and(
        eq(schema.tmpImages.productId, productId),
        isNull(schema.tmpImages.productVariationId),
      )
    : and(
        eq(schema.tmpImages.productId, productId),
        eq(schema.tmpImages.productVariationId, productVariationId),
      );
}

async function getTmpProductVariation(
  db: Database,
  productId: number,
  sourceKey: string,
) {
  const [variation] = await db
    .select()
    .from(schema.tmpProductVariations)
    .where(
      and(
        eq(schema.tmpProductVariations.productId, productId),
        eq(schema.tmpProductVariations.sourceKey, sourceKey),
      ),
    )
    .limit(1);

  return variation;
}

export function getTmpImageSyncValues({
  image,
  now,
  productId,
  productVariationId,
  shouldUpload,
  status,
}: {
  image: TmpImageInput;
  now: Date;
  productId: number;
  productVariationId: number | null;
  shouldUpload: boolean;
  status?: string;
}) {
  return {
    altText: image.altText,
    deletedAt: null,
    height: image.height,
    lastSeenAt: now,
    pendingDeleteAt: null,
    position: image.position,
    productId,
    productVariationId,
    sourceHash: image.sourceHash,
    sourceImageId: image.sourceImageId,
    sourceUrl: image.sourceUrl,
    status: shouldUpload ? "pending_upload" : (status ?? "pending_upload"),
    updatedAt: now,
    width: image.width,
  };
}

export function isTmpImageSyncNoop(
  existingImage: {
    altText: string | null;
    deletedAt: Date | null;
    height: number | null;
    pendingDeleteAt: Date | null;
    position: number;
    productId: number;
    productVariationId: number | null;
    sourceHash: string;
    sourceImageId: string | null;
    sourceUrl: string;
    status: string;
    width: number | null;
  },
  values: ReturnType<typeof getTmpImageSyncValues>,
) {
  return (
    existingImage.altText === values.altText &&
    existingImage.deletedAt === null &&
    existingImage.height === values.height &&
    existingImage.pendingDeleteAt === null &&
    existingImage.position === values.position &&
    existingImage.productId === values.productId &&
    existingImage.productVariationId === values.productVariationId &&
    existingImage.sourceHash === values.sourceHash &&
    existingImage.sourceImageId === values.sourceImageId &&
    existingImage.sourceUrl === values.sourceUrl &&
    existingImage.status === values.status &&
    existingImage.width === values.width
  );
}
