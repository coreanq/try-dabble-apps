import { PpMark } from "@/components/pp-mark";
import { LANGS, LANG_NAMES, type Lang, type Translate } from "@/lib/i18n";

/**
 * Brand row: cat mark, title, language chips, tagline. Same ids and the same
 * .pp-tagline class as the no-JS shell so the Worker's first HTML and the
 * mounted app say the same thing.
 */
export function Masthead({ t, lang, onLangChange }: { t: Translate; lang: Lang; onLangChange: (next: Lang) => void }) {
  return (
    <header className="pp-masthead">
      <div className="pp-masthead-row">
        <PpMark className="pp-mark" />
        <h1 id="brand-title">{t("title")}</h1>
      </div>
      <div className="pp-lang-row" role="group" aria-label={t("langLabel")} id="lang-chips">
        {LANGS.map((code) => (
          <button
            key={code}
            type="button"
            className="pp-lang-chip"
            data-lang={code}
            aria-pressed={code === lang}
            lang={code}
            onClick={() => onLangChange(code)}
          >
            {LANG_NAMES[code]}
          </button>
        ))}
      </div>
      <p className="pp-tagline">{t("tagline")}</p>
    </header>
  );
}
