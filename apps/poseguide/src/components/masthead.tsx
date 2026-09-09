import { PgMark } from "@/components/pg-mark";
import { LANGS, LANG_NAMES, type Lang } from "@/lib/i18n";

export function Masthead({
  title,
  tagline,
  langLabel,
  lang,
  onLangChange,
}: {
  title: string;
  tagline: string;
  langLabel: string;
  lang: Lang;
  onLangChange: (next: Lang) => void;
}) {
  return (
    <header className="pg-masthead">
      <div className="pg-masthead-row">
        <PgMark className="pg-mark" />
        <h1 id="brand-title">{title}</h1>
        <label className="sr-only" htmlFor="lang-select">
          {langLabel}
        </label>
        <select
          id="lang-select"
          className="pg-select"
          aria-label={langLabel}
          value={lang}
          onChange={(e) => onLangChange(e.target.value as Lang)}
        >
          {LANGS.map((code) => (
            <option key={code} value={code}>
              {LANG_NAMES[code]}
            </option>
          ))}
        </select>
      </div>
      <p className="pg-tagline">{tagline}</p>
    </header>
  );
}
