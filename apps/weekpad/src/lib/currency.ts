/**
 * Currency is a display preference: a symbol and a decimal count in front of
 * the numbers. No rates, no conversion, no network. Pick ₩ and every figure
 * is shown in won; the numbers themselves never change.
 */
import type { Lang } from "@/lib/i18n";

export interface CurrencyInfo {
  code: string;
  symbol: string;
  decimals: number;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: "USD", symbol: "$", decimals: 2 },
  { code: "KRW", symbol: "₩", decimals: 0 },
  { code: "JPY", symbol: "¥", decimals: 0 },
  { code: "CNY", symbol: "¥", decimals: 2 },
  { code: "EUR", symbol: "€", decimals: 2 },
  { code: "GBP", symbol: "£", decimals: 2 },
  { code: "TWD", symbol: "NT$", decimals: 0 },
  { code: "HKD", symbol: "HK$", decimals: 2 },
  { code: "SGD", symbol: "S$", decimals: 2 },
  { code: "AUD", symbol: "A$", decimals: 2 },
  { code: "CAD", symbol: "C$", decimals: 2 },
  { code: "THB", symbol: "฿", decimals: 2 },
  { code: "VND", symbol: "₫", decimals: 0 },
  { code: "INR", symbol: "₹", decimals: 2 },
  { code: "PHP", symbol: "₱", decimals: 2 },
  { code: "IDR", symbol: "Rp", decimals: 0 },
];

const BY_CODE = new Map(CURRENCIES.map((c) => [c.code, c]));

export function isCurrency(v: unknown): v is string {
  return typeof v === "string" && BY_CODE.has(v);
}

export function currencyInfo(code: string): CurrencyInfo {
  return BY_CODE.get(code) ?? { code, symbol: code + " ", decimals: 2 };
}

export function defaultCurrency(lang: Lang): string {
  switch (lang) {
    case "ko":
      return "KRW";
    case "ja":
      return "JPY";
    case "zh":
      return "CNY";
    default:
      return "USD";
  }
}

/** "$12.50", "₩12,000", "-€3.00". The symbol can be overridden by the reader. */
export function formatMoney(amount: number, code: string, locale: string, symbol?: string): string {
  const info = currencyInfo(code);
  const sym = symbol && symbol.trim() ? symbol.trim() : info.symbol;
  const abs = Math.abs(amount);
  let num: string;
  try {
    num = new Intl.NumberFormat(locale, {
      minimumFractionDigits: info.decimals,
      maximumFractionDigits: Math.max(info.decimals, 2),
    }).format(abs);
  } catch {
    num = abs.toFixed(info.decimals);
  }
  return `${amount < 0 ? "-" : ""}${sym}${num}`;
}

/** Full-width digits and thousands separators are tolerated; anything else is NaN. */
export function parseAmount(text: string): number {
  const ascii = text
    .replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xff10 + 0x30))
    .replace(/[．]/g, ".")
    .replace(/[,\s_'’]/g, "")
    .trim();
  if (!/^-?\d*(?:\.\d*)?$/.test(ascii) || ascii === "" || ascii === "-" || ascii === "." || ascii === "-.") return NaN;
  const n = Number(ascii);
  return Number.isFinite(n) ? n : NaN;
}
