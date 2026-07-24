const htmlEntityMap: Record<string, string> = {
  "&amp;": "&",
  "&gt;": ">",
  "&lt;": "<",
  "&nbsp;": " ",
  "&quot;": '"',
  "&#39;": "'",
};

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function htmlToText(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const withoutTags = value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  const decoded = withoutTags.replace(
    /&(amp|gt|lt|nbsp|quot|#39);/g,
    (entity) => htmlEntityMap[entity] ?? entity,
  );
  const normalized = normalizeWhitespace(decoded);

  return normalized.length > 0 ? normalized : null;
}
