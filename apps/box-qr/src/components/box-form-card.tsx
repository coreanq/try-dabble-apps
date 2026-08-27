import type { RefObject } from "react";

import { PhotoStrip } from "@/components/photo-strip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Photo } from "@/lib/boxes";
import type { Translate } from "@/lib/i18n";

export interface Draft {
  id: string;
  room: string;
  items: string;
  photos: Photo[];
}

export function emptyDraft(): Draft {
  return { id: "", room: "", items: "", photos: [] };
}

export function BoxFormCard({
  t,
  draft,
  onChange,
  onSubmit,
  onCancel,
  onAddPhotos,
  onRemovePhoto,
  roomRef,
}: {
  t: Translate;
  draft: Draft;
  onChange: (patch: Partial<Draft>) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onAddPhotos: (files: FileList | null) => void;
  onRemovePhoto: (id: string) => void;
  roomRef: RefObject<HTMLInputElement | null>;
}) {
  const editing = draft.id !== "";

  return (
    <Card>
      <CardHeader>
        <CardTitle id="add-title">{editing ? t("editTitle") : t("addTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          id="add-form"
          className="grid gap-3"
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <label className="bq-label-text">
            <span id="label-room">{t("labelRoom")}</span>
            <input
              ref={roomRef}
              id="room"
              className="bq-field"
              type="text"
              maxLength={80}
              placeholder={t("roomPh")}
              value={draft.room}
              onChange={(e) => onChange({ room: e.target.value })}
            />
          </label>

          <label className="bq-label-text">
            <span id="label-items">{t("labelItems")}</span>
            <textarea
              id="items"
              className="bq-field"
              rows={4}
              maxLength={4000}
              placeholder={t("itemsPh")}
              value={draft.items}
              onChange={(e) => onChange({ items: e.target.value })}
            />
          </label>

          <div className="grid gap-1">
            <span className="bq-label-text" id="label-photos">
              {t("labelPhotos")}
            </span>
            <PhotoStrip
              photos={draft.photos}
              addLabel={draft.photos.length ? t("addMorePhotos") : t("addPhotos")}
              onAdd={onAddPhotos}
              onRemove={onRemovePhoto}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" id="add-save">
              {editing ? t("update") : t("save")}
            </Button>
            {editing && (
              <Button type="button" variant="ghost" id="add-cancel" onClick={onCancel}>
                {t("cancel")}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
