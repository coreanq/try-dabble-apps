import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import type { Translate } from "@/lib/i18n";
import {
  MAX_TEXT,
  TTL_PRESETS,
  breakdown,
  hasText,
  msLeft,
  type Note,
} from "@/lib/notes";
import { presetLabel } from "@/components/timer-presets";
import { cn } from "@/lib/utils";

/** "1d 4h" → "23h 12m" → "4m 09s": always two units, never a wall of zeros. */
export function formatLeft(ms: number, t: Translate): string {
  const { d, h, m, s } = breakdown(ms);
  if (d > 0) return `${d}${t("unitD")} ${h}${t("unitH")}`;
  if (h > 0) return `${h}${t("unitH")} ${m}${t("unitM")}`;
  if (m > 0) return `${m}${t("unitM")} ${String(s).padStart(2, "0")}${t("unitS")}`;
  return `${s}${t("unitS")}`;
}

function tone(left: number, ttlMs: number): "fresh" | "soon" | "gone" {
  if (left <= 60_000) return "gone";
  if (left / ttlMs <= 0.15) return "soon";
  return "fresh";
}

export function NoteSheet({
  note,
  now,
  t,
  onText,
  onTtl,
  onReset,
  onDelete,
}: {
  note: Note;
  now: number;
  t: Translate;
  onText: (id: string, text: string) => void;
  onTtl: (id: string, ttlMs: number) => void;
  onReset: (id: string) => void;
  onDelete: (note: Note) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const written = hasText(note);
  const left = msLeft(note, now);
  const mood = tone(left, note.ttlMs);

  // Grow with the text so the pad never shows an inner scrollbar.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 84)}px`;
  }, [note.text]);

  return (
    <article
      className={cn("tp-sheet", mood === "gone" && written && "tp-sheet-gone")}
      data-note-id={note.id}
      aria-label={t("notePlaceholder")}
    >
      <textarea
        ref={ref}
        className="tp-write"
        data-note-input={note.id}
        rows={3}
        maxLength={MAX_TEXT}
        spellCheck={false}
        placeholder={t("notePlaceholder")}
        aria-label={t("notePlaceholder")}
        value={note.text}
        onChange={(e) => onText(note.id, e.target.value)}
      />

      <div className="mt-[0.55rem] flex flex-wrap items-center gap-x-[0.5rem] gap-y-[0.4rem] border-t border-dashed border-[#dcc98a] pt-[0.5rem]">
        {written ? (
          <span
            className={cn("tp-stamp", `tp-stamp-${mood}`)}
            data-note-countdown={note.id}
            title={t("defaultTimerHint")}
          >
            {formatLeft(left, t)}
            <small>{mood === "gone" ? t("expiringNow") : t("leftLabel")}</small>
          </span>
        ) : (
          <span className="text-[0.7rem] font-semibold text-muted-ink">{t("autosave")}</span>
        )}

        <span className="ml-auto flex items-center gap-[0.35rem]">
          <label className="sr-only" htmlFor={`ttl-${note.id}`}>
            {t("noteTimerLabel")}
          </label>
          <select
            id={`ttl-${note.id}`}
            className="tp-select"
            aria-label={t("noteTimerLabel")}
            value={note.ttlMs}
            onChange={(e) => onTtl(note.id, Number(e.target.value))}
          >
            {TTL_PRESETS.map((ttl) => (
              <option key={ttl} value={ttl}>
                {presetLabel(t, ttl)}
              </option>
            ))}
          </select>

          {written ? (
            <>
              <Button variant="ghost" size="xs" onClick={() => onReset(note.id)}>
                {t("resetTimer")}
              </Button>
              <Button variant="destructive" size="xs" onClick={() => onDelete(note)}>
                {t("deleteNote")}
              </Button>
            </>
          ) : null}
        </span>
      </div>
    </article>
  );
}
