import { useEffect, useRef, useState, type FormEvent } from "react";
import { Camera, ImagePlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MsgKey, Translate } from "@/lib/i18n";
import { STATUSES, type Idea, type Person, type Status } from "@/lib/stash";
import { useBlobUrl, usePhotoUrl } from "@/lib/use-photo-url";

const STATUS_LABEL: Record<Status, MsgKey> = {
  idea: "statusIdea",
  bought: "statusBought",
  given: "statusGiven",
};

export interface IdeaDraft {
  id: string | null;
  personId: string;
  title: string;
  url: string;
  price: string;
  note: string;
  status: Status;
  photoBlob: Blob | null;
  photoCleared: boolean;
}

interface Form {
  personId: string;
  title: string;
  url: string;
  price: string;
  note: string;
  status: Status;
}

const EMPTY: Form = { personId: "", title: "", url: "", price: "", note: "", status: "idea" };

function imageFrom(list: FileList | null): Blob | null {
  const file = list?.[0];
  return file && file.type.startsWith("image/") ? file : null;
}

/**
 * Add or edit one gift idea. A screenshot alone is enough — the title, price,
 * link and person can all come later.
 */
export function IdeaDialog({
  open,
  idea,
  incomingPhoto,
  people,
  defaultPersonId,
  t,
  onOpenChange,
  onSubmit,
  onDelete,
}: {
  open: boolean;
  idea: Idea | null;
  incomingPhoto: Blob | null;
  people: Person[];
  defaultPersonId: string;
  t: Translate;
  onOpenChange: (open: boolean) => void;
  onSubmit: (draft: IdeaDraft) => boolean;
  onDelete: (idea: Idea) => void;
}) {
  const [form, setForm] = useState<Form>(EMPTY);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoCleared, setPhotoCleared] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const keptPhotoId = idea && !photoCleared ? idea.photoId : null;
  const storedUrl = usePhotoUrl(open ? keptPhotoId : null);
  const pickedUrl = useBlobUrl(photoBlob);
  const photoUrl = pickedUrl || storedUrl;

  // Fresh open: load the idea being edited, or start from the paste/camera
  // that triggered the dialog in the first place.
  useEffect(() => {
    if (!open) return;
    setPhotoBlob(incomingPhoto);
    setPhotoCleared(false);
    setForm(
      idea
        ? {
            personId: idea.personId,
            title: idea.title,
            url: idea.url,
            price: idea.price,
            note: idea.note,
            status: idea.status,
          }
        : { ...EMPTY, personId: defaultPersonId },
    );
  }, [open, idea, incomingPhoto, defaultPersonId]);

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

  function patch(changes: Partial<Form>) {
    setForm((prev) => ({ ...prev, ...changes }));
  }

  function pick(list: FileList | null, input: HTMLInputElement) {
    const picked = imageFrom(list);
    if (picked) {
      setPhotoBlob(picked);
      setPhotoCleared(false);
    }
    input.value = "";
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const ok = onSubmit({
      id: idea?.id ?? null,
      personId: form.personId,
      title: form.title.trim(),
      url: form.url.trim(),
      price: form.price.trim(),
      note: form.note.trim(),
      status: form.status,
      photoBlob,
      photoCleared,
    });
    if (ok) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent id="idea-dialog">
        <DialogHeader>
          <DialogTitle id="idea-form-title">{idea ? t("ideaEdit") : t("ideaAdd")}</DialogTitle>
        </DialogHeader>

        <form id="idea-form" className="grid gap-3" autoComplete="off" onSubmit={submit}>
          <div
            id="idea-drop"
            className="grid gap-2 rounded-[5px] border border-dashed border-tag-edge bg-[rgba(255,250,241,0.7)] p-2.5"
          >
            {photoUrl ? (
              <img
                id="idea-preview"
                src={photoUrl}
                alt=""
                className="max-h-52 w-full rounded-[3px] border border-tag-edge object-contain"
              />
            ) : (
              <p id="idea-drop-hint" className="m-0 text-center text-[0.74rem] text-muted-ink">
                {t("dropHint")}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
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
                aria-label={t("pickFile")}
                onClick={() => cameraRef.current?.click()}
              >
                <Camera />
              </Button>
              {photoUrl ? (
                <Button
                  type="button"
                  id="idea-clear-photo"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPhotoBlob(null);
                    setPhotoCleared(true);
                  }}
                >
                  <X />
                  {t("clearPhoto")}
                </Button>
              ) : null}
            </div>
            <input
              id="idea-file"
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => pick(e.target.files, e.target)}
            />
            <input
              id="idea-camera"
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) => pick(e.target.files, e.target)}
            />
          </div>

          <label className="gs-label">
            <span id="label-idea-title">{t("ideaTitle")}</span>
            <input
              id="idea-title"
              className="gs-field"
              type="text"
              maxLength={120}
              placeholder={t("ideaTitlePh")}
              value={form.title}
              onChange={(e) => patch({ title: e.target.value })}
            />
          </label>

          <label className="gs-label">
            <span id="label-idea-url">{t("ideaUrl")}</span>
            <input
              id="idea-url"
              className="gs-field"
              type="url"
              placeholder="https://"
              value={form.url}
              onChange={(e) => patch({ url: e.target.value })}
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="gs-label">
              <span id="label-idea-price">{t("ideaPrice")}</span>
              <input
                id="idea-price"
                className="gs-field"
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={form.price}
                onChange={(e) => patch({ price: e.target.value })}
              />
            </label>
            <label className="gs-label">
              <span id="label-idea-person">{t("ideaPerson")}</span>
              <select
                id="idea-person"
                className="gs-field"
                value={form.personId}
                onChange={(e) => patch({ personId: e.target.value })}
              >
                <option value="">{t("unassigned")}</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="gs-label">
            <span id="label-idea-status">{t("ideaStatus")}</span>
            <select
              id="idea-status"
              className="gs-field"
              value={form.status}
              onChange={(e) => patch({ status: e.target.value as Status })}
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(STATUS_LABEL[status])}
                </option>
              ))}
            </select>
          </label>

          <label className="gs-label">
            <span id="label-idea-note">{t("ideaNote")}</span>
            <textarea
              id="idea-note"
              className="gs-field"
              rows={2}
              maxLength={400}
              value={form.note}
              onChange={(e) => patch({ note: e.target.value })}
            />
          </label>

          <DialogFooter>
            {idea ? (
              <Button
                type="button"
                id="idea-delete"
                variant="destructive"
                size="sm"
                onClick={() => onDelete(idea)}
              >
                {t("delete")}
              </Button>
            ) : null}
            <span className="grow" />
            <Button
              type="button"
              id="idea-cancel"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" id="idea-save" size="sm">
              {idea ? t("update") : t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
