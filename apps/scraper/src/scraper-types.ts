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
  bodyHtml: string | null;
  bodyShape: string | null;
  bodyText: string | null;
  category: string | null;
  clip: string | null;
  currencyCode: string;
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
  productType: string | null;
  productUrl: string;
  rawPayloadHash: string;
  rawShopifyData: unknown;
  refill: string | null;
  size: string | null;
  sourceCreatedAt: string | null;
  sourceHandle: string;
  sourceProductId: string;
  sourcePublishedAt: string | null;
  sourceUpdatedAt: string | null;
  tags: string[];
  title: string;
  variants: unknown[];
  vendor: string | null;
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
