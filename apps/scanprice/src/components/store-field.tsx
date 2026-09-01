import type { Translate } from "@/lib/i18n";
import { MAX_STORE } from "@/lib/prices";

/**
 * The store tag: a short label typed once, then offered back as one-tap chips
 * built from the shops already on file. No supermarket list, no API — the tag
 * is whatever the shopper calls the place.
 */
export function StoreField({
  id,
  value,
  stores,
  t,
  onChange,
}: {
  id: string;
  value: string;
  stores: string[];
  t: Translate;
  onChange: (next: string) => void;
}) {
  return (
    <div>
      <label className="sp-field-label" htmlFor={id}>
        {t("storeLabel")}
      </label>
      <input
        id={id}
        className="sp-field mt-1"
        type="text"
        autoComplete="off"
        maxLength={MAX_STORE}
        placeholder={t("storePh")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {stores.length > 0 ? (
        <>
          <p className="mt-1.5 mb-0 text-[0.68rem] font-bold text-faint-ink">
            {t("storeRecent")}
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {stores.map((store) => (
              <button
                key={store}
                type="button"
                className="sp-storechip"
                data-on={store.toLowerCase() === value.trim().toLowerCase() ? "true" : "false"}
                onClick={() => onChange(store)}
              >
                {store}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
