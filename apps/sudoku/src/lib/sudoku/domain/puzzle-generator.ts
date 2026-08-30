import type { CellValue } from '@/lib/types';

import type { PuzzleDefinition } from '../data/puzzle-definition';
import type { BoardSize } from './layout';
import type { Difficulty } from './rating';
import { serializeGrid } from './grid.ts';
import { layoutForSize } from './layout.ts';
import { createRandomSolution, type RandomSource } from './random-solution.ts';
import { analyzeDifficulty } from './rating.ts';
import { countSolutions } from './solver.ts';

export interface PuzzleGenerationOptions {
  readonly difficulty: Difficulty;
  readonly onProgress?: (attempt: number) => void;
  readonly random?: RandomSource;
  readonly seenPuzzles?: ReadonlySet<string>;
  readonly shouldCancel?: () => boolean;
  readonly size: BoardSize;
  readonly yieldControl?: () => Promise<void>;
}

const CLUE_RANGES: Readonly<Record<Difficulty, readonly [number, number]>> = {
  beginner: [28, 35],
  easy: [23, 27],
  medium: [18, 22],
  hard: [13, 17],
  expert: [8, 12],
};

function defaultYieldControl(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function shuffledIndexes(cellCount: number, random: RandomSource): number[] {
  const indexes = Array.from({ length: cellCount }, (_, index) => index);
  for (let index = indexes.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [indexes[index], indexes[other]] = [indexes[other]!, indexes[index]!];
  }
  return indexes;
}

export async function generatePuzzle(
  options: PuzzleGenerationOptions,
): Promise<PuzzleDefinition | null> {
  const layout = layoutForSize(options.size);
  const random = options.random ?? Math.random;
  const yieldControl = options.yieldControl ?? defaultYieldControl;
  const [minimumClues, maximumClues] = CLUE_RANGES[options.difficulty];
  let attempt = 1;

  while (true) {
    options.onProgress?.(attempt);

    const solution = createRandomSolution(layout, random);
    const grid: CellValue[] = [...solution];
    let clues = grid.length;

    if (options.size === 9) {
      for (const index of shuffledIndexes(layout.cellCount, random)) {
        let matchingPuzzle: PuzzleDefinition | undefined;
        const value = grid[index]!;
        grid[index] = null;
        if (countSolutions(grid, 2, layout) === 1) {
          const analysis = analyzeDifficulty(grid);
          const puzzle = serializeGrid(grid);
          if (analysis.difficulty === options.difficulty && !options.seenPuzzles?.has(puzzle)) {
            matchingPuzzle = Object.freeze({
              analysis,
              difficulty: options.difficulty,
              id: `generated-9x9-${puzzle}`,
              puzzle,
              size: 9,
              solution: serializeGrid(solution),
            });
          }
        } else {
          grid[index] = value;
        }

        await yieldControl();
        if (options.shouldCancel?.()) {
          return null;
        }
        if (matchingPuzzle) {
          return matchingPuzzle;
        }
      }

      attempt += 1;
      continue;
    }

    const targetClues = minimumClues + Math.floor(random() * (maximumClues - minimumClues + 1));
    for (const index of shuffledIndexes(layout.cellCount, random)) {
      if (clues === targetClues) {
        break;
      }

      const value = grid[index]!;
      grid[index] = null;
      if (countSolutions(grid, 2, layout) === 1) {
        clues -= 1;
      } else {
        grid[index] = value;
      }

      await yieldControl();
      if (options.shouldCancel?.()) {
        return null;
      }
    }

    if (clues === targetClues) {
      const puzzle = serializeGrid(grid);
      if (!options.seenPuzzles?.has(puzzle)) {
        return {
          difficulty: options.difficulty,
          id: `generated-${options.size}x${options.size}-${puzzle}`,
          puzzle,
          size: 6,
          solution: serializeGrid(solution),
        };
      }
    }

    attempt += 1;
  }
}
