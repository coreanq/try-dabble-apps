import { useEffect, useState } from "react";
import { Camera, Palette, Undo2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Translate } from "@/lib/i18n";
import { NAME_MAX, type Pet } from "@/lib/pet";

/** Name field plus the two free ways to a look: parts, or a local photo. */
export function LookCard({
  t,
  pet,
  onRename,
  onCustomize,
  onUsePhoto,
  onUseParts,
}: {
  t: Translate;
  pet: Pet;
  onRename: (name: string) => void;
  onCustomize: () => void;
  onUsePhoto: () => void;
  onUseParts: () => void;
}) {
  const [draft, setDraft] = useState(pet.name);
  useEffect(() => setDraft(pet.name), [pet.name]);

  function commit() {
    const next = draft.replace(/\s+/g, " ").trim();
    if (next && next !== pet.name) onRename(next);
    else setDraft(pet.name);
  }

  return (
    <Card id="look-card" size="sm">
      <CardHeader>
        <CardTitle>
          {t("nameTitle")} · {t("lookTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        <form
          className="pp-name-row"
          onSubmit={(e) => {
            e.preventDefault();
            commit();
          }}
        >
          <label className="pp-field-label" htmlFor="name-input">
            {t("nameLabel")}
          </label>
          <div className="pp-name-fields">
            <Input id="name-input" value={draft} maxLength={NAME_MAX} placeholder={t("namePlaceholder")} onChange={(e) => setDraft(e.target.value)} onBlur={commit} />
            <button type="submit" className="pp-btn pp-btn-primary pp-btn-fit" id="name-save">
              {t("done")}
            </button>
          </div>
        </form>
        <p className="pp-hint">{t("lookHint")}</p>
        <div className="pp-actions">
          <button type="button" className="pp-btn pp-btn-quiet" id="open-customize" onClick={onCustomize}>
            <Palette className="size-4" aria-hidden />
            {t("customize")}
          </button>
          <button type="button" className="pp-btn pp-btn-teal" id="open-photo" onClick={onUsePhoto}>
            <Camera className="size-4" aria-hidden />
            {t("usePhoto")}
          </button>
          {pet.photoSprite && (
            <button type="button" className="pp-btn pp-btn-quiet col-span-2" id="use-parts" onClick={onUseParts}>
              <Undo2 className="size-4" aria-hidden />
              {t("useParts")}
            </button>
          )}
        </div>
        {pet.photoSprite && (
          <p className="pp-hint" id="photo-active-note">
            {t("photoActive")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
