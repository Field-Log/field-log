import type { AutmogProduct } from "./autmog-data";

export type DimensionUnit = "in" | "mm";
export type WeightUnit = "g" | "oz";
export type CurrencyCode =
  | "CAD"
  | "USD"
  | "EUR"
  | "GBP"
  | "AUD"
  | "JPY"
  | "CHF"
  | "NZD";

export const currencies: CurrencyCode[] = [
  "CAD",
  "USD",
  "EUR",
  "GBP",
  "AUD",
  "JPY",
  "CHF",
  "NZD",
];

export const baseCurrency: CurrencyCode = "CAD";
const shopifyMarketsMarkup = 1.025;

export type CurrencyRates = Partial<Record<CurrencyCode, number>>;

export function formatDate(iso: string) {
  if (!iso) return "-";
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return "-";

  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDiameter(product: AutmogProduct, unit: DimensionUnit) {
  if (unit === "mm") {
    const mm =
      product.diameter_mm ??
      (product.diameter_in == null
        ? null
        : Number((product.diameter_in * 25.4).toFixed(1)));
    return mm == null ? null : `${mm} mm`;
  }

  return product.diameter_in == null ? null : `${product.diameter_in}"`;
}

export function formatLength(product: AutmogProduct, unit: DimensionUnit) {
  if (unit === "mm") {
    const mm =
      product.length_in == null
        ? null
        : Number((product.length_in * 25.4).toFixed(1));
    return mm == null ? null : `${mm} mm`;
  }

  return product.length_in == null ? null : `${product.length_in}"`;
}

export function formatWeight(product: AutmogProduct, unit: WeightUnit) {
  if (product.weight_g == null) return null;
  if (unit === "oz") {
    return `${Number((product.weight_g / 28.3495).toFixed(2))} oz`;
  }
  return `${product.weight_g} g`;
}

export function formatPrice(
  min: number | null,
  max: number | null,
  currency: CurrencyCode,
  rates: CurrencyRates,
) {
  if (min == null) return "-";
  if (max == null || min === max) return formatMoney(min, currency, rates);

  return `${formatMoney(min, currency, rates)}-${formatMoney(
    max,
    currency,
    rates,
  )}`;
}

function formatMoney(
  baseAmount: number,
  currency: CurrencyCode,
  rates: CurrencyRates,
) {
  const rate = rates[currency] ?? 1;
  const markup = currency === baseCurrency ? 1 : shopifyMarketsMarkup;
  const value = baseAmount * rate * markup;

  try {
    return new Intl.NumberFormat("en-CA", {
      currency,
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
      style: "currency",
    }).format(value);
  } catch {
    return `${currency} ${Math.round(value)}`;
  }
}

export function todayUTCDateString() {
  const date = new Date();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}-${day}`;
}
