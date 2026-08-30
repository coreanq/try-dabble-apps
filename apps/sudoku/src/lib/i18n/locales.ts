export const SUPPORTED_LOCALES = ['ko', 'en', 'ja'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export function isLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.some((locale) => locale === value);
}

export function defaultLocale(): Locale {
  return 'ko';
}
