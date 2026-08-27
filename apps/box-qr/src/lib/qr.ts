import qrcode from "qrcode-generator";

/**
 * The sticker's QR. The pre-Vite app shipped the same encoder as a global
 * script (public/js/qrcode.js); it is now the qrcode-generator package and
 * the modules come back as one SVG path so React can render it without
 * dangerouslySetInnerHTML — and so the printed sticker stays vector-sharp.
 */
export interface Qr {
  /** viewBox side, in modules, quiet zone included. */
  size: number;
  path: string;
}

export function makeQr(text: string, margin = 2): Qr | null {
  try {
    const qr = qrcode(0, "M");
    qr.addData(text);
    qr.make();
    const count = qr.getModuleCount();
    let path = "";
    for (let row = 0; row < count; row += 1) {
      let start = -1;
      /* One rect per run of dark modules keeps the path a fraction of the
         size of one-rect-per-module. */
      for (let col = 0; col <= count; col += 1) {
        const dark = col < count && qr.isDark(row, col);
        if (dark && start < 0) start = col;
        if (!dark && start >= 0) {
          const run = col - start;
          path += `M${start + margin} ${row + margin}h${run}v1h-${run}z`;
          start = -1;
        }
      }
    }
    return { size: count + margin * 2, path };
  } catch {
    return null;
  }
}
