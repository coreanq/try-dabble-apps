import { isLocale, type Locale } from "./locales.ts";

/** This app's own memory of the pick. The Worker never reads it. */
export const LANG_KEY = "sudoku_lang";

export const HTML_LANG: Record<Locale, string> = {
  ko: "ko",
  en: "en",
  ja: "ja",
};

export const OG_LOCALE: Record<Locale, string> = {
  ko: "ko_KR",
  en: "en_US",
  ja: "ja_JP",
};

export const OG_IMAGE: Record<Locale, string> = {
  ko: "https://sudoku.try-dabble.com/og-image.png",
  en: "https://sudoku.try-dabble.com/og-image-en.png",
  ja: "https://sudoku.try-dabble.com/og-image-ja.png",
};

/** Where src/og-lang.ts points canonical and og:url for a ?lang= request. */
export const SHARE_URL: Record<Locale, string> = {
  ko: "https://sudoku.try-dabble.com/?lang=ko",
  en: "https://sudoku.try-dabble.com/?lang=en",
  ja: "https://sudoku.try-dabble.com/?lang=ja",
};

function readCookieLang(): Locale | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)td_lang=(ko|en|ja)(?:;|$)/);
  return m && isLocale(m[1]) ? m[1] : null;
}

function readStoredLang(): Locale | null {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    return saved !== null && isLocale(saved) ? saved : null;
  } catch {
    return null;
  }
}

/**
 * ?lang= wins — the language picker navigates there, so an in-page pick beats
 * everything below — then the shared td_lang cookie so hops between
 * try-dabble subdomains keep the chosen language, then this app's own
 * sudoku_lang, and Korean last. The Worker only ever sees the query and the
 * cookie, so those two must outrank localStorage or the served HTML and the
 * mounted app would disagree.
 */
export function detectLang(searchLang?: string | null): Locale {
  if (typeof searchLang === "string" && isLocale(searchLang)) {
    rememberLang(searchLang);
    return searchLang;
  }
  const cookie = readCookieLang();
  if (cookie) {
    rememberLang(cookie);
    return cookie;
  }
  return readStoredLang() ?? "ko";
}

/**
 * Two separate try blocks on purpose. localStorage throws in private mode and
 * under blocked third-party storage; the cookie is what the Worker reads, so a
 * shared `try` would let a storage failure cost us the cookie too and every
 * reload would serve Korean HTML under a UI showing the picked language.
 */
export function rememberLang(locale: Locale): void {
  try {
    localStorage.setItem(LANG_KEY, locale);
  } catch {
    /* private mode — this app's own memory of the pick just won't stick */
  }
  try {
    document.cookie = `td_lang=${locale}; path=/; domain=.try-dabble.com; max-age=31536000; samesite=lax`;
  } catch {
    /* cookies blocked — the Worker falls back to Korean on the next load */
  }
}
