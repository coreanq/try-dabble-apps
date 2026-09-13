import { Timer } from "lucide-react";

import { GmMark } from "@/components/gm-mark";
import { LANGS, LANG_NAMES, type Lang, type Translate } from "@/lib/i18n";

/**
 * Brand row: dumbbell mark, title, rest-timer chip (only while a rest is
 * running), language picker, tagline. Same ids as the no-JS shell.
 */
export function Masthead({
  t,
  lang,
  restLabel,
  onRestTap,
  onLangChange,
}: {
  t: Translate;
  lang: Lang;
  restLabel: string | null;
  onRestTap: () => void;
  onLangChange: (next: Lang) => void;
}) {
  return (
    <header className="gm-masthead">
      <div className="gm-masthead-row">
        <GmMark className="gm-mark" />
        <h1 id="brand-title">{t("title")}</h1>
        {restLabel && (
          <button type="button" className="gm-rest-chip" id="rest-chip" onClick={onRestTap} aria-label={t("restTitle")}>
            <Timer className="size-4" aria-hidden />
            {restLabel}
          </button>
        )}
        <label className="sr-only" htmlFor="lang-select">
          {t("langLabel")}
        </label>
        <select id="lang-select" className="gm-select" aria-label={t("langLabel")} value={lang} onChange={(e) => onLangChange(e.target.value as Lang)}>
          {LANGS.map((code) => (
            <option key={code} value={code}>
              {LANG_NAMES[code]}
            </option>
          ))}
        </select>
      </div>
      <p className="gm-tagline">{t("tagline")}</p>
    </header>
  );
}
