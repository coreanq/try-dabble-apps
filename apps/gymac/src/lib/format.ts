/** Locale-aware display of instants and day keys. Pure, so tests and SSR can call it. */
import { parseDateKey } from "./dates.ts";
import { LOCALE, type Lang } from "./i18n.ts";

export function formatDateTime(lang: Lang, iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  try {
    return new Intl.DateTimeFormat(LOCALE[lang], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);
  } catch {
    return iso.slice(0, 16).replace("T", " ");
  }
}

export function formatTime(lang: Lang, iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  try {
    return new Intl.DateTimeFormat(LOCALE[lang], { hour: "2-digit", minute: "2-digit" }).format(d);
  } catch {
    return iso.slice(11, 16);
  }
}

export function formatDay(lang: Lang, key: string): string {
  try {
    return new Intl.DateTimeFormat(LOCALE[lang], { year: "numeric", month: "long", day: "numeric", weekday: "short" }).format(parseDateKey(key));
  } catch {
    return key;
  }
}

export function formatMonth(lang: Lang, yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  try {
    return new Intl.DateTimeFormat(LOCALE[lang], { year: "numeric", month: "long" }).format(new Date(y, m - 1, 1, 12));
  } catch {
    return yearMonth;
  }
}

export function formatRelativeDay(lang: Lang, key: string): string {
  try {
    return new Intl.DateTimeFormat(LOCALE[lang], { month: "short", day: "numeric" }).format(parseDateKey(key));
  } catch {
    return key;
  }
}
