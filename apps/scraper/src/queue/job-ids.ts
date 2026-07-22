import { hashObject } from "../lib/hash.js";
import type {
  GrimsmoKnifeSourceName,
  GrimsmoPenSourceName,
  GrimsmoSourceName,
  NormalizedAutmogPen,
  NormalizedGrimsmoKnifeVariation,
  NormalizedGrimsmoPenVariation,
  ScraperSourceName,
} from "../scraper-types.js";

export function getAutmogPenJobId(item: NormalizedAutmogPen): string {
  return createJobId("autmog", "pen", item.sourceProductId, item.detailsHash);
}

export function getAutmogArchiveJobId(sourceProductIds: readonly string[]) {
  return createJobId(
    "autmog",
    "archive",
    hashObject([...sourceProductIds].sort()),
  );
}

export function getTmpImageUploadJobId(input: {
  imageId: number;
  source: ScraperSourceName;
  sourceHash: string;
}): string {
  return createJobId(
    input.source,
    "image",
    "upload",
    String(input.imageId),
    input.sourceHash,
  );
}

export function getTmpImageDeleteJobId(input: {
  imageId: number;
  source: ScraperSourceName;
}): string {
  return createJobId(input.source, "image", "delete", String(input.imageId));
}

export function getGrimsmoPenVariationJobId(
  source: GrimsmoPenSourceName,
  item: NormalizedGrimsmoPenVariation,
): string {
  return createJobId(
    source,
    "pen-variation",
    item.sourceHandle,
    item.detailsHash,
  );
}

export function getGrimsmoKnifeVariationJobId(
  source: GrimsmoKnifeSourceName,
  item: NormalizedGrimsmoKnifeVariation,
): string {
  return createJobId(
    source,
    "knife-variation",
    item.sourceHandle,
    item.detailsHash,
  );
}

export function getGrimsmoVariationBatchJobId(input: {
  inventorySourceHandles: readonly string[];
  source: GrimsmoSourceName;
  sourceHandles: readonly string[];
}): string {
  return createJobId(
    input.source,
    "variation-batch",
    hashObject({
      inventorySourceHandles: [...input.inventorySourceHandles].sort(),
      sourceHandles: [...input.sourceHandles].sort(),
    }),
  );
}

function createJobId(...parts: readonly string[]): string {
  return parts.map((part) => encodeURIComponent(part)).join("--");
}
