import { useEffect, useMemo, useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { matchesQuery, type CurrencyInfo } from "@/lib/currencies";
import type { Lang, Translate } from "@/lib/i18n";

/**
 * A fold-out list of currencies with a search box. The search field is never
 * focused for the reader: on a phone
 * the keyboard would cover half the list before the traveler has even seen
 * the flags. Tapping a row picks it and closes the sheet.
 */
export function CurrencyPicker({
  open,
  title,
  lang,
  list,
  selected,
  t,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  title: string;
  lang: Lang;
  list: CurrencyInfo[];
  selected: string;
  t: Translate;
  onOpenChange: (open: boolean) => void;
  onPick: (code: string) => void;
}) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const shown = useMemo(() => list.filter((c) => matchesQuery(c, lang, query)), [list, lang, query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent id="currency-picker" className="gap-3">
        <DialogHeader>
          <DialogTitle className="pr-8">{title}</DialogTitle>
          <DialogDescription className="sr-only">{t("searchPlaceholder")}</DialogDescription>
        </DialogHeader>
        <input
          id="currency-search"
          className="fx-search"
          type="search"
          inputMode="search"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {shown.length === 0 ? (
          <p className="fx-hint" id="currency-no-match">
            {t("noMatch")}
          </p>
        ) : (
          <ul className="fx-list" role="listbox" aria-label={title}>
            {shown.map((c) => (
              <li key={c.code} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={c.code === selected}
                  className="fx-option"
                  data-code={c.code}
                  onClick={() => {
                    onPick(c.code);
                    onOpenChange(false);
                  }}
                >
                  <span className="fx-flag" aria-hidden>
                    {c.flag}
                  </span>
                  <span className="fx-chip-text">
                    <span className="fx-code">{c.code}</span>
                    <span className="fx-name">{c.name[lang]}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
