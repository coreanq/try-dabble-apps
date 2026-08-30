/**
 * The six games, and nothing else. This list is fixed on purpose: the job is
 * "pick the ones you want and skip the rest", which only means anything if the
 * set is small enough to read in one look.
 *
 * Every game runs 60–90 seconds. The player shell owns the clock; a game only
 * has to keep handing out rounds until it is unmounted.
 */

import type { MsgKey } from "@/lib/i18n";

export type GameId = "pair" | "sequence" | "odd" | "add" | "sort" | "tap";

export interface GameDef {
  id: GameId;
  nameKey: MsgKey;
  howKey: MsgKey;
  /** Seconds on the clock. Always inside 60–90. */
  seconds: number;
  /** The block colour this game wears everywhere it appears. */
  tint: string;
}

export const GAMES: GameDef[] = [
  { id: "pair", nameKey: "gamePair", howKey: "gamePairHow", seconds: 90, tint: "#ffcf5c" },
  { id: "sequence", nameKey: "gameSequence", howKey: "gameSequenceHow", seconds: 75, tint: "#8fcfe8" },
  { id: "odd", nameKey: "gameOdd", howKey: "gameOddHow", seconds: 60, tint: "#9fdcc0" },
  { id: "add", nameKey: "gameAdd", howKey: "gameAddHow", seconds: 60, tint: "#ffb59d" },
  { id: "sort", nameKey: "gameSort", howKey: "gameSortHow", seconds: 75, tint: "#c9b3f0" },
  { id: "tap", nameKey: "gameTap", howKey: "gameTapHow", seconds: 60, tint: "#ffd36e" },
];

const BY_ID = new Map(GAMES.map((g) => [g.id, g]));

export function gameDef(id: GameId): GameDef {
  return BY_ID.get(id) ?? GAMES[0];
}

export function isGameId(value: unknown): value is GameId {
  return typeof value === "string" && BY_ID.has(value as GameId);
}

/** Rounded-up minutes for a whole queue, so a caregiver can plan around it. */
export function queueMinutes(ids: GameId[]): number {
  const secs = ids.reduce((sum, id) => sum + gameDef(id).seconds, 0);
  return Math.max(1, Math.round(secs / 60));
}

/* ------------------------------------------------------------- small tools */

export function randomInt(maxExclusive: number): number {
  return Math.floor(Math.random() * maxExclusive);
}

export function pick<T>(items: readonly T[]): T {
  return items[randomInt(items.length)];
}

export function shuffle<T>(items: T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Draw n distinct members of a list. */
export function sample<T>(items: readonly T[], n: number): T[] {
  return shuffle(items.slice()).slice(0, n);
}
