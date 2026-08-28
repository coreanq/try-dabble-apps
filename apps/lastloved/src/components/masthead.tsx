import { CassetteMark } from "@/components/cassette-mark";
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
    <header className="ll-jcard">
      <div className="ll-jcard-row">
        <h1 id="brand-title">{title}</h1>
        <CassetteMark className="block h-7 w-[42px] shrink-0 sm:h-8 sm:w-[48px]" />
        <label className="sr-only" htmlFor="lang-select">
          {langLabel}
        </label>
        <select
          id="lang-select"
          className="ll-select"
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
      <p className="ll-tagline">{tagline}</p>
    </header>
  );
}
