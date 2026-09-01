import { CueMark } from "@/components/cue-mark";
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
    <header className="pc-masthead">
      <div className="pc-masthead-row">
        <h1 id="brand-title">{title}</h1>
        <CueMark className="block h-8 w-[40px] shrink-0 sm:h-9 sm:w-[46px]" />
        <label className="sr-only" htmlFor="lang-select">
          {langLabel}
        </label>
        <select
          id="lang-select"
          className="pc-select"
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
      <p className="pc-tagline">{tagline}</p>
    </header>
  );
}
