import { useEffect, useState } from "react";
import { PencilIcon, PhoneIcon, Trash2Icon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Translate } from "@/lib/i18n";
import {
  MAX_NAME,
  MAX_NOTES,
  MAX_NUMBER,
  isCallable,
  telHref,
  type Store,
} from "@/lib/stores";

export interface StorePatch {
  name: string;
  number: string;
  notes: string;
}

/**
 * One shelf-edge label. Closed it shows the name, the store number in its
 * price-tag box and the notes; opened it becomes the same three fields as the
 * add form, so editing never sends anyone to a different screen.
 */
export function StoreLabel({
  store,
  t,
  open,
  onToggle,
  onPatch,
  onDelete,
}: {
  store: Store;
  t: Translate;
  open: boolean;
  onToggle: (id: string) => void;
  onPatch: (id: string, patch: StorePatch) => void;
  onDelete: (store: Store) => void;
}) {
  const [name, setName] = useState(store.name);
  const [number, setNumber] = useState(store.number);
  const [notes, setNotes] = useState(store.notes);

  // Reopening a label, or an edit landing from elsewhere, refills the boxes.
  useEffect(() => {
    if (!open) return;
    setName(store.name);
    setNumber(store.number);
    setNotes(store.notes);
  }, [open, store.name, store.number, store.notes]);

  function save() {
    const clean = name.trim();
    // An empty name would leave a blank label on the shelf, so it is refused
    // by simply keeping the one already saved.
    onPatch(store.id, {
      name: clean || store.name,
      number: number.trim(),
      notes: notes.trim(),
    });
  }

  const callable = isCallable(store.number);

  return (
    <article className="sl-label" data-open={open} data-store-id={store.id}>
      <div className="sl-label-main">
        <h3 className="sl-name">{store.name}</h3>

        <div className="flex flex-wrap items-center gap-[0.4rem]">
          <span className="sl-price" data-empty={store.number ? undefined : "true"}>
            <span className="sl-price-tag">{t("numberTag")}</span>
            <span className="sl-price-num">{store.number || t("noNumber")}</span>
          </span>
          {callable ? (
            <Button asChild variant="secondary" size="xs">
              <a href={telHref(store.number)} aria-label={t("callStore")}>
                <PhoneIcon aria-hidden="true" />
                {t("callStore")}
              </a>
            </Button>
          ) : null}
        </div>

        {store.notes && !open ? <p className="sl-notes">{store.notes}</p> : null}

        {open ? (
          <div className="mt-[0.6rem] flex flex-col gap-[0.45rem] border-t border-rule pt-[0.55rem]">
            <div>
              <label className="sl-label-text" htmlFor={`edit-name-${store.id}`}>
                {t("nameLabel")}
              </label>
              <input
                id={`edit-name-${store.id}`}
                className="sl-field mt-[0.2rem]"
                type="text"
                autoComplete="off"
                maxLength={MAX_NAME}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="sl-label-text" htmlFor={`edit-number-${store.id}`}>
                {t("numberLabel")}
                <span className="sl-optional">{t("optional")}</span>
              </label>
              <input
                id={`edit-number-${store.id}`}
                className="sl-field mt-[0.2rem]"
                type="text"
                inputMode="tel"
                autoComplete="off"
                maxLength={MAX_NUMBER}
                value={number}
                onChange={(e) => setNumber(e.target.value)}
              />
            </div>
            <div>
              <label className="sl-label-text" htmlFor={`edit-notes-${store.id}`}>
                {t("notesLabel")}
                <span className="sl-optional">{t("optional")}</span>
              </label>
              <textarea
                id={`edit-notes-${store.id}`}
                className="sl-field mt-[0.2rem]"
                rows={3}
                maxLength={MAX_NOTES}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-[0.4rem]">
              <Button size="sm" onClick={save} data-role="save">
                {t("save")}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(store)}
                data-role="delete"
              >
                <Trash2Icon aria-hidden="true" />
                {t("deleteStore")}
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <Button
        variant="ghost"
        size="icon-sm"
        className="self-start"
        aria-expanded={open}
        aria-label={open ? t("closeEdit") : t("openEdit")}
        title={open ? t("closeEdit") : t("openEdit")}
        onClick={() => onToggle(store.id)}
        data-role="toggle"
      >
        {open ? <XIcon aria-hidden="true" /> : <PencilIcon aria-hidden="true" />}
      </Button>
    </article>
  );
}
