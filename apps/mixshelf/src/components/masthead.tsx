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
    <header className="ms-sign">
      <div className="ms-sign-row">
        <h1 id="brand-title">{title}</h1>
        <label className="sr-only" htmlFor="lang-select">
          {langLabel}
        </label>
        <select
          id="lang-select"
          className="ms-select"
          aria-label={langLabel}
          value={lang}
          onChange={(e) => onLangChange(e.target.value as Lang)}
          style={{ fontSize: 16, touchAction: "manipulation" }}
        >
          {LANGS.map((code) => (
            <option key={code} value={code}>
              {LANG_NAMES[code]}
            </option>
          ))}
        </select>
      </div>
      <p className="ms-tagline">{tagline}</p>
    </header>
  );
}
