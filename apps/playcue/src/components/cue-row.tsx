import { ChevronDown, ChevronUp, X } from "lucide-react";

import { formatClock, type Cue } from "@/lib/cues";
import type { Translate } from "@/lib/i18n";

export function CueRow({
  cue,
  index,
  total,
  isCurrent,
  isNext,
  isMissing,
  isLive,
  t,
  onSelect,
  onMove,
  onRemove,
}: {
  cue: Cue;
  index: number;
  total: number;
  isCurrent: boolean;
  isNext: boolean;
  isMissing: boolean;
  isLive: boolean;
  t: Translate;
  onSelect: (id: string) => void;
  onMove: (id: string, delta: number) => void;
  onRemove: (cue: Cue) => void;
}) {
  const face = isMissing
    ? "pc-cue-missing"
    : isCurrent
      ? "pc-cue-now"
      : isNext
        ? "pc-cue-next"
        : "";

  return (
    <li className={`pc-cue ${face}`} data-cue={cue.id}>
      <span
        className={`pc-lamp ${
          isMissing
            ? "pc-lamp-stopped"
            : isCurrent
              ? isLive
                ? "pc-lamp-on-air"
                : "pc-lamp-standby"
              : ""
        }`}
        aria-hidden
      />
      <button
        type="button"
        className="flex min-w-0 flex-1 cursor-pointer flex-col items-start gap-[0.15rem] border-0 bg-transparent p-0 text-left"
        onClick={() => onSelect(cue.id)}
        aria-label={`${t("cueNo", { n: index + 1 })} ${cue.name} — ${t("makeCurrent")}`}
      >
        <span className="flex flex-wrap items-center gap-x-[0.4rem] gap-y-[0.15rem]">
          <span className="pc-q">{t("cueNo", { n: index + 1 })}</span>
          {isCurrent && <span className="pc-slug text-amber">{t("nowLabel")}</span>}
          {isNext && <span className="pc-slug text-go">{t("nextLabel")}</span>}
          {cue.durationMs > 0 && (
            <span className="pc-slug tracking-[0.06em]">{formatClock(cue.durationMs)}</span>
          )}
        </span>
        <span className="pc-cue-name">{cue.name}</span>
        {isMissing && (
          <span className="text-[0.7rem] font-bold text-[#ff8e9c]">{t("missingFile")}</span>
        )}
      </button>

      <span className="flex shrink-0 items-center gap-[0.25rem]">
        <button
          type="button"
          className="pc-key"
          aria-label={t("moveUp")}
          disabled={index === 0}
          onClick={() => onMove(cue.id, -1)}
        >
          <ChevronUp className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          className="pc-key"
          aria-label={t("moveDown")}
          disabled={index === total - 1}
          onClick={() => onMove(cue.id, 1)}
        >
          <ChevronDown className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          className="pc-key pc-key-danger"
          aria-label={`${t("removeCue")} ${cue.name}`}
          onClick={() => onRemove(cue)}
        >
          <X className="size-4" aria-hidden />
        </button>
      </span>
    </li>
  );
}
