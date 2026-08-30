import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from "react";

import { AddGame } from "@/components/games/add-game";
import { OddGame } from "@/components/games/odd-game";
import { PairGame } from "@/components/games/pair-game";
import { SequenceGame } from "@/components/games/sequence-game";
import { SortGame } from "@/components/games/sort-game";
import { TapGame } from "@/components/games/tap-game";
import type { GameProps } from "@/components/games/types";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { gameDef, type GameId } from "@/lib/games";
import type { Translate } from "@/lib/i18n";
import type { Playlist } from "@/lib/playlists";

const SURFACES: Record<GameId, ComponentType<GameProps>> = {
  pair: PairGame,
  sequence: SequenceGame,
  odd: OddGame,
  add: AddGame,
  sort: SortGame,
  tap: TapGame,
};

/** The soft pause between two games, in seconds. Long enough to breathe. */
const PAUSE_SECONDS = 6;

type Phase = "playing" | "between" | "done";

/**
 * The player. It owns the clock, the queue and the hand-off — which is the
 * whole point of the app: the caregiver presses play once and never has to
 * load the next game by hand.
 *
 * Between two games there is a soft pause with a big Next, so anyone who wants
 * to wait can. Left alone, it starts the next one on its own.
 */
export function Player({
  playlist,
  startIndex,
  t,
  onProgress,
  onExit,
  onFinish,
}: {
  playlist: Playlist;
  startIndex: number;
  t: Translate;
  onProgress: (index: number) => void;
  onExit: () => void;
  onFinish: () => void;
}) {
  const total = playlist.games.length;
  const [index, setIndex] = useState(() =>
    startIndex >= 0 && startIndex < total ? startIndex : 0,
  );
  const [phase, setPhase] = useState<Phase>("playing");
  const [nextIndex, setNextIndex] = useState(0);
  const [left, setLeft] = useState(() => gameDef(playlist.games[startIndex] ?? "pair").seconds);
  const [pauseLeft, setPauseLeft] = useState(PAUSE_SECONDS);
  const [rounds, setRounds] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [askStop, setAskStop] = useState(false);
  const finished = useRef(false);

  const gameId = playlist.games[index] ?? "pair";
  const def = useMemo(() => gameDef(gameId), [gameId]);
  const Surface = SURFACES[gameId];

  /* Every step is written down immediately, so a locked phone or a closed tab
     comes back to the same place in the queue. */
  useEffect(() => {
    if (phase !== "done") onProgress(index);
  }, [index, phase, onProgress]);

  const leave = useCallback(() => {
    if (phase === "done") return;
    setAskStop(true);
  }, [phase]);

  /** Called when a game's clock runs out. */
  const advance = useCallback(() => {
    const following = index + 1;
    if (following < total) {
      setNextIndex(following);
      setPhase("between");
      return;
    }
    if (playlist.loop) {
      setNextIndex(0);
      setPhase("between");
      return;
    }
    if (!finished.current) {
      finished.current = true;
      onFinish();
    }
    setPhase("done");
  }, [index, total, playlist.loop, onFinish]);

  /* The game clock. Counted down in a closure rather than inside a state
     updater, so React never sees a state change fire off another one. */
  useEffect(() => {
    if (phase !== "playing") return;
    setRounds(0);
    setLeft(def.seconds);
    let remaining = def.seconds;
    const id = window.setInterval(() => {
      remaining -= 1;
      setLeft(Math.max(0, remaining));
      if (remaining <= 0) {
        window.clearInterval(id);
        advance();
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, index, def.seconds, advance]);

  const startNext = useCallback(() => {
    setIndex(nextIndex);
    setPhase("playing");
  }, [nextIndex]);

  /* The pause clock. This is what makes the queue advance on its own: left
     alone it starts the next game, and the big Next button just gets there
     sooner. */
  useEffect(() => {
    if (phase !== "between") return;
    setPauseLeft(PAUSE_SECONDS);
    let remaining = PAUSE_SECONDS;
    const id = window.setInterval(() => {
      remaining -= 1;
      setPauseLeft(Math.max(0, remaining));
      if (remaining <= 0) {
        window.clearInterval(id);
        startNext();
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, nextIndex, startNext]);

  const onRound = useCallback(() => setRounds((n) => n + 1), []);

  function playAgain() {
    finished.current = false;
    setIndex(0);
    setPhase("playing");
  }

  const pct = Math.max(0, Math.min(100, (left / def.seconds) * 100));

  return (
    <div className="ps-stage" id="stage">
      <div className="ps-stage-bar">
        <span className="ps-stage-where" id="stage-where">
          {playlist.name} · {t("position", { i: index + 1, n: total })}
        </span>
        <button
          type="button"
          className="ps-select"
          id="stage-stop"
          onClick={phase === "done" ? onExit : leave}
        >
          {phase === "done" ? t("backHome") : t("stop")}
        </button>
      </div>

      {phase === "playing" ? (
        <>
          <div className="ps-timer" aria-hidden="true">
            <div className="ps-timer-fill" style={{ width: `${pct}%` }} />
          </div>
          <p className="ps-prompt" id="stage-prompt">
            {prompt || t(def.howKey)}
          </p>
          <div className="ps-play-area">
            <Surface t={t} onRound={onRound} setPrompt={setPrompt} />
          </div>
          {/* Rounds done, as a row of suns. There is no target to fall short
              of and it starts empty again every game. */}
          <div className="ps-suns" id="stage-suns" aria-hidden="true">
            {Array.from({ length: Math.min(rounds, 24) }, (_, i) => (
              <span className="ps-sun" key={i} />
            ))}
          </div>
        </>
      ) : null}

      {phase === "between" ? (
        <div className="ps-pause" id="stage-pause">
          <SunBurst />
          <p className="ps-pause-title" id="pause-title">
            {t("wellDone")}
          </p>
          <p className="ps-pause-next" id="pause-next">
            {t("upNext", { name: t(gameDef(playlist.games[nextIndex]).nameKey) })}
          </p>
          <p className="ps-pause-next" id="pause-auto">
            {t("autoNext")} · {pauseLeft}
          </p>
          <button type="button" className="ps-big" id="pause-next-btn" onClick={startNext}>
            {t("next")}
          </button>
        </div>
      ) : null}

      {phase === "done" ? (
        <div className="ps-pause" id="stage-done">
          <SunBurst />
          <p className="ps-pause-title" id="done-title">
            {t("finishedTitle")}
          </p>
          <p className="ps-pause-next" id="done-body">
            {t("finishedBody", { name: playlist.name })}
          </p>
          <button type="button" className="ps-big" id="done-again" onClick={playAgain}>
            {t("playAgain")}
          </button>
          <button
            type="button"
            className="ps-big"
            data-tone="calm"
            id="done-home"
            onClick={onExit}
          >
            {t("backHome")}
          </button>
        </div>
      ) : null}

      <ConfirmDialog
        open={askStop}
        title={t("stopTitle")}
        body={t("stopBody")}
        cancelLabel={t("keepPlaying")}
        confirmLabel={t("quit")}
        onOpenChange={setAskStop}
        onConfirm={() => {
          setAskStop(false);
          onExit();
        }}
      />
    </div>
  );
}

/** The one bit of celebration in the app: a sun, not a score. */
function SunBurst() {
  return (
    <svg viewBox="0 0 96 96" width="88" height="88" aria-hidden="true" focusable="false">
      <g stroke="#4b3a26" strokeWidth="4" strokeLinecap="round">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <line key={deg} x1="48" y1="8" x2="48" y2="20" transform={`rotate(${deg} 48 48)`} />
        ))}
      </g>
      <circle cx="48" cy="48" r="22" fill="#ffcf5c" stroke="#4b3a26" strokeWidth="4" />
    </svg>
  );
}
