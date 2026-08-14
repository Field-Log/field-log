import {
  formatMessage,
  type MessageKey,
  type SupportedLocale,
} from "@pocket-trash/localizations";

export class LocalizedServerError extends Error {
  readonly key: MessageKey;

  constructor(key: MessageKey, locale?: SupportedLocale | null) {
    super(formatMessage(key, {}, locale));
    this.name = "LocalizedServerError";
    this.key = key;
  }
}

export function localizedServerError(
  key: MessageKey,
  locale?: SupportedLocale | null,
) {
  return new LocalizedServerError(key, locale);
}
