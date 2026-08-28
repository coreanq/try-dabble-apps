import { MAX_YEARS, MIN_YEARS, YEAR_PRESETS, clampYears } from "@/lib/songs";
import type { Translate } from "@/lib/i18n";

/**
 * The one control the whole product turns on: how many years until the song
 * comes back. Presets are stamped keys on the first screen — never a setting
 * buried behind a gear — and any number from 1 to 50 can be typed instead.
 */
export function YearsPicker({
  value,
  onChange,
  t,
  idPrefix,
}: {
  value: number;
  onChange: (years: number) => void;
  t: Translate;
  idPrefix: string;
}) {
  const custom = !(YEAR_PRESETS as readonly number[]).includes(value);

  return (
    <div className="flex flex-col gap-[0.35rem]">
      <div className="ll-years" role="group" aria-label={t("yearsLabel")}>
        {YEAR_PRESETS.map((n) => (
          <button
            key={n}
            type="button"
            id={`${idPrefix}-years-${n}`}
            className="ll-year-key"
            aria-pressed={value === n}
            onClick={() => onChange(n)}
          >
            {t("yearsOption", { n })}
          </button>
        ))}
        <input
          id={`${idPrefix}-years-custom`}
          className="ll-field ll-date h-9 w-[4.6rem] flex-none py-0 text-center"
          type="number"
          inputMode="numeric"
          min={MIN_YEARS}
          max={MAX_YEARS}
          step={1}
          value={custom ? value : ""}
          placeholder="N"
          aria-label={t("yearsLabel")}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") return;
            onChange(clampYears(raw));
          }}
        />
      </div>
    </div>
  );
}
