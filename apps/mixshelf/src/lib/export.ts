import {
  backupFilename,
  exportPayload,
  type ShelfItem,
} from "@/lib/items";

export function toJSON(items: ShelfItem[]): string {
  return `${JSON.stringify(exportPayload(items), null, 2)}\n`;
}

export function fileName(): string {
  return backupFilename();
}

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
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
