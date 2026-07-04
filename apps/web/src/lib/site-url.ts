const FALLBACK_ORIGIN = "http://localhost:5173";

/**
 * Absolute site origin used to build shareable, crawler-facing URLs.
 * - Client: the live browser origin.
 * - Server (SSR / prerender): `SITE_URL` env, else a dev fallback.
 *
 * NOTE: the plan also floats deriving the origin from the request `Host`
 * header. That only works for live SSR (prerendered pages have no request),
 * so `SITE_URL` is treated as the source of truth here; a Host-header nicety
 * can be layered on for on-demand requests later.
 */
export function getOrigin(): string {
  if (typeof window !== "undefined") return window.location.origin;
  const fromEnv =
    typeof process !== "undefined" ? process.env?.SITE_URL : undefined;
  return (fromEnv ?? FALLBACK_ORIGIN).replace(/\/+$/, "");
}

export function absoluteUrl(path: string): string {
  return path.startsWith("http") ? path : `${getOrigin()}${path}`;
}
