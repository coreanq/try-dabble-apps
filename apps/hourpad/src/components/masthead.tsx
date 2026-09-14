import { HpMark } from "@/components/hp-mark";
import { LANGS, LANG_NAMES, type Lang, type Translate } from "@/lib/i18n";

export function Masthead({
  t,
  lang,
  onLangChange,
}: {
  t: Translate;
  lang: Lang;
  onLangChange: (next: Lang) => void;
}) {
  return (
    <header className="hp-masthead">
      <div className="hp-masthead-row">
        <HpMark className="hp-mark" />
        <h1 id="brand-title">{t("title")}</h1>
        <label className="sr-only" htmlFor="lang-select">
          {t("langLabel")}
        </label>
        <select id="lang-select" className="hp-select" aria-label={t("langLabel")} value={lang} onChange={(e) => onLangChange(e.target.value as Lang)}>
          {LANGS.map((code) => (
            <option key={code} value={code}>
              {LANG_NAMES[code]}
            </option>
          ))}
        </select>
      </div>
      <p className="hp-tagline">{t("tagline")}</p>
    </header>
  );
}
