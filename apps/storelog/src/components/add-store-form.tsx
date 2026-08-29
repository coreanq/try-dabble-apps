import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Translate } from "@/lib/i18n";
import { MAX_NAME, MAX_NOTES, MAX_NUMBER } from "@/lib/stores";

/**
 * The whole way a store gets in: three boxes on a phone, no spreadsheet, no
 * columns to drag. Only the name is required; the number and the notes can
 * stay empty and be filled in later from the list itself.
 */
export function AddStoreForm({
  t,
  onAdd,
}: {
  t: Translate;
  onAdd: (name: string, number: string, notes: string) => void;
}) {
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState(false);
  // Focus returns to the name box after a submit, but nothing is focused on
  // load — an autofocused field would shove the phone keyboard up on arrival.
  const nameRef = useRef<HTMLInputElement>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError(true);
      nameRef.current?.focus();
      return;
    }
    onAdd(cleanName, number.trim(), notes.trim());
    setName("");
    setNumber("");
    setNotes("");
    setError(false);
    nameRef.current?.focus();
  }

  return (
    <Card id="add-card">
      <CardHeader>
        <CardTitle id="add-title">{t("addTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mt-0 mb-[0.5rem] text-[0.74rem] text-muted-ink" id="add-hint">
          {t("addHint")}
        </p>
        <form className="flex flex-col gap-[0.5rem]" onSubmit={submit} noValidate>
          <div>
            <label className="sl-label-text" htmlFor="add-store-name">
              {t("nameLabel")}
            </label>
            <input
              id="add-store-name"
              ref={nameRef}
              className="sl-field mt-[0.25rem]"
              type="text"
              autoComplete="off"
              maxLength={MAX_NAME}
              value={name}
              placeholder={t("namePlaceholder")}
              aria-invalid={error || undefined}
              aria-describedby={error ? "add-name-error" : undefined}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(false);
              }}
            />
            {error ? (
              <p
                className="mt-[0.3rem] mb-0 text-[0.72rem] font-bold text-destructive"
                id="add-name-error"
                role="alert"
              >
                {t("nameRequired")}
              </p>
            ) : null}
          </div>

          <div>
            <label className="sl-label-text" htmlFor="add-store-number">
              {t("numberLabel")}
              <span className="sl-optional">{t("optional")}</span>
            </label>
            <input
              id="add-store-number"
              className="sl-field mt-[0.25rem]"
              type="text"
              inputMode="tel"
              autoComplete="off"
              maxLength={MAX_NUMBER}
              value={number}
              placeholder={t("numberPlaceholder")}
              onChange={(e) => setNumber(e.target.value)}
            />
          </div>

          <div>
            <label className="sl-label-text" htmlFor="add-store-notes">
              {t("notesLabel")}
              <span className="sl-optional">{t("optional")}</span>
            </label>
            <textarea
              id="add-store-notes"
              className="sl-field mt-[0.25rem]"
              rows={3}
              maxLength={MAX_NOTES}
              value={notes}
              placeholder={t("notesPlaceholder")}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button id="add-submit" type="submit" size="lg" className="w-full">
            {t("addButton")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
