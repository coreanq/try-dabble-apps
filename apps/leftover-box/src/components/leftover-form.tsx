import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addDaysISO, todayISO } from "@/lib/dates";
import type { Translate } from "@/lib/i18n";
import {
  DEFAULT_SHELF_DAYS,
  MAX_NAME,
  MAX_NOTE,
  type Leftover,
  type StoredLocation,
} from "@/lib/leftovers";

export interface LeftoverDraft {
  name: string;
  cookedOn: string;
  eatBy: string;
  location: StoredLocation;
  note: string;
}

export function LeftoverForm({
  t,
  editing,
  onSave,
  onCancel,
}: {
  t: Translate;
  editing: Leftover | null;
  onSave: (draft: LeftoverDraft) => void;
  onCancel: () => void;
}) {
  const firstCooked = editing?.cookedOn || todayISO();
  const [name, setName] = useState(editing?.name ?? "");
  const [cookedOn, setCookedOn] = useState(firstCooked);
  const [eatBy, setEatBy] = useState(
    editing?.eatBy || addDaysISO(firstCooked, DEFAULT_SHELF_DAYS),
  );
  const [location, setLocation] = useState<StoredLocation>(editing?.location ?? "");
  const [note, setNote] = useState(editing?.note ?? "");
  // Once the cook picks their own eat-by we stop moving it for them.
  const [eatByTouched, setEatByTouched] = useState(Boolean(editing));

  function handleCookedOn(next: string) {
    setCookedOn(next);
    if (!eatByTouched) setEatBy(addDaysISO(next || todayISO(), DEFAULT_SHELF_DAYS));
  }

  return (
    <Card id="add-card">
      <CardHeader>
        <CardTitle id="add-title">{editing ? t("edit") : t("addTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          id="add-form"
          className="grid gap-[0.55rem]"
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            onSave({
              name: name.trim(),
              cookedOn: cookedOn || todayISO(),
              eatBy: eatBy || addDaysISO(cookedOn || todayISO(), DEFAULT_SHELF_DAYS),
              location,
              note: note.trim(),
            });
          }}
        >
          <label className="lb-label">
            <span>{t("labelName")}</span>
            <input
              id="dish-name"
              className="lb-field"
              type="text"
              maxLength={MAX_NAME}
              required
              placeholder={t("namePh")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <div className="grid gap-[0.55rem]">
            <label className="lb-label">
              <span>{t("labelCooked")}</span>
              <input
                id="cooked-on"
                className="lb-field"
                type="date"
                required
                value={cookedOn}
                onChange={(e) => handleCookedOn(e.target.value)}
              />
            </label>
            <label className="lb-label">
              <span>{t("labelEatBy")}</span>
              <input
                id="eat-by"
                className="lb-field"
                type="date"
                required
                value={eatBy}
                onChange={(e) => {
                  setEatByTouched(true);
                  setEatBy(e.target.value);
                }}
              />
            </label>
          </div>

          <label className="lb-label">
            <span>{t("labelLocation")}</span>
            <select
              id="location"
              className="lb-field"
              value={location}
              onChange={(e) => setLocation(e.target.value as StoredLocation)}
            >
              <option value="">{t("locNone")}</option>
              <option value="fridge">{t("locFridge")}</option>
              <option value="freezer">{t("locFreezer")}</option>
              <option value="other">{t("locOther")}</option>
            </select>
          </label>

          <label className="lb-label">
            <span>{t("labelNote")}</span>
            <input
              id="note"
              className="lb-field"
              type="text"
              maxLength={MAX_NOTE}
              placeholder={t("notePh")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>

          <div className="flex items-stretch gap-2">
            <Button type="submit" id="add-save" className="flex-1">
              {editing ? t("update") : t("save")}
            </Button>
            {editing ? (
              <Button type="button" id="add-cancel" variant="ghost" onClick={onCancel}>
                {t("cancel")}
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
