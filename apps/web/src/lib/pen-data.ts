import penData from "../../../../packages/json-data/autmog.json";
import type {
  PenProduct,
  PenProductCollection,
} from "../../../../packages/types/src";

const IMAGE_PREFIX = "/images/tmp/";

function localImageUrl(path: string) {
  const filename = path.split("/").pop();
  return filename ? `${IMAGE_PREFIX}${filename}` : path;
}

export const products: PenProduct[] = (
  penData as PenProductCollection
).products.map((product) => ({
  ...product,
  image: localImageUrl(product.image),
  image_local: localImageUrl(product.image_local),
  images_local: product.images_local.map(localImageUrl),
}));

export type { PenProduct };
