import { StoneMark } from "@/components/stone-mark";
import { LANGS, LANG_NAMES, type Lang } from "@/lib/i18n";

export function Masthead({
  title,
  sub,
  langLabel,
  lang,
  onLangChange,
}: {
  title: string;
  sub: string;
  langLabel: string;
  lang: Lang;
  onLangChange: (next: Lang) => void;
}) {
  return (
    <header className="gb-masthead">
      <div className="gb-masthead-row">
        <StoneMark className="gb-mark" />
        <div className="gb-brand">
          <h1 id="brand-title">{title}</h1>
          <p id="brand-sub">{sub}</p>
        </div>
        <label className="sr-only" htmlFor="lang-select">
          {langLabel}
        </label>
        <select
          id="lang-select"
          className="gb-select"
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
    </header>
  );
}
