import { YearsPicker } from "@/components/years-picker";
import { Button } from "@/components/ui/button";
import type { Translate } from "@/lib/i18n";
import {
  daysUntil,
  returnYear,
  returnsOn,
  untilParts,
  type Song,
} from "@/lib/songs";

export interface SongPatch {
  lastLoved?: string;
  years?: number;
}

/** The line under the artist: how long is left, or how long it has been back. */
function waitLine(song: Song, t: Translate): string {
  const iso = returnsOn(song);
  const left = daysUntil(iso);
  if (left === null) return "";
  if (left < 0) return t("backSince", { n: -left });
  if (left === 0) return t("backToday");
  const parts = untilParts(iso);
  if (!parts) return t("waitDays", { d: left });
  return parts.years > 0
    ? t("waitYearsDays", { y: parts.years, d: parts.days })
    : t("waitDays", { d: parts.days });
}

/**
 * One ticket stub. Collapsed it shows the title, the artist, the day it was
 * last loved and the year stamp. Open it and the two things that matter — the
 * date and the number of years — are editable in place. There is no play
 * button, no file picker and no streaming link anywhere on this card.
 */
export function SongStub({
  song,
  t,
  due,
  open,
  dateLabel,
  onToggle,
  onPatch,
  onLovedAgain,
  onDelete,
}: {
  song: Song;
  t: Translate;
  due: boolean;
  open: boolean;
  dateLabel: (iso: string) => string;
  onToggle: (id: string) => void;
  onPatch: (id: string, patch: SongPatch) => void;
  onLovedAgain: (song: Song) => void;
  onDelete: (song: Song) => void;
}) {
  const bodyId = `song-body-${song.id}`;

  return (
    <article className="ll-stub" data-due={due} data-open={open} data-song-stub="">
      <div className="ll-stub-main">
        <button
          type="button"
          className="ll-open-btn"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => onToggle(song.id)}
        >
          <h3 className="ll-song">{song.title}</h3>
          <p className="ll-artist">{song.artist}</p>
          <div className="mt-[0.32rem] flex flex-wrap items-center gap-x-[0.55rem] gap-y-[0.22rem]">
            <span className="ll-meta">
              {t("lastLovedOn")} {dateLabel(song.lastLoved)}
            </span>
            <span className="ll-meta" data-wait="">
              {waitLine(song, t)}
            </span>
            {song.returns > 0 ? (
              <span className="ll-meta">{t("returnsCount", { n: song.returns })}</span>
            ) : null}
          </div>
          <span className="sr-only">{open ? t("closeEdit") : t("openEdit")}</span>
        </button>

        {/* A song that is back is meant to be re-loved in one tap, without
            opening anything. Tapping it winds the clock back to today. */}
        {due ? (
          <div className="mt-[0.45rem]">
            <Button
              size="sm"
              data-loved-again=""
              onClick={() => onLovedAgain(song)}
            >
              {t("lovedAgain")}
            </Button>
          </div>
        ) : null}

        {open ? (
          <div className="mt-[0.6rem] flex flex-col gap-[0.55rem]" id={bodyId}>
            <div className="h-px bg-rule" />

            <div>
              <label className="ll-label" htmlFor={`last-${song.id}`}>
                {t("lastLovedLabel")}
              </label>
              <input
                id={`last-${song.id}`}
                className="ll-field ll-date mt-[0.25rem] h-10 py-0"
                type="date"
                value={song.lastLoved}
                onChange={(e) => onPatch(song.id, { lastLoved: e.target.value })}
              />
            </div>

            <div>
              <span className="ll-label">{t("yearsLabel")}</span>
              <div className="mt-[0.3rem]">
                <YearsPicker
                  value={song.years}
                  onChange={(years) => onPatch(song.id, { years })}
                  t={t}
                  idPrefix={`song-${song.id}`}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-[0.4rem]">
              <span className="ll-meta">{dateLabel(returnsOn(song))}</span>
              <div className="flex gap-[0.35rem]">
                {!due ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    data-loved-again=""
                    onClick={() => onLovedAgain(song)}
                  >
                    {t("lovedAgain")}
                  </Button>
                ) : null}
                <Button
                  variant="destructive"
                  size="sm"
                  data-delete-song=""
                  onClick={() => onDelete(song)}
                >
                  {t("deleteSong")}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* The year stamp punched on the end of the stub. */}
      <div className="ll-year" data-tone={due ? "due" : "waiting"} aria-hidden="true">
        <span className="ll-year-num">{returnYear(song)}</span>
        <span className="ll-year-word">{due ? t("stampBack") : "↺"}</span>
      </div>
      <span className="sr-only">
        {due ? t("stampBack") : t("stampReturns", { y: returnYear(song) })}
      </span>
    </article>
  );
}
