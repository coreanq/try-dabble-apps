import { useEffect, useState } from "react";

import { loadPhoto } from "@/lib/stash";

/**
 * Object URL for a photo held in IndexedDB. Replacing a photo mints a fresh
 * photoId, so the id alone is a safe cache key here.
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

/** Object URL for a Blob the user just picked, before it reaches IndexedDB. */
export function useBlobUrl(blob: Blob | null): string {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!blob) {
      setUrl("");
      return;
    }
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => {
      setUrl("");
      URL.revokeObjectURL(objectUrl);
    };
  }, [blob]);

  return url;
}
