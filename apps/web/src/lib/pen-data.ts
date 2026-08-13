import penData from "../../../../packages/json-data/autmog.json";

export interface PenProduct {
  id: number;
  title: string;
  url: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  first_seen: string;
  last_seen: string;
  archived: boolean;
  price_min: number;
  price_max: number;
  variant_count: number;
  variant_titles: string[];
  image: string;
  image_cdn: string;
  image_local: string;
  images_local: string[];
  image_count: number;
  body_text: string;
  body_html: string;
  category: string;
  sizes: string[];
  materials: string[];
  refills: string[];
  mechanisms: string[];
  clips: string[];
  noses: string[];
  finishes: string[];
  body_details: string[];
  diameter_in: number | null;
  diameter_mm: number | null;
  weight_g: number | null;
  length_in: number | null;
}

interface PenProductCollection {
  products: PenProduct[];
}

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
