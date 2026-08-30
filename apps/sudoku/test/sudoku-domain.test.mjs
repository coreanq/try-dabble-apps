import assert from "node:assert/strict";
import test from "node:test";

import { candidatesFor, findConflicts, parseGrid, serializeGrid } from "../src/lib/sudoku/domain/grid.ts";
import { NINE_BY_NINE, SIX_BY_SIX } from "../src/lib/sudoku/domain/layout.ts";
import { countSolutions, solve } from "../src/lib/sudoku/domain/solver.ts";
import { analyzeDifficulty } from "../src/lib/sudoku/domain/rating.ts";
import { createRandomSolution } from "../src/lib/sudoku/domain/random-solution.ts";
import { generatePuzzle } from "../src/lib/sudoku/domain/puzzle-generator.ts";
import { createGame, gameReducer, isComplete } from "../src/lib/sudoku/domain/game-reducer.ts";
import { seededRandom } from "../src/lib/sudoku/domain/seeded-random.ts";
import { PUZZLES } from "../src/lib/sudoku/data/puzzles.generated.ts";
import { PUZZLES_6X6 } from "../src/lib/sudoku/data/puzzles-6x6.ts";

// ---------------------------------------------------------------------------
// grid — from domain/grid.test.ts
// ---------------------------------------------------------------------------

const GRID_PUZZLE =
  "530070000600195000098000060800060003400803001700020006060000280000419005000080079";

test("grid — round-trips an 81-cell puzzle", () => {
  assert.equal(serializeGrid(parseGrid(GRID_PUZZLE)), GRID_PUZZLE);
});

test("grid — rejects malformed puzzle strings", () => {
  assert.throws(() => parseGrid("123"), /81 cells/);
  assert.throws(() => parseGrid(GRID_PUZZLE.replace("5", "x")), /digits 0-9/);
});

test("grid — returns candidates and all conflicting peers", () => {
  const grid = [...parseGrid(GRID_PUZZLE)];
  grid[2] = 5;
  assert.deepEqual(candidatesFor(parseGrid(GRID_PUZZLE), 2), new Set([1, 2, 4]));
  assert.ok(findConflicts(grid).get(0).has(2));
  assert.ok(findConflicts(grid).get(2).has(0));
});

test("grid — exposes conflicts through runtime-immutable map and set lookups", () => {
  const grid = [...parseGrid(GRID_PUZZLE)];
  grid[2] = 5;
  const conflicts = findConflicts(grid);
  const peers = conflicts.get(0);

  assert.equal(conflicts.has(0), true);
  assert.equal(conflicts.get(0), peers);
  assert.ok([...conflicts].some(([index, peerSet]) => index === 0 && peerSet === peers));
  assert.equal(peers.has(2), true);
  assert.equal("set" in conflicts, false);
  assert.equal("add" in peers, false);
  assert.throws(() => conflicts.set(0, new Set([80])), TypeError);
  assert.throws(() => peers.add(80), TypeError);
  assert.equal(conflicts.get(0).has(2), true);
  assert.equal(conflicts.get(0).has(80), false);
});

test("grid — rejects invalid cell indexes", () => {
  const grid = parseGrid(GRID_PUZZLE);

  assert.throws(() => candidatesFor(grid, -1), /0 to 80/);
  assert.throws(() => candidatesFor(grid, 81), /0 to 80/);
  assert.throws(() => candidatesFor(grid, 1.5), /integer/);
});

test("grid — supports 36-cell grids with digits 1-6", () => {
  const puzzle = "003456456123234561561234345612612345";
  const grid = parseGrid(puzzle, SIX_BY_SIX);

  assert.equal(serializeGrid(grid), puzzle);
  assert.deepEqual(candidatesFor(grid, 0, SIX_BY_SIX), new Set([1]));
  assert.throws(() => parseGrid(puzzle.replace("6", "7"), SIX_BY_SIX), /digits 0-6/);
  assert.throws(() => parseGrid("0".repeat(35), SIX_BY_SIX), /36 cells/);
  assert.throws(() => candidatesFor(grid, 36, SIX_BY_SIX), /0 to 35/);
});

test("grid — detects conflicts inside a 2-row by 3-column box", () => {
  const grid = [...parseGrid("0".repeat(36), SIX_BY_SIX)];
  grid[0] = 4;
  grid[8] = 4;

  const conflicts = findConflicts(grid, SIX_BY_SIX);

  assert.ok(conflicts.get(0).has(8));
  assert.ok(conflicts.get(8).has(0));
});

// ---------------------------------------------------------------------------
// solver — from domain/solver.test.ts
// ---------------------------------------------------------------------------

const SOLVER_PUZZLE =
  "530070000600195000098000060800060003400803001700020006060000280000419005000080079";
const SOLVER_SOLUTION =
  "534678912672195348198342567859761423426853791713924856961537284287419635345286179";
const SOLVER_SIX_BY_SIX_PUZZLE = "023456456123234561561234345612612345";
const SOLVER_SIX_BY_SIX_SOLUTION = "123456456123234561561234345612612345";

test("solver — solves a valid puzzle without mutating it", () => {
  const grid = parseGrid(SOLVER_PUZZLE);
  assert.equal(serializeGrid(solve(grid)), SOLVER_SOLUTION);
  assert.equal(serializeGrid(grid), SOLVER_PUZZLE);
});

test("solver — counts up to the requested limit", () => {
  assert.equal(countSolutions(parseGrid(SOLVER_PUZZLE)), 1);
  assert.equal(countSolutions(parseGrid("0".repeat(81)), 2), 2);
  assert.equal(countSolutions(parseGrid(SOLVER_PUZZLE), 0), 0);
});

test("solver — rejects invalid solution limits", () => {
  const grid = parseGrid(SOLVER_PUZZLE);

  assert.throws(() => countSolutions(grid, -1), RangeError);
  assert.throws(() => countSolutions(grid, 1.5), RangeError);
  assert.throws(() => countSolutions(grid, Number.NaN), RangeError);
  assert.throws(() => countSolutions(grid, Number.POSITIVE_INFINITY), RangeError);
});

test("solver — solves and uniquely counts a 6x6 puzzle", () => {
  const grid = parseGrid(SOLVER_SIX_BY_SIX_PUZZLE, SIX_BY_SIX);

  assert.equal(serializeGrid(solve(grid, SIX_BY_SIX)), SOLVER_SIX_BY_SIX_SOLUTION);
  assert.equal(countSolutions(grid, 2, SIX_BY_SIX), 1);
});

// ---------------------------------------------------------------------------
// puzzle-generator — from domain/puzzle-generator.test.ts
// ---------------------------------------------------------------------------

const PUZZLE_GEN_SIX_BY_SIX_CASES = [
  ["beginner", 0x6001, 28, 35],
  ["easy", 0x6002, 23, 27],
  ["medium", 0x6003, 18, 22],
  ["hard", 0x6004, 13, 17],
  ["expert", 0x6005, 8, 12],
];

const PUZZLE_GEN_NINE_BY_NINE_CASES = [
  ["beginner", 0x9001],
  ["easy", 0x9002],
  ["medium", 0x9003],
  ["hard", 0x9004],
  ["expert", 0x9005],
];

for (const [difficulty, seed, minimumClues, maximumClues] of PUZZLE_GEN_SIX_BY_SIX_CASES) {
  test(`puzzle-generator — generates a unique ${difficulty} puzzle within its clue range`, async () => {
    const result = await generatePuzzle({
      difficulty,
      random: seededRandom(seed),
      size: 6,
      yieldControl: async () => undefined,
    });

    assert.notEqual(result, null);
    assert.equal(result.size, 6);
    assert.equal(result.difficulty, difficulty);
    assert.equal(result.puzzle.length, 36);
    assert.equal(result.solution.length, 36);

    const grid = parseGrid(result.puzzle, SIX_BY_SIX);
    const solution = parseGrid(result.solution, SIX_BY_SIX);
    const clueCount = grid.filter((digit) => digit !== null).length;

    assert.ok(clueCount >= minimumClues);
    assert.ok(clueCount <= maximumClues);
    assert.equal(countSolutions(grid, 2, SIX_BY_SIX), 1);
    assert.equal(serializeGrid(solve(grid, SIX_BY_SIX)), result.solution);
    assert.equal(serializeGrid(solution), result.solution);
  });
}

test("puzzle-generator — yields while removing clues", async () => {
  let yields = 0;
  await generatePuzzle({
    difficulty: "beginner",
    random: seededRandom(0x6010),
    size: 6,
    yieldControl: async () => {
      yields += 1;
    },
  });
  assert.ok(yields > 0);
});

test("puzzle-generator — reports monotonically increasing generation attempts", async () => {
  const attempts = [];
  await generatePuzzle({
    difficulty: "expert",
    onProgress: (attempt) => attempts.push(attempt),
    random: seededRandom(0x6013),
    size: 6,
    yieldControl: async () => undefined,
  });
  assert.equal(attempts[0], 1);
  assert.equal(
    attempts.every((attempt, index) => index === 0 || attempt > attempts[index - 1]),
    true,
  );
});

test("puzzle-generator — returns null after cooperative cancellation", async () => {
  let yields = 0;
  const result = await generatePuzzle({
    difficulty: "expert",
    random: seededRandom(0x6011),
    shouldCancel: () => yields > 0,
    size: 6,
    yieldControl: async () => {
      yields += 1;
    },
  });
  assert.equal(result, null);
});

test("puzzle-generator — rejects a repeated session puzzle", async () => {
  const first = await generatePuzzle({
    difficulty: "beginner",
    random: seededRandom(0x6012),
    size: 6,
    yieldControl: async () => undefined,
  });
  const second = await generatePuzzle({
    difficulty: "beginner",
    random: seededRandom(0x6012),
    size: 6,
    seenPuzzles: new Set([first.puzzle]),
    yieldControl: async () => undefined,
  });
  assert.notEqual(second.puzzle, first.puzzle);
});

test("puzzle-generator — propagates unexpected generator failures to the caller", async () => {
  await assert.rejects(
    generatePuzzle({
      difficulty: "beginner",
      random: () => {
        throw new Error("random source failed");
      },
      size: 6,
      yieldControl: async () => undefined,
    }),
    /random source failed/,
  );
});

for (const [difficulty, seed] of PUZZLE_GEN_NINE_BY_NINE_CASES) {
  test(`puzzle-generator — generates an exact-rated 9×9 ${difficulty} puzzle`, async () => {
    const result = await generatePuzzle({
      difficulty,
      random: seededRandom(seed),
      size: 9,
      yieldControl: async () => undefined,
    });

    assert.notEqual(result, null);
    assert.equal(result.size, 9);
    assert.equal(result.difficulty, difficulty);
    assert.equal(result.analysis?.difficulty, difficulty);
    assert.equal(result.puzzle.length, 81);
    assert.equal(result.solution.length, 81);

    const grid = parseGrid(result.puzzle, NINE_BY_NINE);

    assert.equal(countSolutions(grid, 2, NINE_BY_NINE), 1);
    assert.equal(serializeGrid(solve(grid, NINE_BY_NINE)), result.solution);
    assert.equal(analyzeDifficulty(grid).difficulty, difficulty);
  });
}

test("puzzle-generator — yields before returning a matching 9×9 puzzle", async () => {
  let yields = 0;
  const result = await generatePuzzle({
    difficulty: "beginner",
    random: seededRandom(0x9001),
    size: 9,
    yieldControl: async () => {
      yields += 1;
    },
  });

  assert.notEqual(result, null);
  assert.ok(yields > 0);
});

test("puzzle-generator — honors initial cancellation before returning a matching 9×9 puzzle", async () => {
  const result = await generatePuzzle({
    difficulty: "beginner",
    random: seededRandom(0x9001),
    shouldCancel: () => true,
    size: 9,
    yieldControl: async () => undefined,
  });

  assert.equal(result, null);
});

// ---------------------------------------------------------------------------
// rating — from domain/rating.test.ts
// ---------------------------------------------------------------------------

const RATING_SIMPLE =
  "534678912672195348198342567859761423426853791713924856961537284287419635345286170";
const RATING_COMPLEX =
  "100007090030020008009600500005300900010080002600004000300000010040000007007000300";

test("rating — rates a one-move puzzle as beginner", () => {
  const result = analyzeDifficulty(parseGrid(RATING_SIMPLE));
  assert.equal(result.difficulty, "beginner");
  assert.equal(result.singles, 1);
  assert.equal(result.maxSearchDepth, 0);
});

test("rating — assigns more work to a complex unique puzzle", () => {
  const simple = analyzeDifficulty(parseGrid(RATING_SIMPLE));
  const complex = analyzeDifficulty(parseGrid(RATING_COMPLEX));
  assert.ok(
    complex.searchNodes + complex.lockedEliminations + complex.pairEliminations > simple.searchNodes,
  );
});

// ---------------------------------------------------------------------------
// game-reducer — from domain/game-reducer.test.ts
// ---------------------------------------------------------------------------

test("game-reducer — protects clues and supports place, note, undo, and redo", () => {
  const initial = createGame(PUZZLES[0]);
  const clue = initial.givens.findIndex(Boolean);
  const blank = initial.givens.findIndex((given) => !given);
  const protectedState = gameReducer(initial, { type: "placeDigit", index: clue, digit: 9 });
  assert.equal(protectedState, initial);

  const noted = gameReducer(initial, { type: "toggleNote", index: blank, digit: 3 });
  assert.ok(noted.notes[blank].includes(3));
  const placed = gameReducer(noted, { type: "placeDigit", index: blank, digit: 3 });
  assert.equal(placed.grid[blank], 3);
  assert.deepEqual(placed.notes[blank], []);
  assert.equal(gameReducer(placed, { type: "undo" }).grid[blank], null);
  assert.equal(gameReducer(gameReducer(placed, { type: "undo" }), { type: "redo" }).grid[blank], 3);
});

test("game-reducer — records only grid and note changes in history", () => {
  const initial = createGame(PUZZLES[0]);
  const blank = initial.givens.findIndex((given) => !given);
  const selected = gameReducer(initial, { type: "selectCell", index: blank });
  const configured = gameReducer(selected, { type: "setNoteMode", enabled: true });
  const checked = gameReducer(configured, { type: "setAnswerCheck", enabled: true });

  assert.deepEqual(checked.past, []);
  assert.deepEqual(checked.future, []);

  const noted = gameReducer(checked, { type: "toggleNote", index: blank, digit: 3 });
  const restored = gameReducer(noted, { type: "undo" });

  assert.equal(noted.past.length, 1);
  assert.deepEqual(restored.notes[blank], []);
  assert.equal(restored.selectedIndex, blank);
  assert.equal(restored.noteMode, true);
  assert.equal(restored.answerCheck, true);
});

test("game-reducer — does not select a fixed clue", () => {
  const initial = createGame(PUZZLES[0]);
  const blank = 36;
  const clue = 0;
  const selected = gameReducer(initial, { type: "selectCell", index: blank });

  assert.equal(selected.selectedIndex, blank);
  assert.equal(gameReducer(selected, { type: "selectCell", index: clue }), selected);
});

test("game-reducer — does not remove notes from peer cells when placing a digit", () => {
  const initial = createGame(PUZZLES[6]);
  const firstBlank = initial.givens.findIndex((given) => !given);
  const peerBlank = initial.givens.findIndex(
    (given, index) =>
      !given && index !== firstBlank && Math.floor(index / 9) === Math.floor(firstBlank / 9),
  );
  const withFirstNote = gameReducer(initial, { type: "toggleNote", index: firstBlank, digit: 3 });
  const withPeerNote = gameReducer(withFirstNote, { type: "toggleNote", index: peerBlank, digit: 3 });
  const placed = gameReducer(withPeerNote, { type: "placeDigit", index: firstBlank, digit: 3 });

  assert.deepEqual(placed.notes[firstBlank], []);
  assert.deepEqual(placed.notes[peerBlank], [3]);
});

test("game-reducer — recomputes conflicts and answer-check mismatches after a grid change", () => {
  const initial = createGame(PUZZLES[0]);
  const blank = initial.givens.findIndex((given) => !given);
  const conflictDigit = initial.grid.find((digit) => digit !== null);
  const checked = gameReducer(initial, { type: "setAnswerCheck", enabled: true });
  const placed = gameReducer(checked, { type: "placeDigit", index: blank, digit: conflictDigit });

  assert.notEqual(placed.conflicts.get(blank), undefined);
  assert.deepEqual(placed.incorrectIndexes, [blank]);
  assert.deepEqual(gameReducer(placed, { type: "setAnswerCheck", enabled: false }).incorrectIndexes, []);
});

test("game-reducer — recognizes completion only when every cell matches the solution", () => {
  const puzzle = PUZZLES[0];
  let state = createGame(puzzle);

  for (let index = 0; index < state.grid.length; index += 1) {
    if (!state.givens[index]) {
      state = gameReducer(state, { type: "placeDigit", index, digit: state.solution[index] });
    }
  }

  assert.equal(isComplete(state), true);
  assert.equal(state.status, "completed");
});

for (const index of [-1, 81, 1.5]) {
  test(`game-reducer — rejects invalid action index ${index}`, () => {
    const initial = createGame(PUZZLES[0]);

    assert.throws(() => gameReducer(initial, { type: "selectCell", index }), /0 to 80/);
    assert.throws(() => gameReducer(initial, { type: "placeDigit", index, digit: 3 }), /0 to 80/);
    assert.throws(() => gameReducer(initial, { type: "eraseCell", index }), /0 to 80/);
    assert.throws(() => gameReducer(initial, { type: "toggleNote", index, digit: 3 }), /0 to 80/);
  });
}

test("game-reducer — keeps identity for no-op actions", () => {
  const initial = createGame(PUZZLES[0]);
  const blank = initial.givens.findIndex((given) => !given);
  const selected = gameReducer(initial, { type: "selectCell", index: blank });

  assert.equal(gameReducer(selected, { type: "selectCell", index: blank }), selected);
  assert.equal(gameReducer(initial, { type: "eraseCell", index: blank }), initial);
  assert.equal(gameReducer(initial, { type: "setNoteMode", enabled: false }), initial);
  assert.equal(gameReducer(initial, { type: "setAnswerCheck", enabled: false }), initial);
  assert.equal(gameReducer(initial, { type: "undo" }), initial);
  assert.equal(gameReducer(initial, { type: "redo" }), initial);
});

test("game-reducer — creates and completes a 6x6 game using its layout", () => {
  let state = createGame(PUZZLES_6X6[0]);

  assert.equal(state.layout, SIX_BY_SIX);
  assert.equal(state.grid.length, 36);
  assert.equal(state.notes.length, 36);

  for (let index = 0; index < state.grid.length; index += 1) {
    if (!state.givens[index]) {
      state = gameReducer(state, { type: "placeDigit", index, digit: state.solution[index] });
    }
  }

  assert.equal(state.status, "completed");
});

test("game-reducer — uses 6x6 action bounds and ignores digits outside 1-6", () => {
  const initial = createGame(PUZZLES_6X6[0]);
  const blank = initial.givens.findIndex((given) => !given);

  assert.throws(() => gameReducer(initial, { type: "selectCell", index: 36 }), /0 to 35/);
  assert.equal(gameReducer(initial, { type: "placeDigit", index: blank, digit: 7 }), initial);
  assert.equal(gameReducer(initial, { type: "toggleNote", index: blank, digit: 9 }), initial);
});

// ---------------------------------------------------------------------------
// random-solution — from domain/random-solution.test.ts
// ---------------------------------------------------------------------------

for (const layout of [SIX_BY_SIX, NINE_BY_NINE]) {
  test(`random-solution — creates a complete conflict-free ${layout.size}×${layout.size} grid`, () => {
    const solution = createRandomSolution(layout, seededRandom(layout.size));

    assert.equal(solution.length, layout.cellCount);
    assert.equal(
      solution.every((digit) => layout.digits.includes(digit)),
      true,
    );
    assert.equal(findConflicts(solution, layout).size, 0);
  });
}

test("random-solution — uses the random source to produce different logical grids", () => {
  const first = createRandomSolution(NINE_BY_NINE, seededRandom(1));
  const second = createRandomSolution(NINE_BY_NINE, seededRandom(2));

  assert.notDeepEqual(second, first);
});

// ---------------------------------------------------------------------------
// puzzles — from data/puzzles.test.ts
// ---------------------------------------------------------------------------

test("puzzles — contains three unique-solution puzzles per difficulty", () => {
  const counts = PUZZLES.reduce((result, item) => {
    result[item.difficulty] = (result[item.difficulty] ?? 0) + 1;
    return result;
  }, {});
  assert.equal(PUZZLES.length, 15);
  assert.equal(new Set(PUZZLES.map((item) => item.id)).size, PUZZLES.length);
  assert.equal(new Set(PUZZLES.map((item) => item.puzzle)).size, PUZZLES.length);
  for (const difficulty of ["beginner", "easy", "medium", "hard", "expert"]) {
    assert.equal(counts[difficulty], 3);
  }
  for (const item of PUZZLES) {
    const grid = parseGrid(item.puzzle);
    const analysis = analyzeDifficulty(grid);
    assert.equal(countSolutions(grid), 1);
    assert.equal(serializeGrid(solve(grid)), item.solution);
    assert.deepEqual(analysis, item.analysis);
    assert.equal(analysis.difficulty, item.difficulty);
  }
});

// ---------------------------------------------------------------------------
// puzzles-6x6 — from data/puzzles-6x6.test.ts
// ---------------------------------------------------------------------------

const PUZZLES_6X6_CLUE_RANGES = {
  beginner: [28, 35],
  easy: [23, 27],
  medium: [18, 22],
  hard: [13, 17],
  expert: [8, 12],
};

test("puzzles-6x6 — contains three distinct, uniquely solvable puzzles per difficulty", () => {
  assert.equal(PUZZLES_6X6.length, 15);
  assert.equal(new Set(PUZZLES_6X6.map(({ id }) => id)).size, 15);
  assert.equal(new Set(PUZZLES_6X6.map(({ puzzle }) => puzzle)).size, 15);

  for (const [difficulty, [minimumClues, maximumClues]] of Object.entries(PUZZLES_6X6_CLUE_RANGES)) {
    const puzzles = PUZZLES_6X6.filter((puzzle) => puzzle.difficulty === difficulty);
    assert.equal(puzzles.length, 3);

    for (const item of puzzles) {
      const grid = parseGrid(item.puzzle, SIX_BY_SIX);
      const solution = parseGrid(item.solution, SIX_BY_SIX);
      const clueCount = grid.filter((digit) => digit !== null).length;

      assert.equal(item.size, 6);
      assert.ok(clueCount >= minimumClues);
      assert.ok(clueCount <= maximumClues);
      assert.equal(findConflicts(grid, SIX_BY_SIX).size, 0);
      assert.equal(findConflicts(solution, SIX_BY_SIX).size, 0);
      assert.equal(countSolutions(grid, 2, SIX_BY_SIX), 1);
      assert.equal(serializeGrid(solve(grid, SIX_BY_SIX)), item.solution);
    }
  }
});
