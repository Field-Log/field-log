import { type AutmogProduct, products } from "@/lib/autmog-data";
import { normalizedHeadline } from "@/lib/autmog-filters";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Reversible short code for a pen id (base36 of the numeric Shopify id). */
export function penCode(product: AutmogProduct): string {
  return product.id.toString(36);
}

/**
 * Human-readable descriptor for the slug: headline + material(s) + tip (nose).
 * Not unique on its own (many pens share it), which is why the code follows.
 */
function penName(product: AutmogProduct): string {
  return [
    normalizedHeadline(product),
    product.materials.join(" "),
    product.noses.join(" "),
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * The `$penId` route param: `<name-slug>-<short-code>`, e.g.
 * `38-clipless-click-pen-bronze-titanium-conical-2zmtshtq3`. The trailing
 * code is the unique id; the leading slug is decorative (headline + material
 * + tip).
 */
export function penParam(product: AutmogProduct): string {
  const slug = slugify(penName(product));
  const code = penCode(product);
  return slug ? `${slug}-${code}` : code;
}

/**
 * Resolve a `$penId` param back to a product via its trailing short code,
 * ignoring the decorative slug so edited/short links still resolve.
 */
export function decodePenParam(penId: string): AutmogProduct | null {
  const code = penId.split("-").pop();
  if (!code) return null;
  const id = Number.parseInt(code, 36);
  if (!Number.isInteger(id) || id <= 0) return null;
  return products.find((product) => product.id === id) ?? null;
}
