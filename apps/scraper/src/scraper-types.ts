import type { AutmogPenNormalizedData } from "@package/database";

export const scraperSources = {
  autmog: "autmog",
  grimsmoFjell: "grimsmo-fjell",
  grimsmoNorseman: "grimsmo-norseman",
  grimsmoRask: "grimsmo-rask",
  grimsmoSaga: "grimsmo-saga",
} as const;

export type ScraperSourceName =
  (typeof scraperSources)[keyof typeof scraperSources];

export const scraperQueueNames = {
  images: "scraper-images",
  items: "scraper-items",
} as const;

export type ScraperItemJob =
  | {
      item: NormalizedAutmogPen;
      source: typeof scraperSources.autmog;
      type: "autmog.pen";
    }
  | {
      seenSourceProductIds: string[];
      source: typeof scraperSources.autmog;
      type: "autmog.archiveMissing";
    };

export type ScraperImageJob =
  | {
      imageId: number;
      source: typeof scraperSources.autmog;
      sourceImageId: string | null;
      sourceUrl: string;
      type: "autmog.image.upload";
    }
  | {
      imageId: number;
      source: typeof scraperSources.autmog;
      type: "autmog.image.delete";
    };

export type NormalizedAutmogPen = {
  availableForSale: boolean;
  bodyDetails: string[];
  clip: string | null;
  currencyCode: string;
  description: string | null;
  detailsHash: string;
  finish: string | null;
  grip: string | null;
  imageSetHash: string;
  images: NormalizedAutmogPenImage[];
  materials: string[];
  mechanism: string | null;
  normalizedData: AutmogPenNormalizedData;
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
  variants: unknown[];
};

export type NormalizedAutmogPenImage = {
  altText: string | null;
  height: number | null;
  position: number;
  sourceHash: string;
  sourceImageId: string | null;
  sourceUrl: string;
  width: number | null;
};
