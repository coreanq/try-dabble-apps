import { useMemo } from "react";

import { makeQr } from "@/lib/qr";

/** Renders the encoded URL as a QR. Falls back to the URL itself if the text
 *  is somehow too long to encode, so the sticker is never blank. */
export function QrCode({ value, className }: { value: string; className?: string }) {
  const qr = useMemo(() => makeQr(value), [value]);

  if (!qr) {
    return <p className="bq-meta break-all">{value}</p>;
  }

  return (
    <svg
      className={className}
      viewBox={`0 0 ${qr.size} ${qr.size}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={value}
    >
      <rect width={qr.size} height={qr.size} fill="#ffffff" />
      <path d={qr.path} fill="#1c1408" />
    </svg>
  );
}
