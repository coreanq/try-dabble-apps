import type { Translate } from "@/lib/i18n";

/** One box over the name, the code digits and the store tag. */
export function SearchBox({
  value,
  t,
  onChange,
}: {
  value: string;
  t: Translate;
  onChange: (next: string) => void;
}) {
  return (
    <div>
      <label className="sr-only" htmlFor="search-box">
        {t("searchLabel")}
      </label>
      <input
        id="search-box"
        className="sp-field"
        type="search"
        autoComplete="off"
        placeholder={t("searchPh")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
