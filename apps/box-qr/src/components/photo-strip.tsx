import { useId, useRef } from "react";

import { Button } from "@/components/ui/button";
import type { Photo } from "@/lib/boxes";

/**
 * Photos taped to the label. The picker is a plain <input type="file"
 * accept="image/*" multiple> — on a phone that is the camera *and* the camera
 * roll over ordinary HTTPS, with nothing to install and no cap on how many go
 * on a box.
 */
export function PhotoStrip({
  photos,
  addLabel,
  onAdd,
  onRemove,
}: {
  photos: Photo[];
  addLabel: string;
  onAdd: (files: FileList | null) => void;
  onRemove: (id: string) => void;
}) {
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);

  return (
    <div className="grid gap-2">
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5 pt-1 sm:grid-cols-4">
          {photos.map((photo) => (
            <span key={photo.id} className="bq-photo">
              <img src={photo.dataUrl} alt="" loading="lazy" />
              <button
                type="button"
                className="bq-photo-x"
                aria-label="×"
                onClick={() => onRemove(photo.id)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div>
        <Button type="button" variant="secondary" size="sm" onClick={() => input.current?.click()}>
          {addLabel}
        </Button>
        <input
          ref={input}
          id={inputId}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            onAdd(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
