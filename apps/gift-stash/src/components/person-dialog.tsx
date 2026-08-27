import { useEffect, useRef, useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Translate } from "@/lib/i18n";
import { uid, type Occasion, type Person } from "@/lib/stash";
import { useBlobUrl, usePhotoUrl } from "@/lib/use-photo-url";

export interface PersonDraft {
  id: string | null;
  name: string;
  birthday: string;
  notes: string;
  occasions: Occasion[];
  faceBlob: Blob | null;
}

interface Form {
  name: string;
  birthday: string;
  notes: string;
  occasions: Occasion[];
}

const EMPTY: Form = { name: "", birthday: "", notes: "", occasions: [] };

function imageFrom(list: FileList | null): Blob | null {
  const file = list?.[0];
  return file && file.type.startsWith("image/") ? file : null;
}

/**
 * Add or edit one person: a name, the birthday as MM-DD or a full date, notes
 * for sizes and likes, any number of other occasions, and an optional face.
 */
export function PersonDialog({
  open,
  person,
  t,
  onOpenChange,
  onSubmit,
  onDelete,
}: {
  open: boolean;
  person: Person | null;
  t: Translate;
  onOpenChange: (open: boolean) => void;
  onSubmit: (draft: PersonDraft) => boolean;
  onDelete: (person: Person) => void;
}) {
  const [form, setForm] = useState<Form>(EMPTY);
  const [faceBlob, setFaceBlob] = useState<Blob | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const storedUrl = usePhotoUrl(open ? (person?.photoId ?? null) : null);
  const pickedUrl = useBlobUrl(faceBlob);
  const faceUrl = pickedUrl || storedUrl;

  // Fresh open: load the person being edited, or start blank.
  useEffect(() => {
    if (!open) return;
    setFaceBlob(null);
    setForm(
      person
        ? {
            name: person.name,
            birthday: person.birthday,
            notes: person.notes,
            occasions: (person.occasions ?? []).map((o) => ({ ...o })),
          }
        : { ...EMPTY },
    );
  }, [open, person]);

  // Ctrl+V drops a face straight onto the open form.
  useEffect(() => {
    if (!open) return;
    function onPaste(e: ClipboardEvent) {
      for (const item of e.clipboardData?.items ?? []) {
        if (!item.type.startsWith("image/")) continue;
        const file = item.getAsFile();
        if (!file) continue;
        e.preventDefault();
        setFaceBlob(file);
        return;
      }
    }
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [open]);

  function patch(changes: Partial<Form>) {
    setForm((prev) => ({ ...prev, ...changes }));
  }

  function patchOccasion(id: string, changes: Partial<Occasion>) {
    patch({
      occasions: form.occasions.map((o) => (o.id === id ? { ...o, ...changes } : o)),
    });
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const ok = onSubmit({
      id: person?.id ?? null,
      name: form.name.trim(),
      birthday: form.birthday.trim(),
      notes: form.notes.trim(),
      occasions: form.occasions
        .map((o) => ({ id: o.id, label: o.label.trim(), date: o.date.trim() }))
        .filter((o) => o.date),
      faceBlob,
    });
    if (ok) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent id="person-dialog">
        <DialogHeader>
          <DialogTitle id="person-form-title">
            {person ? t("personEdit") : t("personAdd")}
          </DialogTitle>
        </DialogHeader>

        <form id="person-form" className="grid gap-3" autoComplete="off" onSubmit={submit}>
          <div className="flex items-end gap-3">
            <button
              type="button"
              id="person-face-btn"
              className="gs-face size-16 text-2xl"
              aria-label={t("facePhoto")}
              onClick={() => fileRef.current?.click()}
            >
              {faceUrl ? <img src={faceUrl} alt="" /> : <Plus className="size-6" aria-hidden />}
            </button>
            <input
              id="person-face-file"
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const picked = imageFrom(e.target.files);
                if (picked) setFaceBlob(picked);
                e.target.value = "";
              }}
            />
            <label className="gs-label grow">
              <span id="label-person-name">{t("name")}</span>
              <input
                id="person-name"
                className="gs-field"
                type="text"
                maxLength={80}
                required
                placeholder={t("namePh")}
                value={form.name}
                onChange={(e) => patch({ name: e.target.value })}
              />
            </label>
          </div>

          <label className="gs-label">
            <span id="label-birthday">{t("birthday")}</span>
            <input
              id="person-birthday"
              className="gs-field"
              type="text"
              inputMode="numeric"
              placeholder={t("birthdayPh")}
              value={form.birthday}
              onChange={(e) => patch({ birthday: e.target.value })}
            />
          </label>

          <label className="gs-label">
            <span id="label-person-notes">{t("notes")}</span>
            <textarea
              id="person-notes"
              className="gs-field"
              rows={2}
              maxLength={400}
              placeholder={t("notesPh")}
              value={form.notes}
              onChange={(e) => patch({ notes: e.target.value })}
            />
          </label>

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <span id="label-occasions" className="gs-label">
                {t("occasions")}
              </span>
              <Button
                type="button"
                id="add-occasion-btn"
                variant="outline"
                size="icon-sm"
                aria-label={t("occasions")}
                onClick={() =>
                  patch({
                    occasions: [
                      ...form.occasions,
                      { id: uid(), label: t("anniversary"), date: "" },
                    ],
                  })
                }
              >
                <Plus />
              </Button>
            </div>
            {form.occasions.map((occasion) => (
              <div key={occasion.id} className="flex items-center gap-2">
                <input
                  className="gs-field text-[0.85rem]"
                  type="text"
                  aria-label={t("occLabel")}
                  placeholder={t("occLabel")}
                  value={occasion.label}
                  onChange={(e) => patchOccasion(occasion.id, { label: e.target.value })}
                />
                <input
                  className="gs-field max-w-[8rem] text-[0.85rem]"
                  type="text"
                  inputMode="numeric"
                  aria-label={t("occDate")}
                  placeholder="MM-DD"
                  value={occasion.date}
                  onChange={(e) => patchOccasion(occasion.id, { date: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("removeOccasion")}
                  onClick={() =>
                    patch({ occasions: form.occasions.filter((o) => o.id !== occasion.id) })
                  }
                >
                  <X />
                </Button>
              </div>
            ))}
          </div>

          <DialogFooter>
            {person ? (
              <Button
                type="button"
                id="person-delete"
                variant="destructive"
                size="sm"
                onClick={() => onDelete(person)}
              >
                {t("delete")}
              </Button>
            ) : null}
            <span className="grow" />
            <Button
              type="button"
              id="person-cancel"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" id="person-save" size="sm">
              {person ? t("update") : t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
