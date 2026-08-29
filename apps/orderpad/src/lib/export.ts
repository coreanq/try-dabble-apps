/**
 * JSON and CSV export, and JSON import. Both files are built in the page and
 * handed to the browser's own download; the import is read with FileReader.
 * Nothing is uploaded, and no server ever sees the order book.
 */

import type { Order } from "@/lib/orders";

export const CSV_HEADER = [
  "no",
  "customer",
  "item",
  "option",
  "address",
  "paid",
  "shipped",
  "ship_by",
] as const;

/** RFC 4180: quote when the value contains a comma, a quote or a newline. */
function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

/** CRLF rows and a UTF-8 BOM, so Excel opens Korean and Chinese names intact. */
export function toCSV(orders: Order[]): string {
  const rows = [CSV_HEADER.join(",")];
  for (const o of orders) {
    rows.push(
      [
        String(o.no),
        o.customer,
        o.item,
        o.option,
        // Newlines inside an address survive because the cell is quoted.
        o.address,
        o.paid ? "yes" : "no",
        o.shipped ? "yes" : "no",
        o.shipBy,
      ]
        .map(csvCell)
        .join(","),
    );
  }
  return `﻿${rows.join("\r\n")}\r\n`;
}

export function toJSON(orders: Order[]): string {
  return `${JSON.stringify(
    {
      app: "orderpad",
      version: 1,
      exportedAt: new Date().toISOString(),
      orders: orders.map(({ no, customer, item, option, address, paid, shipped, shipBy }) => ({
        no,
        customer,
        item,
        option,
        address,
        paid,
        shipped,
        shipBy,
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
  return `orderpad-${stamp()}.${ext}`;
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

/** Reads the picked file in this tab. It is never sent anywhere. */
export function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsText(file);
  });
}
