import { CoinMark } from "@/components/coin-mark";
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
    <header className="cpu-masthead">
      <div className="cpu-masthead-row">
        <h1 id="brand-title">{title}</h1>
        <CoinMark className="block h-9 w-9 shrink-0 sm:h-10 sm:w-10" />
        <label className="sr-only" htmlFor="lang-select">
          {langLabel}
        </label>
        <select
          id="lang-select"
          className="cpu-select"
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
      <p id="brand-tagline">{tagline}</p>
    </header>
  );
}
