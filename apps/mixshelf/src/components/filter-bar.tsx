import { MEDIA_TYPES, type MediaType } from "@/lib/items";
import { typeLabel, type Lang, type MsgKey } from "@/lib/i18n";

const touch = { fontSize: 16, touchAction: "manipulation" as const };

export function FilterBar({
  lang,
  t,
  types,
  tags,
  availableTags,
  onToggleType,
  onToggleTag,
  onClear,
}: {
  lang: Lang;
  t: (key: MsgKey) => string;
  types: MediaType[];
  tags: string[];
  availableTags: string[];
  onToggleType: (t: MediaType) => void;
  onToggleTag: (tag: string) => void;
  onClear: () => void;
}) {
  const has = types.length > 0 || tags.length > 0;
  return (
    <section className="ms-filters" id="filter-bar">
      <div className="ms-filter-row">
        <span className="ms-filter-label">{t("filterType")}</span>
        <div className="ms-chips">
          {MEDIA_TYPES.map((mt) => {
            const on = types.includes(mt);
            return (
              <button
                type="button"
                key={mt}
                id={`filter-type-${mt}`}
                className="ms-chip"
                data-kind={on ? "yes" : "no"}
                aria-pressed={on}
                style={touch}
                onClick={() => onToggleType(mt)}
              >
                {typeLabel(lang, mt)}
              </button>
            );
          })}
        </div>
      </div>
      <div className="ms-filter-row">
        <span className="ms-filter-label">{t("filterTag")}</span>
        {availableTags.length === 0 ? (
          <p className="ms-hint">{t("noTagsYet")}</p>
        ) : (
          <div className="ms-chips" id="filter-tags">
            {availableTags.map((tag) => {
              const on = tags.some((x) => x.toLowerCase() === tag.toLowerCase());
              return (
                <button
                  type="button"
                  key={tag}
                  className="ms-chip"
                  data-kind={on ? "yes" : "no"}
                  aria-pressed={on}
                  style={touch}
                  onClick={() => onToggleTag(tag)}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        )}
      </div>
      {has ? (
        <button type="button" id="clear-filters" className="ms-clear-filters" style={touch} onClick={onClear}>
          {t("clearFilters")}
        </button>
      ) : null}
    </section>
  );
}
