import type { CellIndex, CellValue, Digit, Grid } from '@/lib/types';
import { candidatesFor } from './grid.ts';

export type Difficulty = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert';

export interface DifficultyAnalysis {
  readonly singles: number;
  readonly hiddenSingles: number;
  readonly lockedEliminations: number;
  readonly pairEliminations: number;
  readonly searchNodes: number;
  readonly maxSearchDepth: number;
  readonly difficulty: Difficulty;
}

interface AnalysisMetrics {
  singles: number;
  hiddenSingles: number;
  lockedEliminations: number;
  pairEliminations: number;
  searchNodes: number;
  maxSearchDepth: number;
}

interface SolverState {
  readonly values: CellValue[];
  readonly masks: number[];
  contradiction: boolean;
}

const DIGITS: readonly Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const ROWS: readonly (readonly CellIndex[])[] = Array.from(
  { length: 9 },
  (_, row) => Array.from({ length: 9 }, (_, column) => row * 9 + column),
);
const COLUMNS: readonly (readonly CellIndex[])[] = Array.from(
  { length: 9 },
  (_, column) => Array.from({ length: 9 }, (_, row) => row * 9 + column),
);
const BOXES: readonly (readonly CellIndex[])[] = Array.from(
  { length: 9 },
  (_, box) => {
    const firstRow = Math.floor(box / 3) * 3;
    const firstColumn = (box % 3) * 3;
    return Array.from(
      { length: 9 },
      (_, offset) =>
        (firstRow + Math.floor(offset / 3)) * 9 + firstColumn + (offset % 3),
    );
  },
);
const UNITS = [...ROWS, ...COLUMNS, ...BOXES];
const PEERS: readonly (readonly CellIndex[])[] = Array.from(
  { length: 81 },
  (_, index) => {
    const row = Math.floor(index / 9);
    const column = index % 9;
    const box = Math.floor(row / 3) * 3 + Math.floor(column / 3);
    return [...new Set([...ROWS[row]!, ...COLUMNS[column]!, ...BOXES[box]!])].filter(
      (peer) => peer !== index,
    );
  },
);

function bitFor(digit: Digit): number {
  return 1 << (digit - 1);
}

function bitCount(mask: number): number {
  let count = 0;
  for (let remaining = mask; remaining !== 0; remaining &= remaining - 1) {
    count += 1;
  }
  return count;
}

function digitForSingle(mask: number): Digit {
  return (Math.log2(mask) + 1) as Digit;
}

function createState(grid: Grid): SolverState {
  const values = [...grid];
  const masks = values.map((value, index) => {
    if (value !== null) {
      return 0;
    }
    let mask = 0;
    for (const digit of candidatesFor(grid, index)) {
      mask |= bitFor(digit);
    }
    return mask;
  });

  return {
    values,
    masks,
    contradiction: masks.some((mask, index) => values[index] === null && mask === 0),
  };
}

function cloneState(state: SolverState): SolverState {
  return {
    values: [...state.values],
    masks: [...state.masks],
    contradiction: state.contradiction,
  };
}

function assign(state: SolverState, index: CellIndex, digit: Digit): void {
  if (state.values[index] !== null) {
    state.contradiction ||= state.values[index] !== digit;
    return;
  }

  const bit = bitFor(digit);
  if ((state.masks[index]! & bit) === 0) {
    state.contradiction = true;
    return;
  }

  state.values[index] = digit;
  state.masks[index] = 0;
  for (const peer of PEERS[index]!) {
    if (state.values[peer] !== null || (state.masks[peer]! & bit) === 0) {
      continue;
    }
    state.masks[peer] = state.masks[peer]! & ~bit;
    if (state.masks[peer] === 0) {
      state.contradiction = true;
    }
  }
}

function applyNakedSingles(state: SolverState): number {
  let placements = 0;
  for (let index = 0; index < 81 && !state.contradiction; index += 1) {
    const mask = state.masks[index]!;
    if (state.values[index] === null && bitCount(mask) === 1) {
      assign(state, index, digitForSingle(mask));
      placements += 1;
    }
  }
  return placements;
}

function applyHiddenSingles(state: SolverState): number {
  let placements = 0;
  for (const unit of UNITS) {
    for (const digit of DIGITS) {
      const bit = bitFor(digit);
      let candidate: CellIndex | null = null;
      let candidateCount = 0;
      for (const index of unit) {
        if (state.values[index] === null && (state.masks[index]! & bit) !== 0) {
          candidate = index;
          candidateCount += 1;
        }
      }
      if (candidateCount === 1 && candidate !== null) {
        assign(state, candidate, digit);
        placements += 1;
        if (state.contradiction) {
          return placements;
        }
      }
    }
  }
  return placements;
}

function removeCandidate(state: SolverState, index: CellIndex, bit: number): number {
  if (state.values[index] !== null || (state.masks[index]! & bit) === 0) {
    return 0;
  }
  state.masks[index] = state.masks[index]! & ~bit;
  if (state.masks[index] === 0) {
    state.contradiction = true;
  }
  return 1;
}

function applyLockedCandidates(state: SolverState): number {
  let eliminations = 0;

  for (let box = 0; box < 9; box += 1) {
    for (const digit of DIGITS) {
      const bit = bitFor(digit);
      const candidates = BOXES[box]!.filter(
        (index) => state.values[index] === null && (state.masks[index]! & bit) !== 0,
      );
      if (candidates.length < 2) {
        continue;
      }

      const row = Math.floor(candidates[0]! / 9);
      if (candidates.every((index) => Math.floor(index / 9) === row)) {
        for (const index of ROWS[row]!) {
          if (!BOXES[box]!.includes(index)) {
            eliminations += removeCandidate(state, index, bit);
          }
        }
      }

      const column = candidates[0]! % 9;
      if (candidates.every((index) => index % 9 === column)) {
        for (const index of COLUMNS[column]!) {
          if (!BOXES[box]!.includes(index)) {
            eliminations += removeCandidate(state, index, bit);
          }
        }
      }
    }
  }

  for (const unit of [...ROWS, ...COLUMNS]) {
    for (const digit of DIGITS) {
      const bit = bitFor(digit);
      const candidates = unit.filter(
        (index) => state.values[index] === null && (state.masks[index]! & bit) !== 0,
      );
      if (candidates.length < 2) {
        continue;
      }
      const box =
        Math.floor(Math.floor(candidates[0]! / 9) / 3) * 3 +
        Math.floor((candidates[0]! % 9) / 3);
      if (
        candidates.every(
          (index) =>
            Math.floor(Math.floor(index / 9) / 3) * 3 + Math.floor((index % 9) / 3) ===
            box,
        )
      ) {
        for (const index of BOXES[box]!) {
          if (!unit.includes(index)) {
            eliminations += removeCandidate(state, index, bit);
          }
        }
      }
    }
  }

  return eliminations;
}

function applyNakedPairs(state: SolverState): number {
  let eliminations = 0;
  for (const unit of UNITS) {
    const pairs = new Map<number, CellIndex[]>();
    for (const index of unit) {
      const mask = state.masks[index]!;
      if (state.values[index] === null && bitCount(mask) === 2) {
        const indexes = pairs.get(mask) ?? [];
        indexes.push(index);
        pairs.set(mask, indexes);
      }
    }

    for (const [mask, indexes] of pairs) {
      if (indexes.length !== 2) {
        continue;
      }
      for (const index of unit) {
        if (indexes.includes(index) || state.values[index] !== null) {
          continue;
        }
        const removed = state.masks[index]! & mask;
        if (removed === 0) {
          continue;
        }
        state.masks[index] = state.masks[index]! & ~mask;
        eliminations += bitCount(removed);
        if (state.masks[index] === 0) {
          state.contradiction = true;
        }
      }
    }
  }
  return eliminations;
}

function applyTechniques(
  state: SolverState,
  metrics?: Pick<
    AnalysisMetrics,
    'singles' | 'hiddenSingles' | 'lockedEliminations' | 'pairEliminations'
  >,
): void {
  let changed = true;
  while (changed && !state.contradiction) {
    const singles = applyNakedSingles(state);
    const hiddenSingles = applyHiddenSingles(state);
    const lockedEliminations = applyLockedCandidates(state);
    const pairEliminations = applyNakedPairs(state);
    changed = singles + hiddenSingles + lockedEliminations + pairEliminations > 0;

    if (metrics !== undefined) {
      metrics.singles += singles;
      metrics.hiddenSingles += hiddenSingles;
      metrics.lockedEliminations += lockedEliminations;
      metrics.pairEliminations += pairEliminations;
    }
  }
}

function isSolved(state: SolverState): boolean {
  return !state.contradiction && state.values.every((value) => value !== null);
}

function search(state: SolverState, depth: number, metrics: AnalysisMetrics): boolean {
  applyTechniques(state);
  if (isSolved(state)) {
    return true;
  }
  if (state.contradiction) {
    return false;
  }

  let bestIndex: CellIndex | null = null;
  let bestMask = 0;
  for (let index = 0; index < 81; index += 1) {
    if (state.values[index] !== null) {
      continue;
    }
    const mask = state.masks[index]!;
    if (bestIndex === null || bitCount(mask) < bitCount(bestMask)) {
      bestIndex = index;
      bestMask = mask;
    }
  }

  if (bestIndex === null || bestMask === 0) {
    return false;
  }

  for (const digit of DIGITS) {
    if ((bestMask & bitFor(digit)) === 0) {
      continue;
    }
    metrics.searchNodes += 1;
    metrics.maxSearchDepth = Math.max(metrics.maxSearchDepth, depth + 1);
    const branch = cloneState(state);
    assign(branch, bestIndex, digit);
    if (search(branch, depth + 1, metrics)) {
      return true;
    }
  }
  return false;
}

export function classifyDifficulty(analysis: AnalysisMetrics): Difficulty {
  if (analysis.maxSearchDepth >= 2 || analysis.searchNodes >= 80) return 'expert';
  if (analysis.maxSearchDepth === 1 || analysis.searchNodes >= 20) return 'hard';
  if (analysis.pairEliminations > 0 || analysis.lockedEliminations >= 4) return 'medium';
  if (analysis.hiddenSingles > 0 || analysis.lockedEliminations > 0) return 'easy';
  return 'beginner';
}

export function analyzeDifficulty(grid: Grid): DifficultyAnalysis {
  const state = createState(grid);
  const metrics: AnalysisMetrics = {
    singles: 0,
    hiddenSingles: 0,
    lockedEliminations: 0,
    pairEliminations: 0,
    searchNodes: 0,
    maxSearchDepth: 0,
  };

  applyTechniques(state, metrics);
  if (!isSolved(state) && !state.contradiction) {
    search(state, 0, metrics);
  }

  return { ...metrics, difficulty: classifyDifficulty(metrics) };
}
