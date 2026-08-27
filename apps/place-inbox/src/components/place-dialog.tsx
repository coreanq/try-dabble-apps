import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Translate } from "@/lib/i18n";
import { RANKS, TAGS, formatLatLng, type Place, type Rank, type Tag, type Trip } from "@/lib/places";
import { usePhotoUrl } from "@/lib/use-photo-url";

const TAG_LABEL = {
  food: "tagFood",
  hike: "tagHike",
  city: "tagCity",
  beach: "tagBeach",
  stay: "tagStay",
} as const;

export interface PlaceDraft {
  id: string | null;
  name: string;
  url: string;
  why: string;
  rank: Rank;
  tags: Tag[];
  tripId: string;
  mapsUrl: string;
  igUrl: string;
  pinterestUrl: string;
  latlng: string;
  photoBlob: Blob | null;
  photoCleared: boolean;
}

interface Form {
  name: string;
  url: string;
  why: string;
  rank: Rank;
  tags: Tag[];
  tripId: string;
  mapsUrl: string;
  igUrl: string;
  pinterestUrl: string;
  latlng: string;
}

const EMPTY: Form = {
  name: "",
  url: "",
  why: "",
  rank: 3,
  tags: [],
  tripId: "",
  mapsUrl: "",
  igUrl: "",
  pinterestUrl: "",
  latlng: "",
};

function imageFrom(list: FileList | null): Blob | null {
  const file = list?.[0];
  return file && file.type.startsWith("image/") ? file : null;
}

/**
 * Add or edit one place. A place needs a name, a URL or a photo — nothing else
 * is required, so a screenshot pasted straight from Maps is already enough.
 */
export function PlaceDialog({
  open,
  place,
  incomingPhoto,
  incomingUrl,
  trips,
  defaultTripId,
  t,
  onOpenChange,
  onSubmit,
  onDelete,
}: {
  open: boolean;
  place: Place | null;
  incomingPhoto: Blob | null;
  incomingUrl: string;
  trips: Trip[];
  defaultTripId: string;
  t: Translate;
  onOpenChange: (open: boolean) => void;
  onSubmit: (draft: PlaceDraft) => boolean;
  onDelete: (place: Place) => void;
}) {
  const [form, setForm] = useState<Form>(EMPTY);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoCleared, setPhotoCleared] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const keptPhotoId = place && !photoCleared ? place.photoId : null;
  const storedUrl = usePhotoUrl(open ? keptPhotoId : null);
  const [pickedUrl, setPickedUrl] = useState("");

  useEffect(() => {
    if (!photoBlob) {
      setPickedUrl("");
      return;
    }
    const url = URL.createObjectURL(photoBlob);
    setPickedUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photoBlob]);

  // Fresh open: load the record being edited, or start from the paste/camera
  // that triggered the dialog in the first place.
  useEffect(() => {
    if (!open) return;
    setPhotoBlob(incomingPhoto);
    setPhotoCleared(false);
    setForm(
      place
        ? {
            name: place.name,
            url: place.url,
            why: place.why,
            rank: place.rank,
            tags: place.tags,
            tripId: place.tripId,
            mapsUrl: place.mapsUrl,
            igUrl: place.igUrl,
            pinterestUrl: place.pinterestUrl,
            latlng: formatLatLng(place.lat, place.lng),
          }
        : { ...EMPTY, url: incomingUrl, tripId: defaultTripId },
    );
  }, [open, place, incomingPhoto, incomingUrl, defaultTripId]);

  // Ctrl+V drops a screenshot straight onto the open form.
  useEffect(() => {
    if (!open) return;
    function onPaste(e: ClipboardEvent) {
      for (const item of e.clipboardData?.items ?? []) {
        if (!item.type.startsWith("image/")) continue;
        const file = item.getAsFile();
        if (!file) continue;
        e.preventDefault();
        setPhotoBlob(file);
        setPhotoCleared(false);
        return;
      }
    }
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [open]);

  const preview = pickedUrl || storedUrl;
  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  function toggleTag(tag: Tag) {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((x) => x !== tag) : [...prev.tags, tag],
    }));
  }

  function clearPhoto() {
    setPhotoBlob(null);
    setPhotoCleared(true);
    if (fileRef.current) fileRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = onSubmit({
      id: place?.id ?? null,
      ...form,
      name: form.name.trim(),
      url: form.url.trim(),
      why: form.why.trim(),
      mapsUrl: form.mapsUrl.trim(),
      igUrl: form.igUrl.trim(),
      pinterestUrl: form.pinterestUrl.trim(),
      photoBlob,
      photoCleared,
    });
    if (ok) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent id="place-dialog">
        <DialogHeader>
          <DialogTitle id="place-form-title">
            {place ? t("placeEdit") : t("placeAdd")}
          </DialogTitle>
        </DialogHeader>

        <form id="place-form" className="grid gap-3" autoComplete="off" onSubmit={handleSubmit}>
          {/* The screenshot, mounted in its perforated frame. */}
          <div className="flex items-center gap-3 rounded-[4px] border border-dashed border-sand-edge bg-[#fffdf7] p-2.5">
            <div className="pi-stamp size-[86px] shrink-0 [--perf-bg:#fffdf7]">
              <span className="pi-stamp-inner size-full">
                {preview ? (
                  <img id="place-preview" src={preview} alt="" />
                ) : (
                  <ImagePlus className="size-6 text-marine" aria-hidden="true" />
                )}
              </span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <p id="place-drop-hint" className="m-0 text-[0.7rem] leading-4 text-muted-ink">
                {t("dropHint")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                >
                  <ImagePlus />
                  {t("pickFile")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label={t("camera")}
                  title={t("camera")}
                  onClick={() => cameraRef.current?.click()}
                >
                  <Camera />
                </Button>
                {preview && (
                  <Button
                    type="button"
                    id="place-clear-photo"
                    variant="ghost"
                    size="sm"
                    onClick={clearPhoto}
                  >
                    <X />
                    {t("clearPhoto")}
                  </Button>
                )}
              </div>
              <input
                ref={fileRef}
                id="place-file"
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const blob = imageFrom(e.target.files);
                  if (!blob) return;
                  setPhotoBlob(blob);
                  setPhotoCleared(false);
                }}
              />
              <input
                ref={cameraRef}
                id="place-camera"
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={(e) => {
                  const blob = imageFrom(e.target.files);
                  if (!blob) return;
                  setPhotoBlob(blob);
                  setPhotoCleared(false);
                }}
              />
            </div>
          </div>

          <label className="pi-label">
            <span>{t("placeName")}</span>
            <input
              id="place-name"
              className="pi-field"
              type="text"
              maxLength={120}
              placeholder={t("placeNamePh")}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </label>

          <label className="pi-label">
            <span>{t("placeUrl")}</span>
            <input
              id="place-url"
              className="pi-field"
              type="url"
              placeholder="https://"
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
            />
          </label>

          <label className="pi-label">
            <span>{t("why")}</span>
            <textarea
              id="place-why"
              className="pi-field"
              rows={2}
              maxLength={400}
              placeholder={t("whyPh")}
              value={form.why}
              onChange={(e) => set("why", e.target.value)}
            />
          </label>

          <fieldset className="m-0 min-w-0 border-0 p-0">
            <legend className="pi-label mb-1.5 p-0">{t("rank")}</legend>
            <div className="flex flex-wrap gap-1">
              {RANKS.map((rank) => (
                <button
                  key={rank}
                  type="button"
                  className="pi-chip"
                  aria-pressed={form.rank === rank}
                  onClick={() => set("rank", rank)}
                >
                  {t("stars", { n: rank })}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="m-0 min-w-0 border-0 p-0">
            <legend className="pi-label mb-1.5 p-0">{t("tags")}</legend>
            <div className="flex flex-wrap gap-1">
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="pi-chip"
                  aria-pressed={form.tags.includes(tag)}
                  onClick={() => toggleTag(tag)}
                >
                  {t(TAG_LABEL[tag])}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="pi-label">
            <span>{t("trip")}</span>
            <select
              id="place-trip"
              className="pi-field"
              value={form.tripId}
              onChange={(e) => set("tripId", e.target.value)}
            >
              <option value="">{t("inbox")}</option>
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.name}
                </option>
              ))}
            </select>
          </label>

          <p className="pi-heading m-0 pt-1 text-[0.7rem]">{t("extraLinks")}</p>
          <div className="grid gap-2">
            <label className="pi-label">
              <span>{t("mapsUrl")}</span>
              <input
                id="place-maps"
                className="pi-field"
                type="url"
                placeholder="https://"
                value={form.mapsUrl}
                onChange={(e) => set("mapsUrl", e.target.value)}
              />
            </label>
            <label className="pi-label">
              <span>{t("igUrl")}</span>
              <input
                id="place-ig"
                className="pi-field"
                type="url"
                placeholder="https://"
                value={form.igUrl}
                onChange={(e) => set("igUrl", e.target.value)}
              />
            </label>
            <label className="pi-label">
              <span>{t("pinterestUrl")}</span>
              <input
                id="place-pinterest"
                className="pi-field"
                type="url"
                placeholder="https://"
                value={form.pinterestUrl}
                onChange={(e) => set("pinterestUrl", e.target.value)}
              />
            </label>
          </div>

          <label className="pi-label">
            <span>{t("latlng")}</span>
            <input
              id="place-latlng"
              className="pi-field"
              type="text"
              inputMode="decimal"
              placeholder={t("latlngPh")}
              value={form.latlng}
              onChange={(e) => set("latlng", e.target.value)}
            />
          </label>

          <DialogFooter className="pt-1">
            {place && (
              <Button
                type="button"
                id="place-delete"
                variant="destructive"
                size="sm"
                className="mr-auto"
                onClick={() => onDelete(place)}
              >
                {t("delete")}
              </Button>
            )}
            <Button
              type="button"
              id="place-cancel"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" id="place-save" size="sm">
              {place ? t("update") : t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
