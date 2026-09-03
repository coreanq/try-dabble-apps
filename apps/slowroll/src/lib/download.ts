/**
 * Saving prints to the device: an anchor with a download attribute, one file
 * at a time. "Download all" walks the roll with a short pause between files so
 * mobile browsers do not swallow the burst.
 */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function printFilename(rollDate: number, index: number): string {
  const d = new Date(rollDate);
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  return `slowroll-${stamp}-${pad(index + 1)}.jpg`;
}

export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function saveAll(
  items: { blob: Blob; filename: string }[],
  onProgress?: (done: number, total: number) => void,
  gapMs = 450,
): Promise<number> {
  let done = 0;
  for (const item of items) {
    saveBlob(item.blob, item.filename);
    done += 1;
    onProgress?.(done, items.length);
    if (done < items.length) await sleep(gapMs);
  }
  return done;
}
