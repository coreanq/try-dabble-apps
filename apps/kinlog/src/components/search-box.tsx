import { Button } from "@/components/ui/button";
import type { Translate } from "@/lib/i18n";

/** Substring search over name, context and notes — "who was the one who does
 *  pottery?" is a note search, not a name search. */
export function SearchBox({
  value,
  onChange,
  t,
}: {
  value: string;
  onChange: (next: string) => void;
  t: Translate;
}) {
  return (
    <div className="flex items-center gap-[0.4rem]">
      <label className="sr-only" htmlFor="search-input">
        {t("searchLabel")}
      </label>
      <input
        id="search-input"
        className="kl-field h-10 py-0"
        type="search"
        inputMode="search"
        autoComplete="off"
        value={value}
        placeholder={t("searchPlaceholder")}
        aria-label={t("searchLabel")}
        onChange={(e) => onChange(e.target.value)}
      />
      {value ? (
        <Button
          id="search-clear"
          variant="ghost"
          size="sm"
          onClick={() => onChange("")}
          aria-label={t("clearSearch")}
        >
          {t("clearSearch")}
        </Button>
      ) : null}
    </div>
  );
}
