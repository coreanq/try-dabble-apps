import { useEffect, useState } from "react";

import { getPhoto } from "@/lib/pins";

/**
 * Loads one photo Blob out of IndexedDB and hands back an object URL, revoked
 * when the entry scrolls out of the tree. Nothing is ever fetched over the
 * network — the picture only exists on this device.
 */
export function usePhotoUrl(pinId: string, enabled: boolean, version = 0): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setUrl(null);
      return;
    }
    let alive = true;
    let made: string | null = null;
    getPhoto(pinId).then((blob) => {
      if (!alive || !blob) return;
      made = URL.createObjectURL(blob);
      setUrl(made);
    });
    return () => {
      alive = false;
      if (made) URL.revokeObjectURL(made);
      setUrl(null);
    };
  }, [pinId, enabled, version]);

  return url;
}

/** The taped snapshot in a list entry. Empty frame when there is no photo. */
export function PhotoThumb({
  pinId,
  hasPhoto,
  alt,
}: {
  pinId: string;
  hasPhoto: boolean;
  alt: string;
}) {
  const url = usePhotoUrl(pinId, hasPhoto);

  if (!hasPhoto || !url) {
    return (
      <span className="mm-snap mm-snap-empty" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="2.5" y="5" width="19" height="15" rx="2" />
          <circle cx="12" cy="12.5" r="3.6" />
          <path d="M8 5 l1.4 -2.2 h5.2 L16 5" />
        </svg>
      </span>
    );
  }

  return (
    <span className="mm-snap">
      <img src={url} alt={alt} loading="lazy" decoding="async" />
    </span>
  );
}
