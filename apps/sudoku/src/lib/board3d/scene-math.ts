import type { CellIndex } from '@/lib/types';
import { NINE_BY_NINE, type SudokuLayout } from '../sudoku/domain/layout.ts';

export const BOARD_WORLD_SIZE = 9;
const BOARD_HALF_EXTENT = BOARD_WORLD_SIZE / 2;

export function cellWorldSize(layout: SudokuLayout = NINE_BY_NINE): number {
  return BOARD_WORLD_SIZE / layout.size;
}

export function cellToWorld(
  index: CellIndex,
  layout: SudokuLayout = NINE_BY_NINE,
): readonly [number, number, number] {
  const row = Math.floor(index / layout.size);
  const column = index % layout.size;
  const size = cellWorldSize(layout);

  return [
    -BOARD_HALF_EXTENT + size / 2 + column * size,
    0.18,
    -BOARD_HALF_EXTENT + size / 2 + row * size,
  ] as const;
}

export function worldToCell(
  x: number,
  z: number,
  layout: SudokuLayout = NINE_BY_NINE,
): CellIndex | null {
  if (!Number.isFinite(x) || !Number.isFinite(z)) {
    return null;
  }

  const size = cellWorldSize(layout);
  const column = Math.floor((x + BOARD_HALF_EXTENT) / size);
  const row = Math.floor((z + BOARD_HALF_EXTENT) / size);

  if (row < 0 || row >= layout.size || column < 0 || column >= layout.size) {
    return null;
  }

  return row * layout.size + column;
}
