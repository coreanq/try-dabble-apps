import type { BoardSize } from '../domain/layout';
import type { Difficulty, DifficultyAnalysis } from '../domain/rating';

export interface PuzzleDefinition {
  readonly analysis?: DifficultyAnalysis;
  readonly difficulty: Difficulty;
  readonly id: string;
  readonly puzzle: string;
  readonly size?: BoardSize;
  readonly solution: string;
}
