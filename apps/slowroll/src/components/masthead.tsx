import { LANGS, LANG_NAMES, type Lang } from "@/lib/i18n";

/** The camera mark: yellow body, black grip, lens, and a counter reading 24. */
function CameraMark() {
  return (
    <svg viewBox="0 0 64 44" aria-hidden="true" focusable="false" className="sr-mark">
      <rect x="2" y="8" width="60" height="32" rx="6" fill="#f2b632" />
      <rect x="2" y="8" width="60" height="32" rx="6" fill="none" stroke="#5a3d10" strokeWidth="2" />
      <rect x="44" y="8" width="18" height="32" rx="6" fill="#2a2118" />
      <rect x="22" y="3" width="14" height="7" rx="1.5" fill="#2a2118" />
      <circle cx="26" cy="24" r="10" fill="#2a2118" />
      <circle cx="26" cy="24" r="6.5" fill="#4a3b2a" />
      <circle cx="24" cy="21.5" r="2" fill="#f5e9cf" opacity="0.8" />
      <rect x="8" y="13" width="9" height="6" rx="1" fill="#d8ecf5" />
      <circle cx="53" cy="20" r="5" fill="#f5e9cf" />
      <text x="53" y="22.4" textAnchor="middle" fontFamily="monospace" fontSize="6.5" fontWeight="700" fill="#2a2118">
        24
      </text>
    </svg>
  );
}

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
    <header className="sr-masthead">
      <div className="sr-masthead-row">
        <CameraMark />
        <h1 id="brand-title">{title}</h1>
        <label className="sr-only" htmlFor="lang-select">
          {langLabel}
        </label>
        <select
          id="lang-select"
          className="sr-select"
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
      <p className="sr-tagline">{tagline}</p>
    </header>
  );
}
