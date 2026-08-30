import { useState } from "react";

import { GameTile, GameToken } from "@/components/game-tile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GAMES, gameDef, queueMinutes, type GameId } from "@/lib/games";
import type { Translate } from "@/lib/i18n";
import { MAX_NAME, MAX_STEPS, type Playlist } from "@/lib/playlists";

/**
 * The editor. It is a full panel rather than a modal because a caregiver on a
 * 390px phone should not be scrolling a queue inside a floating box.
 *
 * Two halves: the six games up top (tap to add — the same game as often as you
 * like), and the queue underneath in the order it will play.
 */
export function PlaylistEditor({
  t,
  editing,
  onSave,
  onCancel,
}: {
  t: Translate;
  editing: Playlist | null;
  onSave: (name: string, games: GameId[], loop: boolean) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [games, setGames] = useState<GameId[]>(editing?.games ?? []);
  const [loop, setLoop] = useState(editing?.loop ?? false);

  function add(id: GameId) {
    setGames((cur) => (cur.length >= MAX_STEPS ? cur : [...cur, id]));
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= games.length) return;
    setGames((cur) => {
      const next = cur.slice();
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  return (
    <>
      <Card id="editor-card" data-tone="sun">
        <CardHeader>
          <CardTitle id="editor-title">
            {editing ? t("editorEditTitle") : t("editorNewTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <label className="ps-label" htmlFor="playlist-name">
            {t("nameLabel")}
          </label>
          {/* 16px, and never autofocused: an opening keyboard would hide the
              games this screen exists to show. */}
          <input
            id="playlist-name"
            className="ps-field"
            type="text"
            inputMode="text"
            maxLength={MAX_NAME}
            placeholder={t("namePh")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card id="pick-card" data-tone="sky">
        <CardHeader>
          <CardTitle id="pick-title">{t("pickLabel")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="ps-note mb-2.5" id="pick-hint">
            {t("pickHint")}
          </p>
          <div className="flex flex-col gap-2.5" id="pick-list">
            {GAMES.map((g) => (
              <GameTile key={g.id} id={g.id} t={t} onAdd={add} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card id="queue-card" data-tone="mint">
        <CardHeader>
          <CardTitle id="queue-title">{t("queueLabel")}</CardTitle>
        </CardHeader>
        <CardContent>
          {games.length === 0 ? (
            <p className="ps-note" id="queue-empty">
              {t("queueEmpty")}
            </p>
          ) : (
            <>
              <p className="ps-note mb-2.5" id="queue-hint">
                {t("queueHint")} · {t("stepsCount", { n: games.length })} ·{" "}
                {t("aboutMinutes", { m: queueMinutes(games) })}
              </p>
              <ol className="m-0 flex list-none flex-col gap-2 p-0" id="queue-list">
                {games.map((id, i) => (
                  <li className="ps-step" key={`${id}-${i}`}>
                    <span className="ps-step-no">{i + 1}</span>
                    <GameToken id={id} small />
                    <span className="ps-step-name">{t(gameDef(id).nameKey)}</span>
                    <button
                      type="button"
                      className="ps-tile-add h-10 w-10 text-[1.1rem]"
                      aria-label={t("moveUp")}
                      disabled={i === 0}
                      onClick={() => move(i, i - 1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="ps-tile-add h-10 w-10 text-[1.1rem]"
                      aria-label={t("moveDown")}
                      disabled={i === games.length - 1}
                      onClick={() => move(i, i + 1)}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="ps-tile-add h-10 w-10 text-[1.1rem]"
                      aria-label={t("removeStep")}
                      onClick={() => setGames((cur) => cur.filter((_, j) => j !== i))}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ol>

              <button
                type="button"
                className="ps-note mt-2.5 underline"
                id="queue-clear"
                onClick={() => setGames([])}
              >
                {t("clearQueue")}
              </button>
            </>
          )}

          <label className="ps-loop mt-3" data-on={loop} htmlFor="loop-toggle">
            <input
              id="loop-toggle"
              type="checkbox"
              checked={loop}
              onChange={(e) => setLoop(e.target.checked)}
            />
            <span>
              {t("loopLabel")}
              <span className="ps-tile-how">{t("loopHint")}</span>
            </span>
          </label>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          className="ps-big"
          id="editor-save"
          onClick={() => onSave(name, games, loop)}
        >
          {t("save")}
        </button>
        <button
          type="button"
          className="ps-big"
          data-tone="calm"
          id="editor-cancel"
          onClick={onCancel}
        >
          {t("cancel")}
        </button>
      </div>
    </>
  );
}
