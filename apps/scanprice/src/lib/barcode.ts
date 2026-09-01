/**
 * EAN-13 / UPC-A / EAN-8 only — the three symbologies actually printed on a
 * supermarket shelf. Two jobs live here:
 *
 *   1. normalise + check a code, so a typed number and a camera read end up as
 *      the same key. UPC-A is stored as its EAN-13 form (a leading zero), which
 *      is what the same product carries outside North America — otherwise the
 *      same tin of beans would file itself twice.
 *   2. draw the bars, so a saved code looks like the thing on the shelf rather
 *      than a row of digits.
 */

export type CodeFormat = "ean_13" | "upc_a" | "ean_8";

export const SCAN_FORMATS = ["ean_13", "upc_a", "ean_8"] as const;

/** Weights run 1,3,1,3… from the right-hand data digit, which is the same rule
 *  for EAN-8, UPC-A and EAN-13. */
function checkDigit(digits: string): number {
  let sum = 0;
  for (let i = digits.length - 1, w = 3; i >= 0; i--, w = w === 3 ? 1 : 3) {
    sum += Number(digits[i]) * w;
  }
  return (10 - (sum % 10)) % 10;
}

export function isValidCode(code: string): boolean {
  if (!/^\d+$/.test(code)) return false;
  if (code.length !== 8 && code.length !== 12 && code.length !== 13) return false;
  return checkDigit(code.slice(0, -1)) === Number(code[code.length - 1]);
}

/**
 * Digits only, then UPC-A (12) widened to its EAN-13 form. Returns null when
 * the result is not a real EAN-13 / UPC-A / EAN-8 number, so a half-read scan
 * or a typo never becomes a row.
 */
export function normalizeCode(raw: string): string | null {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (!isValidCode(digits)) return null;
  return digits.length === 12 ? `0${digits}` : digits;
}

export function formatOf(code: string): CodeFormat {
  if (code.length === 8) return "ean_8";
  return code.startsWith("0") ? "upc_a" : "ean_13";
}

/** Grouped the way the digits are printed under the bars: 8 801234 567890. */
export function prettyCode(code: string): string {
  if (code.length === 13) return `${code[0]} ${code.slice(1, 7)} ${code.slice(7)}`;
  if (code.length === 8) return `${code.slice(0, 4)} ${code.slice(4)}`;
  return code;
}

/* ------------------------------------------------------------- the bars */

const L = [
  "0001101", "0011001", "0010011", "0111101", "0100011",
  "0110001", "0101111", "0111011", "0110111", "0001011",
];
const G = [
  "0100111", "0110011", "0011011", "0100001", "0011101",
  "0111001", "0000101", "0010001", "0001001", "0010111",
];
const R = [
  "1110010", "1100110", "1101100", "1000010", "1011100",
  "1001110", "1010000", "1000100", "1001000", "1110100",
];
/** Which of the first six digits are G-coded — the first digit is not drawn as
 *  bars at all, it is carried by this parity pattern. */
const PARITY = [
  "LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG",
  "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL",
];

/**
 * The real module string for the code: "1" is a bar, "0" is a space. 95
 * modules for EAN-13, 67 for EAN-8. Returns "" for anything else so a caller
 * can fall back to plain digits.
 */
export function modules(code: string): string {
  if (code.length === 13) {
    const parity = PARITY[Number(code[0])];
    let out = "101";
    for (let i = 1; i <= 6; i++) {
      out += (parity[i - 1] === "L" ? L : G)[Number(code[i])];
    }
    out += "01010";
    for (let i = 7; i <= 12; i++) out += R[Number(code[i])];
    return `${out}101`;
  }
  if (code.length === 8) {
    let out = "101";
    for (let i = 0; i < 4; i++) out += L[Number(code[i])];
    out += "01010";
    for (let i = 4; i < 8; i++) out += R[Number(code[i])];
    return `${out}101`;
  }
  return "";
}

export interface Bar {
  x: number;
  width: number;
}

/** Runs of "1" collapsed into rectangles, ready for an <svg>. */
export function bars(code: string): { bars: Bar[]; width: number } {
  const mods = modules(code);
  const out: Bar[] = [];
  let i = 0;
  while (i < mods.length) {
    if (mods[i] === "1") {
      let j = i;
      while (j < mods.length && mods[j] === "1") j++;
      out.push({ x: i, width: j - i });
      i = j;
    } else {
      i++;
    }
  }
  return { bars: out, width: mods.length };
}
