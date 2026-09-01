/**
 * JSON and CSV out, JSON back in. Both files are built inside the page and
 * handed to the browser's own download; the import is read here with
 * FileReader. No server ever sees a price.
 */

import type { Item } from "@/lib/prices";
import { sortRows } from "@/lib/prices";

export const CSV_HEADER = ["code", "name", "day", "price", "store"] as const;

/** RFC 4180: quote when the value holds a comma, a quote or a newline. */
function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

/** One line per price row, CRLF and a UTF-8 BOM so Excel opens Korean and
 *  Chinese store names intact. */
export function toCSV(items: Item[]): string {
  const rows = [CSV_HEADER.join(",")];
  for (const item of items) {
    for (const row of sortRows(item.rows)) {
      rows.push(
        [item.code, item.name, row.day, String(row.price), row.store].map(csvCell).join(","),
      );
    }
  }
  return `﻿${rows.join("\r\n")}\r\n`;
}

export function toJSON(items: Item[]): string {
  return `${JSON.stringify(
    {
      app: "scanprice",
      version: 1,
      exportedAt: new Date().toISOString(),
      items: items.map(({ code, name, rows, createdAt, updatedAt }) => ({
        code,
        name,
        rows: sortRows(rows),
        createdAt,
        updatedAt,
      })),
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
  return `scanprice-${stamp()}.${ext}`;
}

/** A Blob URL on a throwaway anchor — the trick every browser understands. */
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
  // Revoked on a later tick so Safari has actually started the download.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Reads the picked file in this tab. It is never sent anywhere. */
export function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsText(file);
  });
}
