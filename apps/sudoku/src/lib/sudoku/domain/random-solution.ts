import type { CellValue, Digit } from '@/lib/types';

import { candidatesFor } from './grid.ts';
import type { SudokuLayout } from './layout';

export type RandomSource = () => number;

function shuffled<T>(values: readonly T[], random: RandomSource): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other]!, result[index]!];
  }
  return result;
}

export function createRandomSolution(
  layout: SudokuLayout,
  random: RandomSource = Math.random,
): readonly Digit[] {
  const cells: CellValue[] = Array.from({ length: layout.cellCount }, () => null);

  function fill(): boolean {
    let minimum = Number.POSITIVE_INFINITY;
    let choices: { readonly candidates: readonly Digit[]; readonly index: number }[] = [];

    for (let index = 0; index < layout.cellCount; index += 1) {
      if (cells[index] !== null) continue;
      const candidates = [...candidatesFor(cells, index, layout)];
      if (candidates.length === 0) return false;
      if (candidates.length < minimum) {
        minimum = candidates.length;
        choices = [{ candidates, index }];
      } else if (candidates.length === minimum) {
        choices.push({ candidates, index });
      }
    }

    if (choices.length === 0) return true;
    const choice = choices[Math.floor(random() * choices.length)]!;
    for (const digit of shuffled(choice.candidates, random)) {
      cells[choice.index] = digit;
      if (fill()) return true;
    }
    cells[choice.index] = null;
    return false;
  }

  if (!fill()) throw new Error('Unable to create a complete Sudoku grid.');
  return Object.freeze(cells.map((digit) => digit as Digit));
}
