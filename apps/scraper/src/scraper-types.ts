import type {
  AutmogPenNormalizedData,
  GrimsmoVariationImageRecord,
} from "@package/database";

export const scraperSources = {
  autmog: "autmog",
  grimsmoFjell: "grimsmo-fjell",
  grimsmoNorseman: "grimsmo-norseman",
  grimsmoRask: "grimsmo-rask",
  grimsmoSaga: "grimsmo-saga",
} as const;

export type ScraperSourceName =
  (typeof scraperSources)[keyof typeof scraperSources];
export type GrimsmoPenSourceName = typeof scraperSources.grimsmoSaga;
export type GrimsmoKnifeSourceName =
  | typeof scraperSources.grimsmoFjell
  | typeof scraperSources.grimsmoNorseman
  | typeof scraperSources.grimsmoRask;
export type GrimsmoSourceName = GrimsmoKnifeSourceName | GrimsmoPenSourceName;

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
    }
  | {
      item: NormalizedGrimsmoPenVariation;
      source: typeof scraperSources.grimsmoSaga;
      type: "grimsmo.penVariation";
    }
  | {
      items: NormalizedGrimsmoKnifeVariation[];
      source:
        | typeof scraperSources.grimsmoFjell
        | typeof scraperSources.grimsmoNorseman
        | typeof scraperSources.grimsmoRask;
      type: "grimsmo.knifeVariationBatch";
    }
  | {
      items: NormalizedGrimsmoPenVariation[];
      source: typeof scraperSources.grimsmoSaga;
      type: "grimsmo.penVariationBatch";
    }
  | {
      item: NormalizedGrimsmoKnifeVariation;
      source:
        | typeof scraperSources.grimsmoFjell
        | typeof scraperSources.grimsmoNorseman
        | typeof scraperSources.grimsmoRask;
      type: "grimsmo.knifeVariation";
    };

export type ScraperImageJob =
  | {
      imageId: number;
      source: ScraperSourceName;
      sourceHash: string;
      type: "tmp.image.upload";
    }
  | {
      imageId: number;
      source: ScraperSourceName;
      type: "tmp.image.delete";
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

export type NormalizedGrimsmoProduct = {
  detailsHash: string;
  productHandle: string;
  productUrl: string;
  title: string;
};

export type NormalizedGrimsmoPenVariation = {
  availableForSale: boolean;
  bodyColors: string[];
  bodyFinishes: string[];
  bodyMaterials: string[];
  bodyText: string | null;
  book: string | null;
  bullets: string[];
  bulletsByCategory: Record<string, string[]>;
  case: string | null;
  currencyCode: string;
  description: string | null;
  detailsHash: string;
  engraving: string | null;
  imageSetHash: string;
  images: GrimsmoVariationImageRecord[];
  priceMaxCents: number | null;
  priceMinCents: number | null;
  product: NormalizedGrimsmoProduct;
  productUrl: string;
  refill: string | null;
  sagaNumber: string | null;
  sliderColors: string[];
  sliderMaterials: string[];
  sliderStyle: string | null;
  sourceCollection: GrimsmoCollectionKind;
  sourceHandle: string;
  sourceProductId: string;
  tags: string[];
  tipLogo: string | null;
  title: string;
  titleFull: string;
  variants: unknown[];
  visibleBullets: string[];
};

export type GrimsmoKnifeType = "fjell" | "norseman" | "rask";

export type NormalizedGrimsmoKnifeVariation = {
  availableForSale: boolean;
  bladeFinishes: string[];
  bladeSteels: string[];
  bodyText: string | null;
  bullets: string[];
  bulletsByCategory: Record<string, string[]>;
  case: string | null;
  currencyCode: string;
  description: string | null;
  detailsHash: string;
  handleColors: string[];
  handleFinishes: string[];
  handleMaterials: string[];
  hardwareColors: string[];
  imageSetHash: string;
  images: GrimsmoVariationImageRecord[];
  knifeNumber: string | null;
  knifeType: GrimsmoKnifeType;
  mechanisms: string[];
  patterns: string[];
  priceMaxCents: number | null;
  priceMinCents: number | null;
  product: NormalizedGrimsmoProduct;
  productUrl: string;
  sourceCollection: GrimsmoCollectionKind;
  sourceHandle: string;
  sourceProductId: string;
  tags: string[];
  title: string;
  titleFull: string;
  variants: unknown[];
};

export type GrimsmoCollectionKind = "archive" | "inventory";
