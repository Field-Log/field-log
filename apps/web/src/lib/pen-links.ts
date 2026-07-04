import { type AutmogProduct, products } from "@/lib/autmog-data";
import { normalizedHeadline } from "@/lib/autmog-filters";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Build a `<slug>-<code>` route param from human-readable name parts and a
 * numeric id. The trailing base36 `code` is the unique, authoritative part; the
 * leading slug is decorative (many items share one, so a slug can't identify on
 * its own). Collection-agnostic: pens use it today, and future entity types
 * (fidgets / knives / journals / refills) can reuse it once they land in the DB
 * so every collection shares one shape — `/<collection>/<slug>-<code>`.
 */
export function entityParam(
  nameParts: Array<string | null | undefined>,
  id: number,
): string {
  const slug = slugify(nameParts.filter(Boolean).join(" "));
  const code = id.toString(36);
  return slug ? `${slug}-${code}` : code;
}

/**
 * Reverse of {@link entityParam}: read the trailing base36 code from a route
 * param back to its numeric id, ignoring the decorative slug so edited / short
 * links (or a bare `<code>`) still resolve. Returns null for a malformed code.
 */
export function entityIdFromParam(param: string): number | null {
  const code = param.split("-").pop();
  if (!code) return null;
  const id = Number.parseInt(code, 36);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// --- Pens -------------------------------------------------------------------

/**
 * The `/pens/$penId` route param for a pen: `<name-slug>-<short-code>`, e.g.
 * `38-clipless-click-pen-bronze-titanium-conical-2zmtshtq3`. Slug is headline +
 * material(s) + tip (nose); the trailing code is the unique Shopify id.
 */
export function penParam(product: AutmogProduct): string {
  return entityParam(
    [
      normalizedHeadline(product),
      product.materials.join(" "),
      product.noses.join(" "),
    ],
    product.id,
  );
}

/** Resolve a `/pens/$penId` param back to a pen via its trailing short code. */
export function decodePenParam(penId: string): AutmogProduct | null {
  const id = entityIdFromParam(penId);
  if (id === null) return null;
  return products.find((product) => product.id === id) ?? null;
}
