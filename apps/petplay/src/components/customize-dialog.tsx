import { Dices } from "lucide-react";

import { PetSprite } from "@/components/pet-sprite";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { MsgKey, Translate } from "@/lib/i18n";
import type { Mood } from "@/lib/needs";
import {
  ACCESSORIES,
  BODIES,
  EARS,
  EYES,
  PALETTE,
  SPECIES,
  TAILS,
  randomLook,
  withColor,
  withPart,
  withSpecies,
  type Colors,
  type Parts,
  type Pet,
  type Species,
} from "@/lib/pet";

const SPECIES_LABEL: Record<Species, MsgKey> = { dog: "speciesDog", cat: "speciesCat", bunny: "speciesBunny", bird: "speciesBird", fox: "speciesFox" };
const PART_LABEL: Record<keyof Parts, MsgKey> = { ears: "partEars", eyes: "partEyes", body: "partBody", tail: "partTail", accessory: "partAccessory" };
const OPTION_LABEL: Record<string, MsgKey> = {
  "ears.round": "earsRound",
  "ears.pointy": "earsPointy",
  "ears.floppy": "earsFloppy",
  "ears.long": "earsLong",
  "ears.tuft": "earsTuft",
  "eyes.dot": "eyesDot",
  "eyes.round": "eyesRound",
  "eyes.happy": "eyesHappy",
  "eyes.sleepy": "eyesSleepy",
  "eyes.star": "eyesStar",
  "body.round": "bodyRound",
  "body.tall": "bodyTall",
  "body.chunky": "bodyChunky",
  "tail.curl": "tailCurl",
  "tail.straight": "tailStraight",
  "tail.fluffy": "tailFluffy",
  "tail.short": "tailShort",
  "accessory.none": "accNone",
  "accessory.bow": "accBow",
  "accessory.collar": "accCollar",
  "accessory.scarf": "accScarf",
  "accessory.hat": "accHat",
};
const COLOR_LABEL: Record<keyof Colors, MsgKey> = { primary: "colorPrimary", secondary: "colorSecondary", accent: "colorAccent" };
const PART_OPTIONS: { [K in keyof Parts]: readonly Parts[K][] } = { ears: EARS, eyes: EYES, body: BODIES, tail: TAILS, accessory: ACCESSORIES };

/**
 * Species, five part pickers and three colour rows. Every option is a plain
 * button: nothing is locked, priced or tokenised. Changes apply live so the
 * preview at the top is the pet itself.
 */
export function CustomizeDialog({
  open,
  pet,
  mood,
  t,
  onOpenChange,
  onChange,
}: {
  open: boolean;
  pet: Pet;
  mood: Mood;
  t: Translate;
  onOpenChange: (open: boolean) => void;
  onChange: (next: Pet) => void;
}) {
  const preview: Pet = pet.photoSprite ? { ...pet, photoSprite: undefined } : pet;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent id="customize-dialog" className="pp-sheet" showCloseButton={false}>
        <DialogTitle className="pp-sheet-title">{t("customizeTitle")}</DialogTitle>
        <DialogDescription className="pp-hint">{t("freeNote")}</DialogDescription>
        <div className="pp-preview">
          <PetSprite pet={preview} mood={mood} className="pp-preview-sprite" id="customize-preview" />
        </div>

        <div className="pp-field">
          <span className="pp-field-label">{t("speciesLabel")}</span>
          <div className="pp-chip-row" id="species-picker">
            {SPECIES.map((s) => (
              <button key={s} type="button" className="pp-chip" data-species={s} aria-pressed={pet.species === s} onClick={() => onChange(withSpecies(pet, s))}>
                {t(SPECIES_LABEL[s])}
              </button>
            ))}
          </div>
        </div>

        {(Object.keys(PART_OPTIONS) as (keyof Parts)[]).map((part) => (
          <div className="pp-field" key={part}>
            <span className="pp-field-label">{t(PART_LABEL[part])}</span>
            <div className="pp-chip-row" id={`part-${part}`}>
              {PART_OPTIONS[part].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className="pp-chip"
                  data-part={part}
                  data-value={opt}
                  aria-pressed={pet.parts[part] === opt}
                  onClick={() => onChange(withPart(pet, part, opt as never))}
                >
                  {t(OPTION_LABEL[`${part}.${opt}`])}
                </button>
              ))}
            </div>
          </div>
        ))}

        {(Object.keys(COLOR_LABEL) as (keyof Colors)[]).map((key) => (
          <div className="pp-field" key={key}>
            <span className="pp-field-label">{t(COLOR_LABEL[key])}</span>
            <div className="pp-swatches" id={`color-${key}`}>
              {PALETTE[key].map((hex) => (
                <button
                  key={hex}
                  type="button"
                  className="pp-swatch"
                  style={{ background: hex }}
                  data-color={hex}
                  aria-label={hex}
                  aria-pressed={pet.colors[key] === hex}
                  onClick={() => onChange(withColor(pet, key, hex))}
                />
              ))}
              <label className="pp-swatch pp-swatch-custom" title={t("colorCustom")}>
                <span className="sr-only">{t("colorCustom")}</span>
                <input type="color" value={pet.colors[key]} aria-label={t("colorCustom")} onChange={(e) => onChange(withColor(pet, key, e.target.value))} />
              </label>
            </div>
          </div>
        ))}

        <div className="pp-actions">
          <button type="button" className="pp-btn pp-btn-quiet" id="randomize" onClick={() => onChange(randomLook(pet))}>
            <Dices className="size-4" aria-hidden />
            {t("randomize")}
          </button>
          <button type="button" className="pp-btn pp-btn-primary" id="customize-done" onClick={() => onOpenChange(false)}>
            {t("done")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
