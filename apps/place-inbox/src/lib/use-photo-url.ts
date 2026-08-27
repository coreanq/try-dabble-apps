import { useEffect, useState } from "react";

import { loadPhoto } from "@/lib/places";

/**
 * Object URL for a photo held in IndexedDB. Replacing a place's photo mints a
 * fresh photoId, so the id alone is a safe cache key here.
 */
export function usePhotoUrl(photoId: string | null): string {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!photoId) {
      setUrl("");
      return;
    }
    let cancelled = false;
    let objectUrl = "";
    loadPhoto(photoId).then((blob) => {
      if (cancelled || !blob) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });
    return () => {
      cancelled = true;
      setUrl("");
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photoId]);

  return url;
}
