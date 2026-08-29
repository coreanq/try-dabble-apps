/**
 * JSON and CSV export. Both files are built in the page and handed to the
 * browser's own download — nothing is uploaded, and no server sees the list.
 */

import type { Store } from "@/lib/stores";

export const CSV_HEADER = ["name", "number", "notes"] as const;

/** RFC 4180: quote when the value contains a comma, a quote or a newline. */
function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

/** CRLF rows and a UTF-8 BOM, so Excel opens Korean and Chinese names intact. */
export function toCSV(stores: Store[]): string {
  const rows = [CSV_HEADER.join(",")];
  for (const s of stores) {
    rows.push([s.name, s.number, s.notes].map(csvCell).join(","));
  }
  return `﻿${rows.join("\r\n")}\r\n`;
}

export function toJSON(stores: Store[]): string {
  return `${JSON.stringify(
    {
      app: "storelog",
      version: 1,
      exportedAt: new Date().toISOString(),
      stores: stores.map(({ name, number, notes }) => ({ name, number, notes })),
    },
    null,
    2,
  )}\n`;
}

function stamp(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}

export function fileName(ext: "json" | "csv"): string {
  return `storelog-${stamp()}.${ext}`;
}

/** Same trick every browser understands: a Blob URL on a throwaway anchor. */
export function download(text: string, name: string, mime: string): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoked on the next tick so Safari has actually started the download.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
