import { Disc3, Heart, MoreHorizontal } from "lucide-react";

import { formatClock, type Track } from "@/lib/library";
import type { Translate } from "@/lib/i18n";

export function TrackRow({
  track,
  index,
  isCurrent,
  isPlaying,
  isMissing,
  t,
  onPlay,
  onFavorite,
  onMore,
}: {
  track: Track;
  index: number;
  isCurrent: boolean;
  isPlaying: boolean;
  isMissing: boolean;
  t: Translate;
  onPlay: (id: string) => void;
  onFavorite: (id: string) => void;
  onMore: (id: string) => void;
}) {
  const artist = track.artist || t("unknownArtist");
  const sub = track.album ? `${artist} · ${track.album}` : artist;
  return (
    <li
      className={`lp-row ${isCurrent ? "lp-row-on" : ""} ${isMissing ? "lp-row-missing" : ""}`}
      data-track-id={track.id}
    >
      <button
        type="button"
        className="lp-row-main"
        onClick={() => onPlay(track.id)}
        aria-current={isCurrent ? "true" : undefined}
        title={isMissing ? t("missingFile") : track.fileName}
      >
        <span className="lp-row-num" aria-hidden>
          {isCurrent ? (
            <Disc3 className={`size-4 ${isPlaying ? "lp-disc-spin" : ""}`} />
          ) : (
            index + 1
          )}
        </span>
        <span className="lp-row-text">
          <span className="lp-row-title">{track.title}</span>
          <span className="lp-row-sub">{isMissing ? t("missingFile") : sub}</span>
        </span>
        {track.duration ? <span className="lp-row-time">{formatClock(track.duration)}</span> : null}
      </button>
      <button
        type="button"
        className={`lp-icon-btn ${track.favorite ? "lp-icon-btn-on" : ""}`}
        aria-label={track.favorite ? t("unfavorite") : t("favorite")}
        aria-pressed={Boolean(track.favorite)}
        title={track.favorite ? t("unfavorite") : t("favorite")}
        onClick={() => onFavorite(track.id)}
      >
        <Heart className="size-4" fill={track.favorite ? "currentColor" : "none"} aria-hidden />
      </button>
      <button
        type="button"
        className="lp-icon-btn"
        aria-label={t("edit")}
        title={t("edit")}
        onClick={() => onMore(track.id)}
      >
        <MoreHorizontal className="size-4" aria-hidden />
      </button>
    </li>
  );
}
