import { PetSprite } from "@/components/pet-sprite";
import type { MsgKey, Translate } from "@/lib/i18n";
import type { Mood } from "@/lib/needs";
import type { Pet } from "@/lib/pet";

const MOOD_LABEL: Record<Mood, MsgKey> = {
  happy: "moodHappy",
  okay: "moodOkay",
  sad: "moodSad",
  hungry: "moodHungry",
  sleepy: "moodSleepy",
  dirty: "moodDirty",
  bored: "moodBored",
};
const MOOD_SAY: Record<Mood, MsgKey> = {
  happy: "sayHappy",
  okay: "sayOkay",
  sad: "saySad",
  hungry: "sayHungry",
  sleepy: "saySleepy",
  dirty: "sayDirty",
  bored: "sayBored",
};

/** The pet on its little peach lawn: sprite, speech bubble, name, mood chip. */
export function PetStage({ pet, mood, t, bounce }: { pet: Pet; mood: Mood; t: Translate; bounce: number }) {
  return (
    <section className="pp-stage" id="pet-stage" data-mood={mood} aria-label={pet.name}>
      <p className="pp-bubble" id="pet-say">
        {t(MOOD_SAY[mood])}
      </p>
      <div className="pp-stage-lawn">
        <PetSprite key={bounce} pet={pet} mood={mood} className="pp-sprite" id="pet-sprite" />
      </div>
      <div className="pp-stage-row">
        <h2 className="pp-pet-name" id="pet-name">
          {pet.name}
        </h2>
        <span className="pp-mood" id="pet-mood" data-mood={mood}>
          {t(MOOD_LABEL[mood])}
        </span>
      </div>
      <p className="pp-hint pp-stage-hint">{t("stageHint")}</p>
    </section>
  );
}
