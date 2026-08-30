import type { CellIndex, ConflictMap, Digit, Grid } from '@/lib/types';
import type { SudokuLayout } from './layout';

export type Notes = ReadonlyArray<ReadonlyArray<Digit>>;

export interface GameSnapshot {
  readonly grid: Grid;
  readonly notes: Notes;
}

export interface GameState {
  readonly puzzleId: string;
  readonly layout: SudokuLayout;
  readonly solution: ReadonlyArray<Digit>;
  readonly grid: Grid;
  readonly givens: ReadonlyArray<boolean>;
  readonly notes: Notes;
  readonly selectedIndex: CellIndex | null;
  readonly noteMode: boolean;
  readonly answerCheck: boolean;
  readonly conflicts: ConflictMap;
  readonly incorrectIndexes: ReadonlyArray<CellIndex>;
  readonly past: ReadonlyArray<GameSnapshot>;
  readonly future: ReadonlyArray<GameSnapshot>;
  readonly status: 'playing' | 'completed';
  readonly startedAt: number;
}

export type GameAction =
  | { readonly type: 'selectCell'; readonly index: CellIndex }
  | { readonly type: 'placeDigit'; readonly index: CellIndex; readonly digit: Digit }
  | { readonly type: 'eraseCell'; readonly index: CellIndex }
  | { readonly type: 'toggleNote'; readonly index: CellIndex; readonly digit: Digit }
  | { readonly type: 'setNoteMode'; readonly enabled: boolean }
  | { readonly type: 'setAnswerCheck'; readonly enabled: boolean }
  | { readonly type: 'undo' }
  | { readonly type: 'redo' };
