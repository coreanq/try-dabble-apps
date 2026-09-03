import { DATE_LOCALE, type Lang, type Translate } from "@/lib/i18n";
import { phaseOf, type Roll } from "@/lib/rolls";

export function formatDate(ms: number, lang: Lang): string {
  try {
    return new Date(ms).toLocaleString(DATE_LOCALE[lang], { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return new Date(ms).toISOString();
  }
}

/**
 * Every roll that is not on the desk right now. Locked rolls show a count
 * and a state only — never a thumbnail, never an image, before unlock.
 */
export function RollShelf({
  rolls,
  now,
  lang,
  t,
  onOpen,
}: {
  rolls: Roll[];
  now: number;
  lang: Lang;
  t: Translate;
  onOpen: (id: string) => void;
}) {
  if (rolls.length === 0) {
    return <p className="m-0 text-[0.8rem] text-[var(--sr-fg-muted)]">{t("shelfEmpty")}</p>;
  }
  return (
    <ul className="m-0 grid list-none gap-[0.45rem] p-0" id="shelf">
      {rolls.map((roll) => {
        const phase = phaseOf(roll, now);
        const state =
          phase === "shooting"
            ? t("shelfShooting", { n: roll.frames.length, cap: roll.capacity })
            : phase === "locked"
              ? t("shelfLocked", { n: roll.frames.length })
              : t("shelfDeveloped", { n: roll.frames.length });
        return (
          <li className="sr-roll" key={roll.id} data-state={phase}>
            <span className="sr-roll-can" data-state={phase} aria-hidden />
            <span className="sr-roll-meta">
              <span className="sr-roll-date">{formatDate(roll.firstShotAt ?? roll.createdAt, lang)}</span>
              <span className="sr-roll-state">{state}</span>
            </span>
            <button type="button" className="sr-key" onClick={() => onOpen(roll.id)}>
              {t("open")}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
