import type { CellIndex, CellValue, Digit, Grid } from '@/lib/types';
import { candidatesFor, findConflicts } from './grid.ts';
import { NINE_BY_NINE, type SudokuLayout } from './layout.ts';

type SolutionHandler = (solution: Grid) => void;

function search(
  grid: Grid,
  limit: number,
  layout: SudokuLayout,
  onSolution: SolutionHandler,
): void {
  if (limit <= 0 || findConflicts(grid, layout).size > 0) {
    return;
  }

  const work: CellValue[] = [...grid];
  let solutionCount = 0;

  function visit(): void {
    if (solutionCount >= limit) {
      return;
    }

    let bestIndex: CellIndex | null = null;
    let bestCandidates: ReadonlySet<Digit> | null = null;

    for (let index = 0; index < layout.cellCount; index += 1) {
      if (work[index] !== null) {
        continue;
      }

      const candidates = candidatesFor(work, index, layout);
      if (candidates.size === 0) {
        return;
      }

      if (bestCandidates === null || candidates.size < bestCandidates.size) {
        bestIndex = index;
        bestCandidates = candidates;
      }
    }

    if (bestIndex === null || bestCandidates === null) {
      solutionCount += 1;
      onSolution(work);
      return;
    }

    for (const digit of bestCandidates) {
      work[bestIndex] = digit;
      visit();

      if (solutionCount >= limit) {
        break;
      }
    }

    work[bestIndex] = null;
  }

  visit();
}

export function solve(grid: Grid, layout: SudokuLayout = NINE_BY_NINE): Grid | null {
  let first: Grid | null = null;
  search(grid, 1, layout, (solution) => {
    first = Object.freeze([...solution]);
  });
  return first;
}

export function countSolutions(
  grid: Grid,
  limit = 2,
  layout: SudokuLayout = NINE_BY_NINE,
): number {
  if (!Number.isFinite(limit) || !Number.isInteger(limit) || limit < 0) {
    throw new RangeError('Solution limit must be a finite non-negative integer.');
  }

  let count = 0;
  search(grid, limit, layout, () => {
    count += 1;
  });
  return count;
}
