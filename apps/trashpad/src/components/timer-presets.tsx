import { TTL_PRESETS } from "@/lib/notes";
import type { MsgKey, Translate } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** 1h / 6h / 24h / 48h / 7d, in the order the presets are declared. */
const PRESET_KEYS: MsgKey[] = ["preset1h", "preset6h", "preset24h", "preset48h", "preset7d"];

export function presetLabel(t: Translate, ttlMs: number): string {
  const i = (TTL_PRESETS as readonly number[]).indexOf(ttlMs);
  return t(PRESET_KEYS[i === -1 ? 2 : i]);
}

/**
 * The delete timer, out in the open. The named fail-fix on the source thread
 * was "let me change the 24h", so this row sits on the first screen rather
 * than behind a settings sheet.
 */
export function TimerPresets({
  id,
  label,
  hint,
  value,
  onChange,
  t,
}: {
  id: string;
  label: string;
  hint?: string;
  value: number;
  onChange: (ttlMs: number) => void;
  t: Translate;
}) {
  return (
    <div id={id} role="group" aria-label={label}>
      <span className="tp-label">{label}</span>
      <div className="mt-[0.35rem] flex flex-wrap gap-[0.35rem]">
        {TTL_PRESETS.map((ttl, i) => (
          <button
            key={ttl}
            type="button"
            className={cn("tp-chip")}
            aria-pressed={value === ttl}
            onClick={() => onChange(ttl)}
          >
            {t(PRESET_KEYS[i])}
          </button>
        ))}
      </div>
      {hint ? <p className="mt-[0.35rem] mb-0 text-[0.7rem] text-muted-ink">{hint}</p> : null}
    </div>
  );
}
