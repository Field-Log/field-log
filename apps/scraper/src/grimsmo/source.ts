import {
  type GrimsmoCollectionKind,
  type GrimsmoKnifeSourceName,
  type GrimsmoKnifeType,
  type GrimsmoSourceName,
  scraperSources,
} from "../scraper-types.js";
import {
  fetchShopifyCollectionProducts,
  type ShopifyProduct,
} from "../shopify.js";

const grimsmoRootUrl = "https://grimsmoknives.com";

export type GrimsmoSourceDefinition =
  | {
      kind: "pen";
      productHandle: "saga";
      source: typeof scraperSources.grimsmoSaga;
      title: "Saga";
    }
  | {
      kind: "knife";
      knifeType: GrimsmoKnifeType;
      productHandle: GrimsmoKnifeType;
      source: GrimsmoKnifeSourceName;
      title: "Fjell" | "Norseman" | "Rask";
    };

export type GrimsmoFetchedProduct = {
  collectionKind: GrimsmoCollectionKind;
  product: ShopifyProduct;
};

export type FetchGrimsmoProductsOptions = {
  fetch?: typeof fetch;
  limit?: number;
  pageLimit?: number;
  pagePauseMs?: number;
  proxyUrl?: string;
  requestTimeoutMs?: number;
  retries?: number;
  signal?: AbortSignal;
  source: GrimsmoSourceName;
};

export const grimsmoSourceDefinitions = {
  [scraperSources.grimsmoSaga]: {
    kind: "pen",
    productHandle: "saga",
    source: scraperSources.grimsmoSaga,
    title: "Saga",
  },
  [scraperSources.grimsmoFjell]: {
    kind: "knife",
    knifeType: "fjell",
    productHandle: "fjell",
    source: scraperSources.grimsmoFjell,
    title: "Fjell",
  },
  [scraperSources.grimsmoNorseman]: {
    kind: "knife",
    knifeType: "norseman",
    productHandle: "norseman",
    source: scraperSources.grimsmoNorseman,
    title: "Norseman",
  },
  [scraperSources.grimsmoRask]: {
    kind: "knife",
    knifeType: "rask",
    productHandle: "rask",
    source: scraperSources.grimsmoRask,
    title: "Rask",
  },
} as const satisfies Record<GrimsmoSourceName, GrimsmoSourceDefinition>;

const collectionHandles = {
  [scraperSources.grimsmoSaga]: {
    archive: "saga",
    inventory: "saga-inventory",
  },
  [scraperSources.grimsmoFjell]: {
    archive: "fjell-archive",
    inventory: "fjell-inventory",
  },
  [scraperSources.grimsmoNorseman]: {
    archive: "norseman-archive",
    inventory: "norseman-inventory",
  },
  [scraperSources.grimsmoRask]: {
    archive: "rask-archive",
    inventory: "rask-inventory",
  },
} as const;

export function getGrimsmoSourceDefinition(
  source: GrimsmoSourceName,
): GrimsmoSourceDefinition {
  return grimsmoSourceDefinitions[source];
}

export async function fetchGrimsmoProducts({
  fetch: fetcher,
  limit,
  pageLimit = 30,
  pagePauseMs = 500,
  proxyUrl,
  requestTimeoutMs,
  retries = 3,
  signal,
  source,
}: FetchGrimsmoProductsOptions): Promise<GrimsmoFetchedProduct[]> {
  const handles = collectionHandles[source];

  if (!handles) {
    throw new Error(`Unsupported Grimsmo source "${source}".`);
  }

  const [inventoryProducts, archiveProducts] = await Promise.all([
    fetchShopifyCollectionProducts({
      collectionUrl: buildCollectionProductsUrl(handles.inventory),
      fetch: fetcher,
      limit,
      pageLimit,
      pagePauseMs,
      proxyUrl,
      requestTimeoutMs,
      retries,
      signal,
      userAgent: "python-requests/2.33.1",
    }),
    fetchShopifyCollectionProducts({
      collectionUrl: buildCollectionProductsUrl(handles.archive),
      fetch: fetcher,
      limit,
      pageLimit,
      pagePauseMs,
      proxyUrl,
      requestTimeoutMs,
      retries,
      signal,
      userAgent: "python-requests/2.33.1",
    }),
  ]);

  const seenHandles = new Set<string>();
  const fetched: GrimsmoFetchedProduct[] = [];

  for (const product of inventoryProducts) {
    seenHandles.add(product.handle);
    fetched.push({ collectionKind: "inventory", product });
  }

  for (const product of archiveProducts) {
    if (seenHandles.has(product.handle)) {
      continue;
    }

    fetched.push({ collectionKind: "archive", product });
  }

  return fetched;
}

export function buildGrimsmoProductUrl(handle: string) {
  return `${grimsmoRootUrl}/products/${handle}`;
}

export function buildGrimsmoProductFamilyUrl(handle: string) {
  return `${grimsmoRootUrl}/collections/${handle}`;
}

function buildCollectionProductsUrl(handle: string) {
  return `${grimsmoRootUrl}/collections/${handle}/products.json`;
}
