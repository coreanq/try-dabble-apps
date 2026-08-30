import type { GameState } from '@/lib/sudoku/domain/game-state';
import type { CellIndex } from '@/lib/types';

export type BoardCellRole = 'empty' | 'given' | 'user-entry';

export function boardCellRole(state: GameState, index: CellIndex): BoardCellRole {
  if (state.givens[index]) {
    return 'given';
  }
  return state.grid[index] === null ? 'empty' : 'user-entry';
}
