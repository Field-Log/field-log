import { htmlToMarkdown } from "@package/markdown";
import { hashObject, hashString } from "../lib/hash.js";
import { htmlToText, normalizeWhitespace } from "../lib/text.js";
import type {
  NormalizedAutmogPen,
  NormalizedAutmogPenImage,
} from "../scraper-types.js";
import type { ShopifyProduct } from "./shopify.js";

const autmogRootUrl = "https://www.autmog.com";

const materialPatterns = [
  ["6al-4v titanium", /\b6al-4v\b|\bgrade 5 titanium\b/i],
  ["titanium", /\btitanium\b|\bti\b/i],
  ["aluminum", /\baluminum\b|\baluminium\b/i],
  ["brass", /\bbrass\b/i],
  ["bronze", /\bbronze\b/i],
  ["copper", /\bcopper\b/i],
  ["stainless steel", /\bstainless\b|\bsteel\b/i],
  ["ultem", /\bultem\b/i],
  ["zirconium", /\bzirconium\b|\bzirc\b/i],
] as const;

const finishPatterns = [
  ["anodized", /\banodiz/i],
  ["blasted", /\bblast/i],
  ["brushed", /\bbrush/i],
  ["polished", /\bpolish/i],
  ["stonewashed", /\bstonewash/i],
  ["tumbled", /\btumbl/i],
] as const;

export function normalizeAutmogProduct(
  product: ShopifyProduct,
): NormalizedAutmogPen {
  const bodyHtml = product.body_html ?? null;
  const bodyText = htmlToText(bodyHtml);
  const description = htmlToMarkdown(bodyHtml);
  const searchText = normalizeWhitespace(
    `${product.title} ${product.product_type ?? ""} ${product.tags.join(" ")} ${
      bodyText ?? ""
    }`,
  );
  const images = normalizeImages(product);
  const imageSetHash = hashObject(
    images.map((image) => ({
      position: image.position,
      sourceHash: image.sourceHash,
      sourceImageId: image.sourceImageId,
      sourceUrl: image.sourceUrl,
    })),
  );
  const sourceProductId = String(product.id);
  const productUrl = `${autmogRootUrl}/products/${product.handle}`;
  const variants = product.variants.map((variant) => ({
    available: variant.available ?? null,
    id: String(variant.id),
    price: variant.price ?? null,
    title: variant.title ?? null,
  }));
  const prices = product.variants
    .map((variant) => parsePriceCents(variant.price))
    .filter((price): price is number => price !== null);
  const availableForSale =
    product.available ??
    product.variants.some((variant) => variant.available === true);
  const materials = findMatches(searchText, materialPatterns);
  const bodyDetails = normalizeBodyDetails(searchText);
  const category = getCategory(searchText);
  const normalizedData = {
    availableForSale,
    bodyDetails,
    bodyShape: getBodyShape(searchText),
    category,
    clip: getClip(searchText),
    finish: findFirstMatch(searchText, finishPatterns),
    grip: getGrip(searchText),
    imageSetHash,
    images,
    materials,
    mechanism: getMechanism(searchText),
    nose: getNose(searchText),
    priceMaxCents: prices.length > 0 ? Math.max(...prices) : null,
    priceMinCents: prices.length > 0 ? Math.min(...prices) : null,
    productUrl,
    refill: getRefill(searchText),
    size: getSize(searchText),
    title: product.title,
    variants,
  };
  const detailsHash = hashObject({
    ...normalizedData,
    description,
    images: undefined,
    imageSetHash: undefined,
  });

  return {
    availableForSale,
    bodyDetails,
    clip: normalizedData.clip,
    currencyCode: "USD",
    description,
    detailsHash,
    finish: normalizedData.finish,
    grip: normalizedData.grip,
    imageSetHash,
    images,
    materials,
    mechanism: normalizedData.mechanism,
    normalizedData,
    nose: normalizedData.nose,
    priceMaxCents: normalizedData.priceMaxCents,
    priceMinCents: normalizedData.priceMinCents,
    productTypes: getProductTypes({
      category: normalizedData.category,
      sourceProductType: product.product_type ?? null,
    }),
    productUrl,
    refill: normalizedData.refill,
    size: normalizedData.size,
    sourceHandle: product.handle,
    sourceProductId,
    tags: product.tags,
    title: product.title,
    variants,
  };
}

function normalizeImages(product: ShopifyProduct): NormalizedAutmogPenImage[] {
  return product.images.map((image, index) => {
    const sourceImageId = image.id === undefined ? null : String(image.id);
    const position = image.position ?? index + 1;
    const width = image.width ?? null;
    const height = image.height ?? null;

    return {
      altText: image.alt ?? null,
      height,
      position,
      sourceHash: hashString(
        JSON.stringify({
          height,
          sourceImageId,
          sourceUrl: image.src,
          width,
        }),
      ),
      sourceImageId,
      sourceUrl: image.src,
      width,
    };
  });
}

function parsePriceCents(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  const numberValue =
    typeof value === "number" ? value : Number(value.replace(/[^0-9.]/g, ""));

  return Number.isFinite(numberValue) ? Math.round(numberValue * 100) : null;
}

function getSize(value: string): string | null {
  const match = value.match(/\b(36|40|42|47)\b(?:\s*(?:clipless|click|pen))?/i);

  return match?.[1] ?? null;
}

function getCategory(value: string): string | null {
  if (/\bpen\b/i.test(value)) {
    return "pen";
  }

  return null;
}

function getProductTypes(input: {
  category: string | null;
  sourceProductType: string | null;
}): string[] {
  if (input.category) {
    return [input.category];
  }

  if (!input.sourceProductType) {
    return [];
  }

  const productType = normalizeWhitespace(
    input.sourceProductType,
  ).toLowerCase();

  return productType.length > 0 ? [productType] : [];
}

function getMechanism(value: string): string | null {
  if (/\bclick\b/i.test(value)) {
    return "click";
  }

  if (/\btwist\b/i.test(value)) {
    return "twist";
  }

  if (/\bbolt\b/i.test(value)) {
    return "bolt";
  }

  return null;
}

function getRefill(value: string): string | null {
  if (/\bparker\b/i.test(value)) {
    return "Parker";
  }

  if (/\bpilot\s*g2\b|\bg2\b/i.test(value)) {
    return "Pilot G2";
  }

  if (/\benergel\b/i.test(value)) {
    return "EnerGel";
  }

  if (/\bschmidt\b/i.test(value)) {
    return "Schmidt";
  }

  return null;
}

function getClip(value: string): string | null {
  if (/\bclipless\b|\bno clip\b/i.test(value)) {
    return "clipless";
  }

  if (/\bwith clip\b|\bclipped\b/i.test(value)) {
    return "clip";
  }

  return null;
}

function getGrip(value: string): string | null {
  if (/\bgrip lines?\b|\bgrip rings?\b/i.test(value)) {
    return "grip lines";
  }

  if (/\bsmooth\b/i.test(value)) {
    return "smooth";
  }

  return null;
}

function getBodyShape(value: string): string | null {
  if (/\btapered\b|\btaper\b/i.test(value)) {
    return "tapered";
  }

  if (/\bstraight\b/i.test(value)) {
    return "straight";
  }

  return null;
}

function getNose(value: string): string | null {
  if (/\bcone nose\b|\bconical\b/i.test(value)) {
    return "cone";
  }

  if (/\bround nose\b/i.test(value)) {
    return "round";
  }

  if (/\bstep nose\b|\bstepped nose\b/i.test(value)) {
    return "step";
  }

  return null;
}

function normalizeBodyDetails(value: string): string[] {
  return [
    ...new Set(
      [
        getBodyShape(value),
        getGrip(value),
        /\brings?\b/i.test(value) ? "rings" : null,
      ].filter((detail): detail is string => detail !== null),
    ),
  ];
}

function findMatches(
  value: string,
  patterns: readonly (readonly [string, RegExp])[],
): string[] {
  return patterns
    .filter(([, pattern]) => pattern.test(value))
    .map(([label]) => label);
}

function findFirstMatch(
  value: string,
  patterns: readonly (readonly [string, RegExp])[],
): string | null {
  return patterns.find(([, pattern]) => pattern.test(value))?.[0] ?? null;
}
