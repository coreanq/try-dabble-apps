import type { Locale } from '@/lib/i18n/locales';
import { t, type MessageKey } from '../i18n/index.ts';
import type { CellIndex, Digit } from '@/lib/types';

import type { PuzzleDefinition } from '../sudoku/data/puzzles.generated';
import { createGame, gameReducer } from '../sudoku/domain/game-reducer.ts';
import type { GameAction, GameState } from '@/lib/sudoku/domain/game-state';
import type { BoardSize } from '@/lib/sudoku/domain/layout';

/**
 * Subset of the GameEffect union that this view-model's transitions can produce.
 * The full union lands in Task 5 at src/lib/feedback/feedback-events.ts; kept local
 * here so this file has no dependency on a module that does not exist yet. The full
 * union is a superset of these values, so callers typed for it accept this too.
 */
type GameEffect = 'place' | 'invalid' | 'redo' | 'erase' | 'note' | 'undo';

export type CellMoveDirection = 'up' | 'down' | 'left' | 'right';

export type BoardKeyboardCommand =
  | { readonly type: 'selectCell'; readonly index: CellIndex }
  | { readonly type: 'digit'; readonly digit: Digit }
  | { readonly type: 'erase' }
  | { readonly type: 'toggleNote' }
  | { readonly type: 'undo' }
  | { readonly type: 'redo' };

export interface BoardKeyModifiers {
  readonly altKey?: boolean;
  readonly ctrlKey?: boolean;
  readonly metaKey?: boolean;
  readonly shiftKey?: boolean;
}

export interface GameAnnouncement {
  readonly message: string;
  readonly sequence: number;
}

export const INITIAL_GAME_ANNOUNCEMENT: GameAnnouncement = Object.freeze({
  message: '',
  sequence: 0,
});

function formatMessage(
  locale: Locale,
  key: MessageKey,
  values: Readonly<Record<string, string | number>>,
): string {
  return Object.entries(values).reduce(
    (message, [name, value]) => message.replaceAll(`{${name}}`, String(value)),
    t(locale, key),
  );
}

export function actionForDigit(state: GameState, digit: Digit): GameAction | null {
  const index = state.selectedIndex;
  if (index === null || state.givens[index] || !state.layout.digits.includes(digit)) {
    return null;
  }

  return state.noteMode
    ? { type: 'toggleNote', index, digit }
    : { type: 'placeDigit', index, digit };
}

export function createSessionGame(
  puzzle: PuzzleDefinition,
  answerCheck: boolean,
): GameState {
  const game = createGame(puzzle);
  const firstEditableIndex = game.givens.findIndex((given) => !given);
  const selected = firstEditableIndex === -1
    ? game
    : gameReducer(game, { type: 'selectCell', index: firstEditableIndex });
  return answerCheck
    ? gameReducer(selected, { type: 'setAnswerCheck', enabled: true })
    : selected;
}

export function cellAccessibilityLabel(
  locale: Locale,
  state: GameState,
  index: CellIndex,
): string {
  const row = Math.floor(index / state.layout.size) + 1;
  const column = (index % state.layout.size) + 1;
  const digit = state.grid[index] ?? null;
  const parts = [formatMessage(locale, 'cellPosition', { column, row })];

  if (digit === null) {
    parts.push(t(locale, 'cellBlank'));
    if (state.notes[index]!.length > 0) {
      parts.push(formatMessage(locale, 'cellNotes', { digits: state.notes[index]!.join(', ') }));
    }
  } else {
    parts.push(formatMessage(locale, state.givens[index] ? 'cellClue' : 'cellEntered', { digit }));
  }

  if (state.conflicts.has(index) || state.incorrectIndexes.includes(index)) {
    parts.push(t(locale, 'cellConflict'));
  }

  return parts.join(', ');
}

function isInvalidAt(state: GameState, index: CellIndex): boolean {
  return state.conflicts.has(index) || state.incorrectIndexes.includes(index);
}

export function didIntroduceInvalidValue(
  previous: GameState,
  next: GameState,
  index: CellIndex,
): boolean {
  return !isInvalidAt(previous, index) && isInvalidAt(next, index);
}

function didIntroduceAnyInvalidValue(previous: GameState, next: GameState): boolean {
  return next.grid.some((_, index) => didIntroduceInvalidValue(previous, next, index));
}

export function feedbackEffectsForTransition(
  previous: GameState,
  next: GameState,
  action: GameAction,
): readonly GameEffect[] {
  switch (action.type) {
    case 'placeDigit':
      return didIntroduceInvalidValue(previous, next, action.index)
        ? ['place', 'invalid']
        : ['place'];
    case 'redo':
      return didIntroduceAnyInvalidValue(previous, next)
        ? ['redo', 'invalid']
        : ['redo'];
    case 'setAnswerCheck':
      return didIntroduceAnyInvalidValue(previous, next) ? ['invalid'] : [];
    case 'eraseCell':
      return ['erase'];
    case 'toggleNote':
      return ['note'];
    case 'undo':
      return ['undo'];
    case 'selectCell':
    case 'setNoteMode':
      return [];
  }
}

export function moveSelectedCell(
  index: CellIndex | null,
  direction: CellMoveDirection,
  size: BoardSize = 9,
  givens?: readonly boolean[],
): CellIndex {
  if (index === null) {
    const firstEditableIndex = givens?.findIndex((given) => !given) ?? -1;
    return firstEditableIndex === -1 ? 0 : firstEditableIndex;
  }

  let candidate = index;
  while (true) {
    const row = Math.floor(candidate / size);
    const column = candidate % size;
    const next = direction === 'up'
      ? (row === 0 ? candidate : candidate - size)
      : direction === 'down'
        ? (row === size - 1 ? candidate : candidate + size)
        : direction === 'left'
          ? (column === 0 ? candidate : candidate - 1)
          : (column === size - 1 ? candidate : candidate + 1);

    if (next === candidate) {
      return index;
    }
    if (!givens?.[next]) {
      return next;
    }
    candidate = next;
  }
}

export function boardCommandForKey(
  focusedIndex: CellIndex,
  key: string,
  modifiers: BoardKeyModifiers = {},
  size: BoardSize = 9,
  givens?: readonly boolean[],
): BoardKeyboardCommand | null {
  const normalizedKey = key.toLowerCase();
  const primaryModifier = Boolean(modifiers.ctrlKey || modifiers.metaKey);

  if (!modifiers.altKey && primaryModifier && normalizedKey === 'z') {
    return { type: modifiers.shiftKey ? 'redo' : 'undo' };
  }
  if (!modifiers.altKey && primaryModifier && normalizedKey === 'y') {
    return { type: 'redo' };
  }
  if (modifiers.altKey || modifiers.ctrlKey || modifiers.metaKey) {
    return null;
  }

  const directions: Readonly<Record<string, CellMoveDirection | undefined>> = {
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowUp: 'up',
  };
  const direction = directions[key];
  if (direction) {
    return { type: 'selectCell', index: moveSelectedCell(focusedIndex, direction, size, givens) };
  }
  if (/^[1-9]$/.test(key) && Number(key) <= size) {
    return { type: 'digit', digit: Number(key) as Digit };
  }
  if (key === 'Backspace' || key === 'Delete') {
    return { type: 'erase' };
  }
  if (normalizedKey === 'm') {
    return { type: 'toggleNote' };
  }
  return null;
}

export function nextGameAnnouncement(
  current: GameAnnouncement,
  message: string,
): GameAnnouncement {
  return Object.freeze({ message, sequence: current.sequence + 1 });
}

export function gameAnnouncementPresentation(announcement: GameAnnouncement): Readonly<{
  domId: string;
  key: number;
  spokenMessage: string;
}> {
  return Object.freeze({
    domId: `game-announcement-${announcement.sequence}`,
    key: announcement.sequence,
    spokenMessage: announcement.message,
  });
}
