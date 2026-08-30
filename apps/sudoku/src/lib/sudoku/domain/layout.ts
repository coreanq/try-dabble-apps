import type { Digit } from '@/lib/types';

export type BoardSize = 6 | 9;

export interface SudokuLayout {
  readonly boxColumns: number;
  readonly boxRows: number;
  readonly cellCount: number;
  readonly digits: readonly Digit[];
  readonly size: BoardSize;
}

function createLayout(size: BoardSize, boxRows: number, boxColumns: number): SudokuLayout {
  return Object.freeze({
    boxColumns,
    boxRows,
    cellCount: size * size,
    digits: Object.freeze(
      Array.from({ length: size }, (_, index) => (index + 1) as Digit),
    ),
    size,
  });
}

export const SIX_BY_SIX = createLayout(6, 2, 3);
export const NINE_BY_NINE = createLayout(9, 3, 3);

export function layoutForSize(size: BoardSize): SudokuLayout {
  return size === 6 ? SIX_BY_SIX : NINE_BY_NINE;
}
