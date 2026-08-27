import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";

import { ControlBar } from "@/components/control-bar";
import { Goban } from "@/components/goban";
import { HowToCard } from "@/components/how-to-card";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { ModeDialog } from "@/components/mode-dialog";
import { ResultDialog } from "@/components/result-dialog";
import { SeoCopy } from "@/components/seo-copy";
import { Button } from "@/components/ui/button";
import {
  BOARD_SIZE,
  checkDraw,
  checkWin,
  cloneBoard,
  emptyBoard,
  getAIMove,
  winningLine,
  type Board,
  type Difficulty,
  type GameMode,
  type Move,
  type Outcome,
  type Player,
} from "@/lib/gomoku";
import {
  HTML_LANG,
  OG_IMAGE,
  OG_LOCALE,
  detectLang,
  isLang,
  rememberLang,
  translate,
  type Lang,
  type MsgKey,
} from "@/lib/i18n";
import {
  playDefeatSound,
  playStartSound,
  playStoneSound,
  playVictorySound,
} from "@/lib/sound";
import { rootRoute } from "@/routes/root";

interface HomeSearch {
  lang?: Lang;
}

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
  validateSearch: (search: Record<string, unknown>): HomeSearch =>
    isLang(search.lang) ? { lang: search.lang } : {},
});

const ORIGIN = "https://omok.try-dabble.com";
/** 2-player mode locks the board briefly so the next player can't be sniped. */
const PVP_LOCK_MS = 800;
const AI_DELAY_MS = 400;

interface Snapshot {
  board: Board;
  player: Player;
  lastMove: Move | null;
}

function setMetaContent(selector: string, value: string) {
  document.querySelectorAll<HTMLMetaElement>(selector).forEach((el) => {
    el.setAttribute("content", value);
  });
}

function Home() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  const lang = useMemo(() => detectLang(search.lang ?? null), [search.lang]);
  const t = useCallback(
    (key: MsgKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );

  const [board, setBoard] = useState<Board>(emptyBoard);
  const [currentPlayer, setCurrentPlayer] = useState<Player>("black");
  const [winner, setWinner] = useState<Outcome | null>(null);
  const [winLine, setWinLine] = useState<Move[] | null>(null);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [moveCount, setMoveCount] = useState(0);
  const [moveHistory, setMoveHistory] = useState<Snapshot[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [gameMode, setGameMode] = useState<GameMode>("ai");
  const [showModeSelect, setShowModeSelect] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [inputLocked, setInputLocked] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const lockTimer = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      if (lockTimer.current) window.clearTimeout(lockTimer.current);
    },
    [],
  );

  /* Keep ?lang= on the URL so a shared link and the Worker behind it agree
     with what the player is looking at. */
  useEffect(() => {
    if (search.lang !== lang) {
      void navigate({ search: () => ({ lang }), replace: true });
    }
  }, [lang, navigate, search.lang]);

  /* The Worker already localised the first HTML; this keeps the head correct
     after an in-page language change. */
  useEffect(() => {
    const shareUrl = `${ORIGIN}/?lang=${lang}`;
    document.documentElement.lang = HTML_LANG[lang];
    document.title = t("title");
    setMetaContent(
      'meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]',
      t("metaDescription"),
    );
    setMetaContent('meta[property="og:title"], meta[name="twitter:title"]', t("title"));
    setMetaContent(
      'meta[name="application-name"], meta[name="apple-mobile-web-app-title"]',
      t("title"),
    );
    setMetaContent('meta[property="og:url"]', shareUrl);
    setMetaContent('meta[property="og:image"], meta[name="twitter:image"]', OG_IMAGE[lang]);
    setMetaContent('meta[property="og:locale"]', OG_LOCALE[lang]);
    document
      .querySelector<HTMLLinkElement>('link[rel="canonical"]')
      ?.setAttribute("href", shareUrl);
  }, [lang, t]);

  const sound = useCallback(
    (play: () => void) => {
      if (soundEnabled) play();
    },
    [soundEnabled],
  );

  const clearBoard = useCallback(() => {
    if (lockTimer.current) window.clearTimeout(lockTimer.current);
    setBoard(emptyBoard());
    setCurrentPlayer("black");
    setWinner(null);
    setWinLine(null);
    setLastMove(null);
    setMoveCount(0);
    setMoveHistory([]);
    setIsThinking(false);
    setShowResult(false);
    setInputLocked(false);
  }, []);

  const makeMove = useCallback(
    (row: number, col: number) => {
      sound(() => playStoneSound(currentPlayer === "black"));

      setMoveHistory((prev) => [...prev, { board: cloneBoard(board), player: currentPlayer, lastMove }]);

      const nextBoard = cloneBoard(board);
      nextBoard[row][col] = currentPlayer;
      setBoard(nextBoard);
      setLastMove({ row, col });
      setMoveCount((prev) => prev + 1);

      if (checkWin(nextBoard, row, col)) {
        setWinner(currentPlayer);
        setWinLine(winningLine(nextBoard, row, col));
        setShowResult(true);
        const won = currentPlayer === "black";
        window.setTimeout(() => sound(won ? playVictorySound : playDefeatSound), 300);
      } else if (checkDraw(nextBoard)) {
        setWinner("draw");
        setShowResult(true);
      } else {
        setCurrentPlayer(currentPlayer === "black" ? "white" : "black");

        if (gameMode === "pvp") {
          setInputLocked(true);
          if (lockTimer.current) window.clearTimeout(lockTimer.current);
          lockTimer.current = window.setTimeout(() => setInputLocked(false), PVP_LOCK_MS);
        }
      }
    },
    [board, currentPlayer, gameMode, lastMove, sound],
  );

  /* White is the engine. It waits a beat so a move reads as a move, not a
     flicker, and the thinking flag drives the dots in the bar. */
  useEffect(() => {
    if (gameMode !== "ai" || currentPlayer !== "white" || winner || showModeSelect) return;

    setIsThinking(true);
    const timer = window.setTimeout(() => {
      const move = getAIMove(board, difficulty);
      if (move) makeMove(move.row, move.col);
      setIsThinking(false);
    }, AI_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [board, currentPlayer, difficulty, gameMode, makeMove, showModeSelect, winner]);

  const startGame = useCallback(
    (mode: GameMode) => {
      setGameMode(mode);
      setShowModeSelect(false);
      clearBoard();
      sound(playStartSound);
    },
    [clearBoard, sound],
  );

  const restart = useCallback(() => {
    clearBoard();
    sound(playStartSound);
  }, [clearBoard, sound]);

  const backToModeSelect = useCallback(() => {
    clearBoard();
    setShowModeSelect(true);
  }, [clearBoard]);

  /* Undo takes back the pair in AI mode — your move and its reply — and a
     single stone when two people are sharing the board. */
  const undoMove = useCallback(() => {
    if (moveHistory.length === 0 || winner || isThinking) return;

    const stepsBack = gameMode === "ai" && moveHistory.length >= 2 ? 2 : 1;
    const target = moveHistory[moveHistory.length - stepsBack];

    setBoard(target.board);
    setCurrentPlayer(target.player);
    setLastMove(target.lastMove);
    setMoveCount((prev) => prev - stepsBack);
    setMoveHistory((prev) => prev.slice(0, -stepsBack));
    setInputLocked(false);
    if (lockTimer.current) window.clearTimeout(lockTimer.current);
  }, [gameMode, isThinking, moveHistory, winner]);

  const onLangChange = useCallback(
    (next: Lang) => {
      rememberLang(next);
      void navigate({ search: () => ({ lang: next }), replace: true });
    },
    [navigate],
  );

  const boardLocked =
    winner !== null ||
    showModeSelect ||
    (gameMode === "ai" && currentPlayer !== "black") ||
    (gameMode === "pvp" && inputLocked);

  const turnKey: MsgKey = isThinking
    ? "thinking"
    : gameMode === "pvp"
      ? currentPlayer === "black" ? "blackTurnP1" : "whiteTurnP2"
      : currentPlayer === "black" ? "blackTurn" : "whiteTurn";

  const reviewLabel =
    winner === "draw"
      ? t("draw")
      : winner === "black"
        ? t("blackWinShort")
        : t("whiteWinShort");

  return (
    <div className="gb-shell">
      <LocalOnlyBanner text={t("localOnly")} />
      <Masthead
        title={t("title")}
        sub={t("titleSub")}
        langLabel={t("langLabel")}
        lang={lang}
        onLangChange={onLangChange}
      />

      <div className="gb-bar">
        <p className="gb-turn">
          <span className="gb-stone" data-color={currentPlayer} aria-hidden="true" />
          {t(turnKey)}
          {isThinking && (
            <span className="gb-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          )}
        </p>
        <p className="gb-tally">
          {t("moves")}
          <b>{moveCount}</b>
          <span aria-hidden="true">/ {BOARD_SIZE * BOARD_SIZE}</span>
        </p>
      </div>

      {winner && !showResult && (
        <div className="gb-review">
          <span>
            {reviewLabel} · {t("totalMoves", { n: moveCount })}
          </span>
          <Button size="sm" variant="destructive" onClick={() => setShowResult(true)}>
            {t("showResult")}
          </Button>
        </div>
      )}

      <Goban
        board={board}
        lastMove={lastMove}
        winLine={winLine}
        disabled={boardLocked}
        onPlay={(move) => makeMove(move.row, move.col)}
      />

      <ControlBar
        mode={gameMode}
        difficulty={difficulty}
        soundEnabled={soundEnabled}
        canUndo={moveHistory.length > 0 && !winner && !isThinking}
        t={t}
        onDifficulty={setDifficulty}
        onUndo={undoMove}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        onRestart={restart}
        onChangeMode={backToModeSelect}
      />

      <HowToCard t={t} />

      <p className="gb-footer">15 × 15 · {t("freeBadge")}</p>

      <SeoCopy />

      <ModeDialog open={showModeSelect} t={t} onPick={startGame} />
      <ResultDialog
        open={Boolean(winner) && showResult}
        outcome={winner}
        mode={gameMode}
        moveCount={moveCount}
        t={t}
        onReview={() => setShowResult(false)}
        onRestart={restart}
        onChangeMode={backToModeSelect}
      />
    </div>
  );
}
