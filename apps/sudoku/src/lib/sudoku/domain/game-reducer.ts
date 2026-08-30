import type { CellIndex, Digit, Grid } from '@/lib/types';
import type { PuzzleDefinition } from '../data/puzzles.generated';
import { findConflicts, parseGrid } from './grid.ts';
import type { GameAction, GameSnapshot, GameState, Notes } from './game-state';
import { layoutForSize, type SudokuLayout } from './layout.ts';

function assertCellIndex(index: CellIndex, layout: SudokuLayout): void {
  if (!Number.isInteger(index) || index < 0 || index >= layout.cellCount) {
    throw new RangeError(`Cell index must be an integer from 0 to ${layout.cellCount - 1}.`);
  }
}

function freezeGrid(grid: Grid): Grid {
  return Object.freeze([...grid]);
}

function freezeNotes(notes: Notes): Notes {
  return Object.freeze(notes.map((cellNotes) => Object.freeze([...cellNotes])));
}

function createEmptyNotes(layout: SudokuLayout): Notes {
  return Object.freeze(
    Array.from({ length: layout.cellCount }, () => Object.freeze([] as Digit[])),
  );
}

function snapshot(state: GameState): GameSnapshot {
  return Object.freeze({ grid: state.grid, notes: state.notes });
}

function incorrectIndexes(grid: Grid, solution: ReadonlyArray<Digit>, answerCheck: boolean): ReadonlyArray<CellIndex> {
  if (!answerCheck) {
    return Object.freeze([] as CellIndex[]);
  }

  return Object.freeze(
    grid.flatMap((digit, index) => (digit !== null && digit !== solution[index] ? [index] : [])),
  );
}

export function isComplete(state: GameState): boolean {
  return state.grid.every((digit, index) => digit !== null && digit === state.solution[index]);
}

function withDerivedValues(
  state: GameState,
  grid: Grid,
  notes: Notes,
  past: ReadonlyArray<GameSnapshot>,
  future: ReadonlyArray<GameSnapshot>,
): GameState {
  const nextGrid = freezeGrid(grid);
  const nextNotes = freezeNotes(notes);

  return Object.freeze({
    ...state,
    grid: nextGrid,
    notes: nextNotes,
    conflicts: findConflicts(nextGrid, state.layout),
    incorrectIndexes: incorrectIndexes(nextGrid, state.solution, state.answerCheck),
    past: Object.freeze([...past]),
    future: Object.freeze([...future]),
    status: isComplete({ ...state, grid: nextGrid }) ? 'completed' : 'playing',
  });
}

function changeWithHistory(state: GameState, grid: Grid, notes: Notes): GameState {
  return withDerivedValues(state, grid, notes, [...state.past, snapshot(state)], []);
}

function updateNotes(notes: Notes, index: CellIndex, nextCellNotes: ReadonlyArray<Digit>): Notes {
  return notes.map((cellNotes, cellIndex) =>
    cellIndex === index ? Object.freeze([...nextCellNotes]) : cellNotes,
  );
}

function validateActionIndex(state: GameState, action: GameAction): void {
  switch (action.type) {
    case 'selectCell':
    case 'placeDigit':
    case 'eraseCell':
    case 'toggleNote':
      assertCellIndex(action.index, state.layout);
      break;
    case 'setNoteMode':
    case 'setAnswerCheck':
    case 'undo':
    case 'redo':
      break;
  }
}

export function createGame(puzzle: PuzzleDefinition): GameState {
  const layout = layoutForSize(puzzle.size ?? 9);
  const grid = parseGrid(puzzle.puzzle, layout);
  const solution = Object.freeze(
    parseGrid(puzzle.solution, layout).map((digit): Digit => {
      if (digit === null) {
        throw new Error('A Sudoku solution cannot contain empty cells.');
      }
      return digit;
    }),
  );
  const notes = createEmptyNotes(layout);

  return Object.freeze({
    puzzleId: puzzle.id,
    layout,
    solution,
    grid,
    givens: Object.freeze(grid.map((digit) => digit !== null)),
    notes,
    selectedIndex: null,
    noteMode: false,
    answerCheck: false,
    conflicts: findConflicts(grid, layout),
    incorrectIndexes: Object.freeze([] as CellIndex[]),
    past: Object.freeze([] as GameSnapshot[]),
    future: Object.freeze([] as GameSnapshot[]),
    status: 'playing',
    startedAt: Date.now(),
  });
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  validateActionIndex(state, action);

  switch (action.type) {
    case 'selectCell':
      return state.givens[action.index] || state.selectedIndex === action.index
        ? state
        : Object.freeze({ ...state, selectedIndex: action.index });

    case 'placeDigit': {
      if (!state.layout.digits.includes(action.digit)) {
        return state;
      }
      if (state.givens[action.index]) {
        return state;
      }

      const currentDigit = state.grid[action.index];
      const currentNotes = state.notes[action.index]!;
      if (currentDigit === action.digit && currentNotes.length === 0) {
        return state;
      }

      const grid = [...state.grid];
      grid[action.index] = action.digit;
      return changeWithHistory(state, grid, updateNotes(state.notes, action.index, []));
    }

    case 'eraseCell': {
      if (state.givens[action.index] || state.grid[action.index] === null) {
        return state;
      }

      const grid = [...state.grid];
      grid[action.index] = null;
      return changeWithHistory(state, grid, state.notes);
    }

    case 'toggleNote': {
      if (!state.layout.digits.includes(action.digit)) {
        return state;
      }
      if (state.givens[action.index] || state.grid[action.index] !== null) {
        return state;
      }

      const cellNotes = state.notes[action.index]!;
      const nextCellNotes = cellNotes.includes(action.digit)
        ? cellNotes.filter((digit) => digit !== action.digit)
        : [...cellNotes, action.digit].sort((left, right) => left - right);
      return changeWithHistory(state, state.grid, updateNotes(state.notes, action.index, nextCellNotes));
    }

    case 'setNoteMode':
      return state.noteMode === action.enabled ? state : Object.freeze({ ...state, noteMode: action.enabled });

    case 'setAnswerCheck':
      return state.answerCheck === action.enabled
        ? state
        : Object.freeze({
            ...state,
            answerCheck: action.enabled,
            incorrectIndexes: incorrectIndexes(state.grid, state.solution, action.enabled),
          });

    case 'undo': {
      const previous = state.past.at(-1);
      if (!previous) {
        return state;
      }

      return withDerivedValues(
        state,
        previous.grid,
        previous.notes,
        state.past.slice(0, -1),
        [...state.future, snapshot(state)],
      );
    }

    case 'redo': {
      const next = state.future.at(-1);
      if (!next) {
        return state;
      }

      return withDerivedValues(
        state,
        next.grid,
        next.notes,
        [...state.past, snapshot(state)],
        state.future.slice(0, -1),
      );
    }
  }
}
