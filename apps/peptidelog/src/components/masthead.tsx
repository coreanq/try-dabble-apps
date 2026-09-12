import { PlMark } from "@/components/pl-mark";
import { LANGS, LANG_NAMES, type Lang, type Translate } from "@/lib/i18n";

/** Brand row: vial mark, title, language picker, tagline. Same ids as the no-JS shell. */
export function Masthead({ t, lang, onLangChange }: { t: Translate; lang: Lang; onLangChange: (next: Lang) => void }) {
  return (
    <header className="pl-masthead">
      <div className="pl-masthead-row">
        <PlMark className="pl-mark" />
        <h1 id="brand-title">{t("title")}</h1>
        <label className="sr-only" htmlFor="lang-select">
          {t("langLabel")}
        </label>
        <select id="lang-select" className="pl-select" aria-label={t("langLabel")} value={lang} onChange={(e) => onLangChange(e.target.value as Lang)}>
          {LANGS.map((code) => (
            <option key={code} value={code}>
              {LANG_NAMES[code]}
            </option>
          ))}
        </select>
      </div>
      <p className="pl-tagline">{t("tagline")}</p>
    </header>
  );
}
