import { hashObject } from "../lib/hash.js";
import type { NormalizedAutmogPen } from "../scraper-types.js";

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

export function getAutmogImageUploadJobId(input: {
  imageId: string;
  sourceHash: string;
}): string {
  return createJobId(
    "autmog",
    "image",
    "upload",
    input.imageId,
    input.sourceHash,
  );
}

export function getAutmogImageDeleteJobId(input: { imageId: string }): string {
  return createJobId("autmog", "image", "delete", input.imageId);
}

function createJobId(...parts: readonly string[]): string {
  return parts.map((part) => encodeURIComponent(part)).join("--");
}
