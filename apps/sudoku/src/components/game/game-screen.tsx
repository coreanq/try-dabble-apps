import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { useNavigate } from '@tanstack/react-router';

import { t } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n/locales';
import { useBackgroundMusic } from '@/lib/feedback/use-background-music';
import { useAudioFeedback } from '@/lib/feedback/use-audio-feedback';
import { useHapticFeedback } from '@/lib/feedback/use-haptic-feedback';
import type { GameEffect } from '@/lib/feedback/feedback-events';
import type { CellIndex, Digit } from '@/lib/types';
import { useWindowSize } from '@/lib/use-window-size';
import { cn } from '@/lib/utils';

import { BoardCanvas } from '@/components/board3d/board-canvas';
import {
  calculateBoardViewport,
  nearestBoardScrollOffset,
  nextBoardScrollOffset,
  projectedCellHorizontalBounds,
  type BoardScrollDirection,
} from '@/lib/board3d/board-layout';
import { PUZZLES, type PuzzleDefinition } from '@/lib/sudoku/data/puzzles.generated';
import { gameReducer } from '@/lib/sudoku/domain/game-reducer';
import type { GameAction, GameState } from '@/lib/sudoku/domain/game-state';
import type { BoardSize } from '@/lib/sudoku/domain/layout';
import { generatePuzzle } from '@/lib/sudoku/domain/puzzle-generator';
import type { Difficulty } from '@/lib/sudoku/domain/rating';
import { AccessibleBoard } from '@/components/game/accessible-board';
import { DifficultyDialog } from '@/components/game/difficulty-dialog';
import { DigitControls } from '@/components/game/digit-controls';
import { GameAnnouncer } from '@/components/game/game-announcer';
import { GameDialog } from '@/components/game/game-dialog';
import { GameHeader } from '@/components/game/game-header';
import { GameToolbar } from '@/components/game/game-toolbar';
import { HelpDialog } from '@/components/game/help-dialog';
import { PuzzleGenerationDialog } from '@/components/game/puzzle-generation-dialog';
import { SettingsDialog, type GameSettings } from '@/components/game/settings-dialog';
import {
  actionForDigit,
  createSessionGame,
  cellAccessibilityLabel,
  feedbackEffectsForTransition,
  INITIAL_GAME_ANNOUNCEMENT,
  nextGameAnnouncement,
  type BoardKeyboardCommand,
  type GameAnnouncement,
} from '@/lib/game/game-view-model';
import { webSafeAreaPadding } from '@/lib/game/game-safe-area';
import { woodGradient } from '@/lib/game/game-theme';

interface GameScreenProps {
  readonly locale: Locale;
}

type GameCommand = GameAction | {
  readonly type: 'loadPuzzle';
  readonly answerCheck: boolean;
  readonly puzzle: PuzzleDefinition;
};

const INITIAL_SETTINGS: GameSettings = Object.freeze({
  answerCheck: false,
  haptics: true,
  music: true,
  musicVolume: 20,
  reducedMotion: false,
  sound: true,
  soundVolume: 80,
});

const subscribeToHydration = () => () => undefined;

function gameScreenReducer(state: GameState, command: GameCommand): GameState {
  return command.type === 'loadPuzzle'
    ? createSessionGame(command.puzzle, command.answerCheck)
    : gameReducer(state, command);
}

function placedAnnouncement(locale: Locale, digit: Digit): string {
  return t(locale, 'announcementPlaced').replace('{digit}', String(digit));
}

export function GameScreen({ locale }: GameScreenProps) {
  const navigate = useNavigate();
  const windowDimensions = useWindowSize();
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const { height, width } = hydrated ? windowDimensions : { height: 0, width: 0 };
  const [state, dispatch] = useReducer(
    gameScreenReducer,
    PUZZLES[0]!,
    (puzzle) => createSessionGame(puzzle, false),
  );
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [settings, setSettings] = useState<GameSettings>(INITIAL_SETTINGS);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [started, setStarted] = useState(false);
  const [announcement, setAnnouncement] = useState<GameAnnouncement>(INITIAL_GAME_ANNOUNCEMENT);
  const [difficultyVisible, setDifficultyVisible] = useState(true);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [completionVisible, setCompletionVisible] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationAttempt, setGenerationAttempt] = useState(1);
  const [generationError, setGenerationError] = useState(false);
  const previousStatus = useRef(state.status);
  const boardScrollRef = useRef<HTMLDivElement>(null);
  const boardScrollOffset = useRef(0);
  const generationRequestRef = useRef(0);
  const seenPuzzlesRef = useRef(new Set<string>());
  const startBackgroundMusic = useBackgroundMusic(settings.music, settings.musicVolume);
  const playAudio = useAudioFeedback(settings.sound, settings.soundVolume);
  const playHaptic = useHapticFeedback(settings.haptics);
  const digitCounts = useMemo(() => state.grid.reduce<number[]>((counts, digit) => {
    if (digit !== null) {
      counts[digit] = (counts[digit] ?? 0) + 1;
    }
    return counts;
  }, Array.from({ length: 10 }, () => 0)), [state.grid]);
  const boardLayout = useMemo(() => calculateBoardViewport(width, height), [height, width]);
  const isWide = boardLayout.isWide;
  const anyDialogVisible = difficultyVisible
    || settingsVisible
    || helpVisible
    || completionVisible
    || generating;

  const scrollBoard = useCallback((direction: BoardScrollDirection) => {
    const nextOffset = nextBoardScrollOffset(boardScrollOffset.current, direction, boardLayout);
    boardScrollOffset.current = nextOffset;
    boardScrollRef.current?.scrollTo({ behavior: 'smooth', left: nextOffset });
  }, [boardLayout]);

  const revealBoardCell = useCallback((index: CellIndex) => {
    const bounds = projectedCellHorizontalBounds(index, boardLayout, state.layout.size);
    const nextOffset = nearestBoardScrollOffset(
      boardScrollOffset.current,
      bounds,
      boardLayout,
    );
    if (nextOffset === boardScrollOffset.current) {
      return;
    }

    boardScrollOffset.current = nextOffset;
    boardScrollRef.current?.scrollTo({ behavior: 'smooth', left: nextOffset });
  }, [boardLayout, state.layout.size]);

  const announce = useCallback((message: string) => {
    setAnnouncement((current) => nextGameAnnouncement(current, message));
  }, []);

  const emitFeedback = useCallback((effect: GameEffect) => {
    playAudio(effect);
    playHaptic(effect);
  }, [playAudio, playHaptic]);

  const applyGameAction = useCallback((action: GameAction) => {
    const next = gameReducer(state, action);
    if (next === state) {
      return;
    }

    dispatch(action);
    const feedbackEffects = feedbackEffectsForTransition(state, next, action);
    feedbackEffects.forEach(emitFeedback);
    switch (action.type) {
      case 'placeDigit':
        announce(feedbackEffects.includes('invalid')
          ? t(locale, 'announcementInvalid')
          : placedAnnouncement(locale, action.digit));
        break;
      case 'toggleNote':
      case 'eraseCell':
      case 'undo':
        if (next.selectedIndex !== null) {
          announce(cellAccessibilityLabel(locale, next, next.selectedIndex));
        }
        break;
      case 'redo':
        if (feedbackEffects.includes('invalid')) {
          announce(t(locale, 'announcementInvalid'));
        } else if (next.selectedIndex !== null) {
          announce(cellAccessibilityLabel(locale, next, next.selectedIndex));
        }
        break;
      case 'selectCell':
        announce(cellAccessibilityLabel(locale, next, action.index));
        break;
      case 'setAnswerCheck':
        if (feedbackEffects.includes('invalid')) {
          announce(t(locale, 'announcementInvalid'));
        }
        break;
      case 'setNoteMode':
        announce(t(locale, action.enabled ? 'notesOn' : 'notesOff'));
        break;
    }
  }, [announce, emitFeedback, locale, state]);

  const selectCell = useCallback((index: CellIndex) => {
    applyGameAction({ type: 'selectCell', index });
  }, [applyGameAction]);

  const enterDigit = useCallback((digit: Digit) => {
    const action = actionForDigit(state, digit);
    if (action) {
      applyGameAction(action);
    }
  }, [applyGameAction, state]);

  const dropDigit = useCallback((index: CellIndex, digit: Digit) => {
    if (state.givens[index]) {
      announce(cellAccessibilityLabel(locale, state, index));
      return;
    }
    if (state.selectedIndex !== index) {
      dispatch({ type: 'selectCell', index });
    }
    applyGameAction(state.noteMode
      ? { type: 'toggleNote', index, digit }
      : { type: 'placeDigit', index, digit });
  }, [announce, applyGameAction, locale, state]);

  const eraseSelected = useCallback(() => {
    if (state.selectedIndex !== null) {
      applyGameAction({ type: 'eraseCell', index: state.selectedIndex });
    }
  }, [applyGameAction, state.selectedIndex]);

  const startGeneratedGame = useCallback(async (
    size: BoardSize,
    nextDifficulty: Difficulty,
  ) => {
    const requestId = ++generationRequestRef.current;
    setDifficultyVisible(false);
    setCompletionVisible(false);
    setGenerationError(false);
    setGenerationAttempt(1);
    setGenerating(true);

    try {
      const puzzle = await generatePuzzle({
        difficulty: nextDifficulty,
        onProgress: (attempt) => {
          if (generationRequestRef.current === requestId) setGenerationAttempt(attempt);
        },
        seenPuzzles: seenPuzzlesRef.current,
        shouldCancel: () => generationRequestRef.current !== requestId,
        size,
      });
      if (puzzle === null || generationRequestRef.current !== requestId) return;
      seenPuzzlesRef.current.add(puzzle.puzzle);
      dispatch({ type: 'loadPuzzle', answerCheck: settings.answerCheck, puzzle });
      setDifficulty(nextDifficulty);
      setElapsedSeconds(0);
      setStarted(true);
      // Native could ask for a track whatever the setting said — the three
      // tracks were bundled. On the web loading one costs ~2.9MB over the
      // wire, so a player with background music off must never trigger it.
      if (settings.music) {
        startBackgroundMusic();
      }
      emitFeedback('newGame');
    } catch {
      if (generationRequestRef.current === requestId) {
        setGenerationError(true);
        setDifficultyVisible(true);
      }
    } finally {
      if (generationRequestRef.current === requestId) setGenerating(false);
    }
  }, [emitFeedback, settings.answerCheck, settings.music, startBackgroundMusic]);

  const chooseDifficulty = useCallback((size: BoardSize, nextDifficulty: Difficulty) => {
    void startGeneratedGame(size, nextDifficulty);
  }, [startGeneratedGame]);

  const nextPuzzle = useCallback(() => {
    void startGeneratedGame(state.layout.size, difficulty);
  }, [difficulty, startGeneratedGame, state.layout.size]);

  const changeSettings = useCallback((next: GameSettings) => {
    if (next.answerCheck !== settings.answerCheck) {
      applyGameAction({ type: 'setAnswerCheck', enabled: next.answerCheck });
    }
    // Native resumed the track it had already loaded; here the first track is
    // fetched at the moment the setting is switched on, so switching it on has
    // to ask for one.
    if (next.music && !settings.music && started) {
      startBackgroundMusic();
    }
    setSettings(next);
  }, [applyGameAction, settings.answerCheck, settings.music, startBackgroundMusic, started]);

  const changeLocale = useCallback((nextLocale: Locale) => {
    setSettingsVisible(false);
    void navigate({ to: '/', search: { lang: nextLocale }, replace: true });
  }, [navigate]);

  const handleBoardKeyboardCommand = useCallback((command: BoardKeyboardCommand) => {
    switch (command.type) {
      case 'selectCell':
        revealBoardCell(command.index);
        selectCell(command.index);
        break;
      case 'digit':
        enterDigit(command.digit);
        break;
      case 'erase':
        eraseSelected();
        break;
      case 'toggleNote':
        applyGameAction({ type: 'setNoteMode', enabled: !state.noteMode });
        break;
      case 'undo':
      case 'redo':
        applyGameAction({ type: command.type });
        break;
    }
  }, [applyGameAction, enterDigit, eraseSelected, revealBoardCell, selectCell, state.noteMode]);

  useEffect(() => {
    return () => {
      generationRequestRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (!started || state.status !== 'playing') {
      return;
    }
    const timer = setInterval(() => setElapsedSeconds((seconds) => seconds + 1), 1000);
    return () => clearInterval(timer);
  }, [started, state.status]);

  useEffect(() => {
    boardScrollOffset.current = 0;
    boardScrollRef.current?.scrollTo({ behavior: 'auto', left: 0 });
  }, [boardLayout.frameSize, boardLayout.viewportWidth]);

  useEffect(() => {
    if (previousStatus.current === 'playing' && state.status === 'completed') {
      emitFeedback('complete');
      announce(t(locale, 'announcementComplete'));
      setCompletionVisible(true);
    }
    previousStatus.current = state.status;
  }, [announce, emitFeedback, locale, state.status]);

  return (
    <div className="flex flex-1 flex-col items-center overflow-y-auto" style={webSafeAreaPadding(12)}>
      <div className="flex w-full max-w-[1400px] flex-col gap-[18px]">
        <GameHeader
          difficulty={difficulty}
          elapsedSeconds={elapsedSeconds}
          locale={locale}
          onHelp={() => setHelpVisible(true)}
          onNewGame={() => setDifficultyVisible(true)}
          onSettings={() => setSettingsVisible(true)}
        />

        <div
          className={cn(
            'flex flex-col items-center gap-[18px]',
            isWide && 'flex-row items-start justify-center',
          )}
        >
          <div
            className="relative flex shrink-0 flex-col items-center"
            style={{ width: boardLayout.viewportWidth }}
          >
            <div
              aria-label={t(locale, 'boardAccessibilityLabel')}
              className="max-w-full shrink-0 grow-0 overflow-x-auto overflow-y-hidden"
              onScroll={(event) => {
                boardScrollOffset.current = event.currentTarget.scrollLeft;
              }}
              ref={boardScrollRef}
              role="group"
              style={{
                height: boardLayout.frameSize,
                width: boardLayout.viewportWidth,
              }}
            >
              <div
                className="flex h-full items-center justify-center"
                style={{ minWidth: boardLayout.frameSize }}
              >
                <div
                  className={cn(
                    'relative flex shrink-0 overflow-hidden rounded-[1.375rem]',
                    'border-[6px] border-walnut-dark bg-canvas',
                    'shadow-[0_18px_44px_rgba(45,26,18,0.34),inset_0_0_0_1px_var(--color-walnut-light)]',
                  )}
                  style={{ height: boardLayout.frameSize, width: boardLayout.frameSize }}
                >
                  <BoardCanvas
                    onDropDigit={dropDigit}
                    onPhysicsCollision={(impact) => playAudio('collision', impact)}
                    onPickDigit={() => emitFeedback('pick')}
                    onSelectCell={selectCell}
                    reducedMotion={settings.reducedMotion}
                    errorMessage={t(locale, 'boardUnavailable')}
                    retryLabel={t(locale, 'retry')}
                    state={state}
                  />
                </div>
              </div>
            </div>

            <AccessibleBoard
              active={started && !anyDialogVisible}
              locale={locale}
              onFocusCell={revealBoardCell}
              onKeyboardCommand={handleBoardKeyboardCommand}
              onSelectCell={selectCell}
              state={state}
            />

            {boardLayout.horizontalOverflow ? (
              <div className="mt-2.5 flex flex-row items-center gap-2 self-center rounded-[1.0625rem] border border-walnut/35 bg-panel p-1 shadow-[0_5px_14px_rgba(45,26,18,0.2),inset_0_1px_0_rgba(255,255,255,0.65)]">
                <button
                  aria-label={t(locale, 'boardScrollLeft')}
                  className="relative flex min-h-11 min-w-[58px] items-center justify-center rounded-[0.8125rem] border border-walnut/35 bg-cream outline-none focus-visible:ring-3 focus-visible:ring-ring/40 active:translate-y-px active:opacity-75 after:absolute after:-inset-1.5 after:content-['']"
                  onClick={() => scrollBoard('left')}
                  type="button"
                >
                  <span className="font-display text-[31px] leading-[34px] font-bold text-walnut">
                    ‹
                  </span>
                </button>
                <span aria-hidden="true" className="h-[3px] w-[30px] rounded-sm bg-walnut/45" />
                <button
                  aria-label={t(locale, 'boardScrollRight')}
                  className="relative flex min-h-11 min-w-[58px] items-center justify-center rounded-[0.8125rem] border border-walnut/35 bg-cream outline-none focus-visible:ring-3 focus-visible:ring-ring/40 active:translate-y-px active:opacity-75 after:absolute after:-inset-1.5 after:content-['']"
                  onClick={() => scrollBoard('right')}
                  type="button"
                >
                  <span className="font-display text-[31px] leading-[34px] font-bold text-walnut">
                    ›
                  </span>
                </button>
              </div>
            ) : null}
          </div>

          <div
            className={cn(
              'flex flex-col gap-3.5 rounded-[1.375rem] border-2 border-walnut-dark p-4',
              'shadow-[0_14px_32px_rgba(45,26,18,0.3),inset_0_1px_0_rgba(255,255,255,0.16)]',
              isWide ? 'w-[300px] shrink-0' : 'w-full max-w-[720px]',
            )}
            style={{ backgroundImage: woodGradient }}
          >
            <div className="flex flex-row items-center gap-[9px]">
              <span aria-hidden="true" className="size-2 rounded border border-walnut-light bg-brass" />
              <span className="flex-1 rounded-lg bg-cream/90 px-[7px] py-[3px] text-center text-xs leading-[17px] font-semibold text-ink">
                {t(locale, 'dragHint')}
              </span>
              <span aria-hidden="true" className="size-2 rounded border border-walnut-light bg-brass" />
            </div>
            <DigitControls
              counts={digitCounts}
              dense={!isWide && width >= 620}
              layout={state.layout}
              locale={locale}
              onDigit={enterDigit}
            />
            <div className="h-px bg-brass/35" />
            <GameToolbar
              canRedo={state.future.length > 0}
              canUndo={state.past.length > 0}
              locale={locale}
              noteMode={state.noteMode}
              onErase={eraseSelected}
              onRedo={() => applyGameAction({ type: 'redo' })}
              onToggleNote={() => applyGameAction({
                type: 'setNoteMode',
                enabled: !state.noteMode,
              })}
              onUndo={() => applyGameAction({ type: 'undo' })}
            />
          </div>
        </div>
      </div>

      <GameAnnouncer announcement={announcement} />
      <DifficultyDialog
        allowClose={started}
        errorMessage={generationError ? t(locale, 'puzzleGenerationError') : null}
        initialSize={state.layout.size}
        locale={locale}
        onClose={() => {
          setGenerationError(false);
          setDifficultyVisible(false);
        }}
        onSelect={chooseDifficulty}
        visible={hydrated && difficultyVisible}
      />
      <PuzzleGenerationDialog
        attempt={generationAttempt}
        locale={locale}
        visible={generating}
      />
      <SettingsDialog
        locale={locale}
        onChange={changeSettings}
        onClose={() => setSettingsVisible(false)}
        onLocaleChange={changeLocale}
        settings={settings}
        visible={settingsVisible}
      />
      <HelpDialog
        locale={locale}
        onClose={() => setHelpVisible(false)}
        visible={helpVisible}
      />
      <GameDialog
        allowClose={false}
        locale={locale}
        onClose={() => undefined}
        title={t(locale, 'gameCompleteTitle')}
        visible={completionVisible}
      >
        <p className="self-center font-display text-[52px] leading-none font-bold text-walnut">✓</p>
        <p className="text-center font-display text-[20px] leading-[30px] text-ink">
          {t(locale, 'gameCompleteBody')}
        </p>
        <div className="flex flex-col gap-2.5">
          <button
            className="relative flex min-h-[50px] items-center justify-center rounded-[0.9375rem] bg-walnut px-[18px] text-[15px] font-extrabold text-cream outline-none focus-visible:ring-3 focus-visible:ring-ring/40 active:translate-y-px active:opacity-75 after:absolute after:-inset-1.5 after:content-['']"
            onClick={nextPuzzle}
            type="button"
          >
            {t(locale, 'nextPuzzle')}
          </button>
          <button
            className="relative flex min-h-[50px] items-center justify-center rounded-[0.9375rem] border border-walnut/35 px-[18px] text-[15px] font-bold text-ink outline-none focus-visible:ring-3 focus-visible:ring-ring/40 active:translate-y-px active:opacity-75 after:absolute after:-inset-1.5 after:content-['']"
            onClick={() => {
              setCompletionVisible(false);
              setDifficultyVisible(true);
            }}
            type="button"
          >
            {t(locale, 'chooseDifficulty')}
          </button>
        </div>
      </GameDialog>
    </div>
  );
}
