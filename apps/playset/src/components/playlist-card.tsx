import { GameToken } from "@/components/game-tile";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { queueMinutes } from "@/lib/games";
import type { Translate } from "@/lib/i18n";
import type { Playlist } from "@/lib/playlists";

/**
 * One saved list. Play is the biggest thing on it, because pressing play is
 * the only thing anyone does here twice a day.
 */
export function PlaylistCard({
  playlist,
  t,
  onPlay,
  onEdit,
  onDelete,
}: {
  playlist: Playlist;
  t: Translate;
  onPlay: (p: Playlist) => void;
  onEdit: (p: Playlist) => void;
  onDelete: (p: Playlist) => void;
}) {
  return (
    <Card data-tone="sun" id={`playlist-${playlist.id}`}>
      <CardHeader>
        <CardTitle className="break-words">{playlist.name}</CardTitle>
        <CardAction>
          <span className="font-[family-name:var(--stack-tag)] text-[0.74rem] font-extrabold text-muted-ink">
            {t("stepsCount", { n: playlist.games.length })} ·{" "}
            {t("aboutMinutes", { m: queueMinutes(playlist.games) })}
          </span>
        </CardAction>
      </CardHeader>
      <CardContent>
        {/* The queue at a glance, in order, repeats and all. */}
        <div className="flex flex-wrap items-center gap-1.5">
          {playlist.games.map((id, i) => (
            <GameToken key={`${id}-${i}`} id={id} small />
          ))}
          {playlist.loop ? (
            <span className="ps-chip" data-kind="yes">
              {t("loopLabel")}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          className="ps-big mt-3"
          data-play={playlist.id}
          onClick={() => onPlay(playlist)}
        >
          ▶ {t("play")}
        </button>

        <div className="mt-2.5 flex gap-2.5">
          <button
            type="button"
            className="ps-big"
            data-tone="calm"
            onClick={() => onEdit(playlist)}
          >
            {t("edit")}
          </button>
          <button
            type="button"
            className="ps-big"
            data-tone="calm"
            onClick={() => onDelete(playlist)}
          >
            {t("delete")}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
