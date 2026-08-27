import { Button } from "@/components/ui/button";
import { LANGS, LANG_NAMES, type Lang, type Translate } from "@/lib/i18n";

/**
 * Amber notice strip. The Worker rewrites #local-only in the FIRST HTML, so
 * the id has to survive into the mounted app unchanged, and the number sign
 * stays a CSS ::before — setInnerContent would wipe a real child.
 */
export function LocalOnlyBanner({
  text,
  lang,
  onLangChange,
  t,
}: {
  text: string;
  lang: Lang;
  onLangChange: (next: Lang) => void;
  t: Translate;
}) {
  return (
    <div className="pj-noticebar">
      <p className="pj-notice" id="local-only" role="note">
        {text}
      </p>
      <div className="pj-langs" role="group" aria-label={t("langLabel")}>
        {LANGS.map((code) => (
          <Button
            key={code}
            type="button"
            variant="ghost"
            size="xs"
            className="pj-key"
            aria-pressed={code === lang}
            onClick={() => onLangChange(code)}
          >
            {LANG_NAMES[code]}
          </Button>
        ))}
      </div>
    </div>
  );
}
