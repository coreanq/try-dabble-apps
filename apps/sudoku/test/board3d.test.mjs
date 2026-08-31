import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { OrthographicCamera, Ray, TextureLoader, Vector3 } from "three";

import { configureBoardCamera } from "../src/lib/board3d/board-camera.ts";
import { nextCanvasKey } from "../src/lib/board3d/canvas-key.ts";
import {
  BOARD_FRAME_INSET,
  CELL_HIT_WORLD_SIZE,
  MIN_INTERACTIVE_CANVAS_SIZE,
  TRAY_HIT_WORLD_SIZE,
  WEB_CANVAS_TOUCH_ACTION,
  calculateBoardViewport,
  containWebCanvasDrag,
  nearestBoardScrollOffset,
  nextBoardScrollOffset,
  projectedCellHorizontalBounds,
} from "../src/lib/board3d/board-layout.ts";
import { cellToWorld, worldToCell } from "../src/lib/board3d/scene-math.ts";
import {
  pointerPresentation,
  rayToBoardTarget,
  screenPointerToBoardTarget,
} from "../src/lib/board3d/board-input.ts";
import { createPhysicsWorld } from "../src/lib/board3d/physics-world.ts";
import { completionTileLift } from "../src/lib/board3d/completion-motion.ts";
import {
  createDemandFrameSampler,
  createFrameBudget,
} from "../src/lib/board3d/frame-budget.ts";
import { boardCellRole } from "../src/lib/board3d/board-cell-role.ts";
import {
  assertWebGLAvailable,
  preflightNativeContext,
  preflightWebGLRenderer,
  runBoardInitialization,
} from "../src/lib/board3d/board-initialization.ts";
import {
  SCENE_ASSET_SOURCES,
  clearSceneAssetCache,
} from "../src/lib/board3d/scene-assets.ts";
import {
  actionForDigit,
  boardCommandForKey,
  cellAccessibilityLabel,
  createSessionGame,
  didIntroduceInvalidValue,
  feedbackEffectsForTransition,
  gameAnnouncementPresentation,
  INITIAL_GAME_ANNOUNCEMENT,
  moveSelectedCell,
  nextGameAnnouncement,
} from "../src/lib/game/game-view-model.ts";
import { webSafeAreaPadding } from "../src/lib/game/game-safe-area.ts";
import { normalizeWebPointer } from "../src/lib/pointer.ts";

import { PUZZLES } from "../src/lib/sudoku/data/puzzles.generated.ts";
import { PUZZLES_6X6 } from "../src/lib/sudoku/data/puzzles-6x6.ts";
import { createGame, gameReducer } from "../src/lib/sudoku/domain/game-reducer.ts";
import { candidatesFor } from "../src/lib/sudoku/domain/grid.ts";
import { SIX_BY_SIX } from "../src/lib/sudoku/domain/layout.ts";

// ---------------------------------------------------------------------------
// Test helpers — vitest features node:test has no built-in equivalent for.
// ---------------------------------------------------------------------------

/** Stand-in for vi.fn(): records every call's arguments. */
function spy(impl = () => {}) {
  const calls = [];
  const fn = (...args) => {
    calls.push(args);
    return impl(...args);
  };
  fn.calls = calls;
  return fn;
}

/** Stand-in for expect(a).toBeCloseTo(b, digits) — same tolerance Jest/Vitest use. */
function assertCloseTo(actual, expected, digits = 2) {
  assert.ok(
    Math.abs(actual - expected) < 10 ** -digits / 2,
    `expected ${actual} to be close to ${expected} (±${10 ** -digits / 2})`,
  );
}

// ---------------------------------------------------------------------------
// board-layout — from board3d/board-layout.test.ts
// ---------------------------------------------------------------------------

function projectedBounds(camera, canvasSize, center, worldSize) {
  const half = worldSize / 2;
  const points = [
    new Vector3(center[0] - half, center[1], center[2] - half),
    new Vector3(center[0] + half, center[1], center[2] - half),
    new Vector3(center[0] - half, center[1], center[2] + half),
    new Vector3(center[0] + half, center[1], center[2] + half),
  ].map((point) => {
    const projected = point.project(camera);
    return {
      x: (projected.x + 1) * canvasSize / 2,
      y: (1 - projected.y) * canvasSize / 2,
    };
  });
  const xs = points.map(({ x }) => x);
  const ys = points.map(({ y }) => y);
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);

  return { bottom, height: bottom - top, left, right, top, width: right - left };
}

test("board-layout — projects every cell and tray digit to a visible 44px target", () => {
  const canvasSize = MIN_INTERACTIVE_CANVAS_SIZE;
  const camera = new OrthographicCamera(
    -canvasSize / 2,
    canvasSize / 2,
    canvasSize / 2,
    -canvasSize / 2,
    0.1,
    100,
  );
  configureBoardCamera(camera, { height: canvasSize, width: canvasSize });

  const targets = [
    ...Array.from({ length: 81 }, (_, index) => {
      const [x, , z] = cellToWorld(index);
      return { center: [x, 0.7, z], name: `cell ${index}`, size: CELL_HIT_WORLD_SIZE };
    }),
    ...Array.from({ length: 9 }, (_, index) => ({
      center: [index - 4, 0.16, 5.38],
      name: `tray digit ${index + 1}`,
      size: TRAY_HIT_WORLD_SIZE,
    })),
  ];

  targets.forEach(({ center, name, size }) => {
    const bounds = projectedBounds(camera, canvasSize, center, size);
    assert.ok(bounds.width >= 44, `${name} width`);
    assert.ok(bounds.height >= 44, `${name} height`);
    assert.ok(bounds.left >= 0, `${name} left edge`);
    assert.ok(bounds.top >= 0, `${name} top edge`);
    assert.ok(bounds.right <= canvasSize, `${name} right edge`);
    assert.ok(bounds.bottom <= canvasSize, `${name} bottom edge`);
  });
});

test("board-layout — scrolls horizontally on narrow screens", () => {
  const narrow = calculateBoardViewport(320, 720);

  assert.equal(narrow.horizontalOverflow, true);
});

test("board-layout — projects the last cell and minimally reveals it in a 320px viewport", () => {
  const layout = calculateBoardViewport(320, 720);
  const bounds = projectedCellHorizontalBounds(8, layout);
  const nextOffset = nearestBoardScrollOffset(0, bounds, layout);

  assertCloseTo(bounds.left, 433.09, 2);
  assertCloseTo(bounds.right, 480.55, 2);
  assertCloseTo(nextOffset, 192.55, 2);
  assert.ok(bounds.left >= nextOffset);
  assert.ok(bounds.right <= nextOffset + layout.viewportWidth);
  assert.ok(bounds.right > nextOffset - 0.01 + layout.viewportWidth);
});

test("board-layout — projects wider 6x6 cells without changing the board edge", () => {
  const layout = calculateBoardViewport(320, 720);
  const sixBySix = projectedCellHorizontalBounds(5, layout, 6);
  const nineByNine = projectedCellHorizontalBounds(8, layout, 9);

  assertCloseTo(sixBySix.right, nineByNine.right, 5);
  assert.ok(sixBySix.right - sixBySix.left > nineByNine.right - nineByNine.left);
});

test("board-layout — pages outside the drag surface until every target is fully reachable by touch", () => {
  const layout = calculateBoardViewport(320, 720);
  const offsets = [0];
  for (let step = 0; step < 10; step += 1) {
    const next = nextBoardScrollOffset(offsets.at(-1), "right", layout);
    if (next === offsets.at(-1)) {
      break;
    }
    offsets.push(next);
  }

  assert.equal(offsets.at(-1), layout.frameSize - layout.viewportWidth);
  assert.ok(nextBoardScrollOffset(offsets.at(-1), "left", layout) < offsets.at(-1));

  const canvasSize = layout.canvasSize;
  const camera = new OrthographicCamera(
    -canvasSize / 2,
    canvasSize / 2,
    canvasSize / 2,
    -canvasSize / 2,
    0.1,
    100,
  );
  configureBoardCamera(camera, { height: canvasSize, width: canvasSize });
  const frameInset = BOARD_FRAME_INSET / 2;
  const targets = [
    ...Array.from({ length: 81 }, (_, index) => {
      const [x, , z] = cellToWorld(index);
      return projectedBounds(camera, canvasSize, [x, 0.7, z], CELL_HIT_WORLD_SIZE);
    }),
    ...Array.from({ length: 9 }, (_, index) => (
      projectedBounds(camera, canvasSize, [index - 4, 0.16, 5.38], TRAY_HIT_WORLD_SIZE)
    )),
  ];

  targets.forEach(({ left, right }) => {
    assert.equal(
      offsets.some((offset) => (
        left + frameInset >= offset
        && right + frameInset <= offset + layout.viewportWidth
      )),
      true,
    );
  });
});

test("board-layout — keeps iPad landscape and portrait boards in their responsive layouts without overflow", () => {
  const landscape = calculateBoardViewport(1024, 768);
  const portrait = calculateBoardViewport(768, 1024);

  assert.equal(landscape.isWide, true);
  assert.equal(landscape.horizontalOverflow, false);
  assert.equal(portrait.isWide, false);
  assert.equal(portrait.horizontalOverflow, false);
});

test("board-layout — uses scoped no-touch-action only for the web Canvas boundary", () => {
  const style = { touchAction: "pan-x" };
  const restore = containWebCanvasDrag(style);

  assert.equal(WEB_CANVAS_TOUCH_ACTION, "none");
  assert.equal(style.touchAction, "none");
  restore();
  assert.equal(style.touchAction, "pan-x");
});

// ---------------------------------------------------------------------------
// scene-math — from board3d/scene-math.test.ts
// ---------------------------------------------------------------------------

test("scene-math — round-trips all 81 cell centers", () => {
  for (let index = 0; index < 81; index += 1) {
    const [x, , z] = cellToWorld(index);
    assert.equal(worldToCell(x, z), index);
  }
});

test("scene-math — rejects positions outside the board", () => {
  assert.equal(worldToCell(6, 0), null);
  assert.equal(worldToCell(0, -6), null);
});

test("scene-math — maps the inclusive board edges to their adjacent cells", () => {
  assert.equal(worldToCell(-4.5, -4.5), 0);
  assert.equal(worldToCell(4.499, 4.499), 80);
});

test("scene-math — rejects the exclusive positive edges", () => {
  assert.equal(worldToCell(4.5, 0), null);
  assert.equal(worldToCell(0, 4.5), null);
});

test("scene-math — rejects non-finite coordinates", () => {
  assert.equal(worldToCell(Number.NaN, 0), null);
  assert.equal(worldToCell(0, Number.POSITIVE_INFINITY), null);
  assert.equal(worldToCell(Number.NEGATIVE_INFINITY, 0), null);
});

test("scene-math — round-trips 6x6 cells across the same nine-unit board footprint", () => {
  assert.deepEqual(cellToWorld(0, SIX_BY_SIX), [-3.75, 0.18, -3.75]);
  assert.deepEqual(cellToWorld(35, SIX_BY_SIX), [3.75, 0.18, 3.75]);

  for (let index = 0; index < 36; index += 1) {
    const [x, , z] = cellToWorld(index, SIX_BY_SIX);
    assert.equal(worldToCell(x, z, SIX_BY_SIX), index);
  }

  assert.equal(worldToCell(4.5, 0, SIX_BY_SIX), null);
});

// ---------------------------------------------------------------------------
// board-input — from board3d/board-input.test.ts
// ---------------------------------------------------------------------------

function pointer(overrides) {
  return {
    hovering: false,
    kind: "pencil",
    phase: "move",
    pressure: 0,
    tiltX: 0,
    tiltY: 0,
    x: 0,
    y: 0,
    ...overrides,
  };
}

test("board-input — maps a ray to the board independently of pointer sensor data", () => {
  const ray = new Ray(new Vector3(0, 10, 0), new Vector3(0, -1, 0));

  assert.deepEqual(rayToBoardTarget(ray), { cell: 40, x: 0, z: 0 });
});

test("board-input — returns no target when the ray misses the board plane", () => {
  const ray = new Ray(new Vector3(0, 10, 0), new Vector3(1, 0, 0));

  assert.equal(rayToBoardTarget(ray), null);
});

test("board-input — projects current Canvas coordinates through its camera", () => {
  const camera = new OrthographicCamera(-6, 6, 6, -6, 0.1, 100);
  camera.position.set(0, 10, 0);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();

  assert.equal(
    screenPointerToBoardTarget(
      pointer({ x: 60, y: 60 }),
      { height: 120, width: 120 },
      camera,
    )?.cell,
    40,
  );
  assert.equal(
    screenPointerToBoardTarget(
      pointer({ x: 0, y: 0 }),
      { height: 120, width: 120 },
      camera,
    )?.cell,
    null,
  );
});

test("board-input — limits pressure lift to 0.35 through 0.65 world units", () => {
  assertCloseTo(pointerPresentation(pointer({ pressure: 0 })).lift, 0.35);
  assertCloseTo(pointerPresentation(pointer({ pressure: 1 })).lift, 0.65);
});

test("board-input — limits tilt rotation to four degrees per axis", () => {
  const presentation = pointerPresentation(pointer({ tiltX: 90, tiltY: -90 }));

  assertCloseTo(presentation.rotationX, -4 * Math.PI / 180);
  assertCloseTo(presentation.rotationZ, -4 * Math.PI / 180);
});

// ---------------------------------------------------------------------------
// physics-world — from board3d/physics-world.test.ts
// ---------------------------------------------------------------------------

test("physics-world — sleeps and freezes a settled tile without changing its intended cell", () => {
  const physics = createPhysicsWorld();
  const id = physics.beginDrop({ cell: 40, impulse: 0.15, lift: 0.5 });

  for (let frame = 0; frame < 240; frame += 1) {
    physics.step(1 / 60);
  }

  const settled = physics.snapshot(id);
  assert.equal(settled.cell, 40);
  assert.equal(settled.settled, true);
  assert.deepEqual(settled.velocity, [0, 0, 0]);
  physics.dispose();
});

test("physics-world — clamps a long frame to one fifteenth of a second", () => {
  const clamped = createPhysicsWorld();
  const reference = createPhysicsWorld();
  const clampedId = clamped.beginDrop({ cell: 4, impulse: 0.1, lift: 0.5 });
  const referenceId = reference.beginDrop({ cell: 4, impulse: 0.1, lift: 0.5 });

  clamped.step(1);
  reference.step(1 / 15);

  assert.deepEqual(
    clamped.snapshot(clampedId).position,
    reference.snapshot(referenceId).position,
  );
  clamped.dispose();
  reference.dispose();
});

test("physics-world — recycles the oldest effect before admitting a thirteenth body", () => {
  const physics = createPhysicsWorld();
  const ids = Array.from({ length: 13 }, (_, cell) =>
    physics.beginDrop({ cell, impulse: 0, lift: 0.5 }));

  assert.equal(physics.snapshots().length, 12);
  assert.throws(() => physics.snapshot(ids[0]), /Unknown physics effect/);
  assert.equal(physics.snapshot(ids[12]).cell, 12);
  physics.dispose();
});

test("physics-world — cancels an effect without exposing a stale presentation snapshot", () => {
  const physics = createPhysicsWorld();
  const id = physics.beginDrop({ cell: 7, impulse: 0, lift: 0.5 });

  physics.cancel(id);

  assert.deepEqual(physics.snapshots(), []);
  assert.throws(() => physics.snapshot(id), /Unknown physics effect/);
  physics.dispose();
});

test("physics-world — reports only collisions at or above the audible impact threshold", () => {
  const impacts = [];
  const physics = createPhysicsWorld();
  physics.setCollisionHandler((impact) => impacts.push(impact));
  physics.beginDrop({ cell: 40, impulse: 0, lift: 0.5 });

  for (let frame = 0; frame < 120; frame += 1) {
    physics.step(1 / 60);
  }

  assert.ok(impacts.length > 0);
  assert.equal(impacts.every((impact) => impact >= 0.35), true);
  physics.dispose();
});

test("physics-world — detaches a settled body so a later collision cannot move its snapshot", () => {
  const physics = createPhysicsWorld();
  const settledId = physics.beginDrop({ cell: 40, impulse: 0.15, lift: 0.5 });
  for (let frame = 0; frame < 240; frame += 1) {
    physics.step(1 / 60);
  }
  const settled = physics.snapshot(settledId);

  assert.equal(physics.activeBodyCount(), 0);
  physics.beginDrop({ cell: 40, impulse: 0.2, lift: 1 });
  for (let frame = 0; frame < 240; frame += 1) {
    physics.step(1 / 60);
  }

  assert.deepEqual(physics.snapshot(settledId), settled);
  assert.equal(physics.activeBodyCount(), 0);
  physics.dispose();
});

// ---------------------------------------------------------------------------
// completion-motion — from board3d/completion-motion.test.ts
// ---------------------------------------------------------------------------

test("completion-motion — animates only one representative tile when motion is reduced", () => {
  assert.ok(completionTileLift(0, 20, 0.08, true) > 0);
  assert.equal(completionTileLift(1, 20, 0.08, true), 0);
  assert.equal(completionTileLift(19, 20, 0.08, true), 0);
});

test("completion-motion — keeps the normal completion lift staggered in row-major entry order", () => {
  assert.ok(completionTileLift(0, 3, 0.08, false) > 0);
  assert.equal(completionTileLift(1, 3, 0.08, false), 0);
  assert.ok(completionTileLift(1, 3, 0.33, false) > 0);
  assert.equal(completionTileLift(2, 3, 0.33, false), 0);
});

// ---------------------------------------------------------------------------
// frame-budget — from board3d/frame-budget.test.ts
// ---------------------------------------------------------------------------

test("frame-budget — reduces DPR after sustained slow frames and recovers slowly", () => {
  const budget = createFrameBudget();

  for (let index = 0; index < 120; index += 1) {
    budget.sample(24);
  }
  assert.deepEqual(budget.quality(), { dynamicShadows: false, maxDpr: 1.25 });

  for (let index = 0; index < 840; index += 1) {
    budget.sample(12);
  }
  assert.deepEqual(budget.quality(), { dynamicShadows: true, maxDpr: 1.75 });
});

test("frame-budget — keeps dynamic shadows disabled when reduced motion is enabled", () => {
  const budget = createFrameBudget(true);

  assert.deepEqual(budget.quality(), { dynamicShadows: false, maxDpr: 1.75 });
  for (let index = 0; index < 120; index += 1) {
    budget.sample(12);
  }
  assert.equal(budget.quality().dynamicShadows, false);
});

test("frame-budget — excludes idle gaps between demand-rendered frames", () => {
  const budget = createFrameBudget();
  const sampler = createDemandFrameSampler(budget);
  let frameStartedAt = 0;

  for (let index = 0; index < 120; index += 1) {
    sampler.beginFrame(frameStartedAt);
    const sample = sampler.finishFrame(frameStartedAt + 4);

    assert.equal(sample?.requestFrame, false);
    frameStartedAt += 2_000;
  }

  assert.deepEqual(budget.quality(), { dynamicShadows: true, maxDpr: 1.75 });
});

test("frame-budget — ends a recovery probe when expensive rendering does not recover", () => {
  const budget = createFrameBudget();
  const sampler = createDemandFrameSampler(budget);
  let frameStartedAt = 0;
  let sample = null;

  for (let index = 0; index < 120; index += 1) {
    sampler.beginFrame(frameStartedAt);
    sample = sampler.finishFrame(frameStartedAt + 24);
    frameStartedAt += 25;
  }
  assert.deepEqual(sample, {
    quality: { dynamicShadows: false, maxDpr: 1.25 },
    requestFrame: true,
  });

  let probeFrames = 0;
  while (sample?.requestFrame && probeFrames < 1_000) {
    sampler.beginFrame(frameStartedAt);
    sample = sampler.finishFrame(frameStartedAt + 24);
    frameStartedAt += 25;
    probeFrames += 1;
  }

  assert.ok(probeFrames < 1_000);
  assert.deepEqual(sample, {
    quality: { dynamicShadows: false, maxDpr: 1.25 },
    requestFrame: false,
  });
});

test("frame-budget — recovers during a bounded run of inexpensive render probes", () => {
  const budget = createFrameBudget();
  const sampler = createDemandFrameSampler(budget);
  let frameStartedAt = 0;
  let sample = null;

  for (let index = 0; index < 120; index += 1) {
    sampler.beginFrame(frameStartedAt);
    sample = sampler.finishFrame(frameStartedAt + 24);
    frameStartedAt += 25;
  }

  let probeFrames = 0;
  while (sample?.requestFrame && probeFrames < 1_000) {
    sampler.beginFrame(frameStartedAt);
    sample = sampler.finishFrame(frameStartedAt + 4);
    frameStartedAt += 17;
    probeFrames += 1;
  }

  assert.ok(probeFrames < 1_000);
  assert.deepEqual(sample, {
    quality: { dynamicShadows: true, maxDpr: 1.75 },
    requestFrame: false,
  });
});

test("frame-budget — ends a throttled recovery probe after a bounded number of frames", () => {
  const budget = createFrameBudget();
  const sampler = createDemandFrameSampler(budget);
  let frameStartedAt = 0;
  let sample = null;

  for (let index = 0; index < 120; index += 1) {
    sampler.beginFrame(frameStartedAt);
    sample = sampler.finishFrame(frameStartedAt + 24);
    frameStartedAt += 25;
  }

  let probeFrames = 0;
  while (sample?.requestFrame && probeFrames < 2_000) {
    sampler.beginFrame(frameStartedAt);
    sample = sampler.finishFrame(frameStartedAt + 4);
    frameStartedAt += 2_000;
    probeFrames += 1;
  }

  assert.ok(probeFrames < 2_000);
  assert.deepEqual(sample, {
    quality: { dynamicShadows: false, maxDpr: 1.25 },
    requestFrame: false,
  });
});

for (const refreshRate of [144, 240]) {
  test(`frame-budget — allows ten active recovery seconds at ${refreshRate} Hz`, () => {
    const budget = createFrameBudget();
    const sampler = createDemandFrameSampler(budget);
    let frameStartedAt = 0;
    let sample = null;

    for (let index = 0; index < 120; index += 1) {
      sampler.beginFrame(frameStartedAt);
      sample = sampler.finishFrame(frameStartedAt + 24);
      frameStartedAt += 25;
    }

    const frameIntervalMs = 1_000 / refreshRate;
    const maxRecoveryFrames = Math.ceil(refreshRate * 11);
    let recoveryFrames = 0;
    while (sample?.requestFrame && recoveryFrames < maxRecoveryFrames) {
      sampler.beginFrame(frameStartedAt);
      sample = sampler.finishFrame(frameStartedAt + 2);
      frameStartedAt += frameIntervalMs;
      recoveryFrames += 1;
    }

    assert.deepEqual(sample, {
      quality: { dynamicShadows: true, maxDpr: 1.75 },
      requestFrame: false,
    });
  });
}

test("frame-budget — stops a paused probe on its first frame after the wall-clock limit", () => {
  const budget = createFrameBudget();
  const sampler = createDemandFrameSampler(budget);
  let frameStartedAt = 0;
  let sample = null;

  for (let index = 0; index < 120; index += 1) {
    sampler.beginFrame(frameStartedAt);
    sample = sampler.finishFrame(frameStartedAt + 24);
    frameStartedAt += 25;
  }
  assert.equal(sample?.requestFrame, true);

  frameStartedAt += 15_000;
  sampler.beginFrame(frameStartedAt);
  sample = sampler.finishFrame(frameStartedAt + 4);

  assert.deepEqual(sample, {
    quality: { dynamicShadows: false, maxDpr: 1.25 },
    requestFrame: false,
  });
});

// ---------------------------------------------------------------------------
// board-cell-role — from board3d/board-cell-role.test.ts
// ---------------------------------------------------------------------------

test("board-cell-role — distinguishes fixed clues, empty cells, and replaceable user entries", () => {
  const initial = createGame(PUZZLES[0]);
  const given = initial.givens.findIndex(Boolean);
  const empty = initial.givens.findIndex((isGiven) => !isGiven);

  assert.equal(boardCellRole(initial, given), "given");
  assert.equal(boardCellRole(initial, empty), "empty");

  const placed = gameReducer(initial, {
    type: "placeDigit",
    index: empty,
    digit: initial.solution[empty],
  });

  assert.equal(boardCellRole(placed, empty), "user-entry");
});

// ---------------------------------------------------------------------------
// board-initialization — from board3d/board-initialization.test.ts
// ---------------------------------------------------------------------------

test("board-initialization — maps a rejected platform preflight to a failed initialization result", async () => {
  const failure = new Error("EXGL is unavailable");

  const result = await runBoardInitialization(async () => {
    throw failure;
  });
  assert.deepEqual(result, { status: "failed", error: failure });
});

test("board-initialization — maps a successful platform preflight to ready", async () => {
  const result = await runBoardInitialization(async () => undefined);
  assert.deepEqual(result, { status: "ready" });
});

test("board-initialization — rejects a browser without a WebGL context", () => {
  const getContext = spy(() => null);

  assert.throws(
    () => assertWebGLAvailable(() => ({ getContext })),
    { message: "WebGL is unavailable on this device." },
  );
  assert.deepEqual(getContext.calls, [["webgl2"], ["webgl"]]);
});

test("board-initialization — maps web renderer construction failure through the controlled preflight", async () => {
  const rendererFailure = new Error("Renderer configuration failed");
  const loseContext = spy();
  const canvas = {
    getContext: spy(() => ({
      getExtension: spy(() => ({ loseContext })),
    })),
  };

  const result = await runBoardInitialization(() => preflightWebGLRenderer(
    () => canvas,
    () => {
      throw rendererFailure;
    },
  ));
  assert.deepEqual(result, { status: "failed", error: rendererFailure });
  assert.equal(loseContext.calls.length, 1);
});

test("board-initialization — gives successful renderer cleanup sole ownership of its context", () => {
  const rawLoseContext = spy();
  const dispose = spy();
  const forceContextLoss = spy();
  const rendererContext = {};
  const canvas = {
    getContext: spy(() => ({
      getExtension: spy(() => ({ loseContext: rawLoseContext })),
    })),
  };

  preflightWebGLRenderer(
    () => canvas,
    () => ({ dispose, forceContextLoss, getContext: () => rendererContext }),
  );

  assert.equal(dispose.calls.length, 1);
  assert.equal(forceContextLoss.calls.length, 1);
  assert.equal(rawLoseContext.calls.length, 0);
});

test("board-initialization — cleans through the renderer after a later readiness failure", () => {
  const rawLoseContext = spy();
  const dispose = spy();
  const forceContextLoss = spy();
  const readinessFailure = new Error("Renderer context is unavailable");
  const canvas = {
    getContext: spy(() => ({
      getExtension: spy(() => ({ loseContext: rawLoseContext })),
    })),
  };

  assert.throws(
    () => preflightWebGLRenderer(
      () => canvas,
      () => ({
        dispose,
        forceContextLoss,
        getContext: () => {
          throw readinessFailure;
        },
      }),
    ),
    (error) => error === readinessFailure,
  );
  assert.equal(dispose.calls.length, 1);
  assert.equal(forceContextLoss.calls.length, 1);
  assert.equal(rawLoseContext.calls.length, 0);
});

test("board-initialization — maps unsuccessful native context destruction to initialization failure", async () => {
  const context = { contextId: 7 };

  const result = await runBoardInitialization(() => preflightNativeContext(
    async () => context,
    async () => false,
  ));
  assert.deepEqual(result, {
    status: "failed",
    error: new Error("EXGL context cleanup failed."),
  });
});

test("board-initialization — maps rejected native context destruction to initialization failure", async () => {
  const context = { contextId: 7 };
  const cleanupFailure = new Error("Native cleanup rejected");

  const result = await runBoardInitialization(() => preflightNativeContext(
    async () => context,
    async () => {
      throw cleanupFailure;
    },
  ));
  assert.deepEqual(result, { status: "failed", error: cleanupFailure });
});

// ---------------------------------------------------------------------------
// scene-assets — from board3d/scene-assets.test.ts
// ---------------------------------------------------------------------------

test("scene-assets — clears the exact loader keys used by the board scene", () => {
  const clear = spy();

  clearSceneAssetCache(clear);

  assert.equal(clear.calls.length, 2);
  assert.deepEqual(clear.calls[0], [TextureLoader, "/textures/digits.png"]);
  assert.deepEqual(clear.calls[1], [TextureLoader, "/textures/wood.png"]);
  assert.equal(SCENE_ASSET_SOURCES.digitAtlas, "/textures/digits.png");
  assert.equal(SCENE_ASSET_SOURCES.wood, "/textures/wood.png");
});

// ---------------------------------------------------------------------------
// game-view-model — from game/game-view-model.test.ts
// ---------------------------------------------------------------------------

test("game-view-model — labels cells and maps keypad input to the selected blank", () => {
  const initial = createGame(PUZZLES[0]);
  const blank = initial.givens.findIndex((given) => !given);
  const selected = gameReducer(initial, { type: "selectCell", index: blank });

  assert.ok(cellAccessibilityLabel("ko", selected, blank).includes("빈칸"));
  assert.deepEqual(actionForDigit(selected, 4), {
    type: "placeDigit",
    index: blank,
    digit: 4,
  });
});

test("game-view-model — maps keypad input to a note only when note mode is active", () => {
  const initial = createGame(PUZZLES[1]);
  const blank = initial.givens.findIndex((given) => !given);
  const selected = gameReducer(initial, { type: "selectCell", index: blank });
  const noteMode = gameReducer(selected, { type: "setNoteMode", enabled: true });

  assert.deepEqual(actionForDigit(noteMode, 7), {
    type: "toggleNote",
    index: blank,
    digit: 7,
  });

  const withNote = gameReducer(noteMode, actionForDigit(noteMode, 7));
  assert.ok(cellAccessibilityLabel("en", withNote, blank).includes("notes 7"));
});

test("game-view-model — does not map keypad input without an editable selection", () => {
  const initial = createGame(PUZZLES[0]);
  const given = initial.givens.findIndex(Boolean);
  const selectedGiven = gameReducer(initial, { type: "selectCell", index: given });

  assert.equal(actionForDigit(initial, 3), null);
  assert.equal(actionForDigit(selectedGiven, 3), null);
});

test("game-view-model — describes the cell position, ownership, value, and conflict state", () => {
  const initial = createGame(PUZZLES[1]);
  const blank = initial.givens.findIndex((given) => !given);
  const selected = gameReducer(initial, { type: "selectCell", index: blank });
  const conflictingDigit = initial.grid.find(
    (value, index) => value !== null && Math.floor(index / 9) === Math.floor(blank / 9),
  );
  const conflicted = gameReducer(selected, {
    type: "placeDigit",
    index: blank,
    digit: conflictingDigit,
  });

  assert.equal(cellAccessibilityLabel("en", initial, 0), "Row 1, column 1, clue 3");
  assert.equal(
    cellAccessibilityLabel("en", selected, blank),
    `Row ${Math.floor(blank / 9) + 1}, column ${(blank % 9) + 1}, blank`,
  );
  assert.equal(
    cellAccessibilityLabel("en", conflicted, blank),
    `Row ${Math.floor(blank / 9) + 1}, column ${(blank % 9) + 1}, entered ${conflictingDigit}, conflict`,
  );
});

test("game-view-model — moves a selected cell within the board without wrapping rows", () => {
  assert.equal(moveSelectedCell(0, "left"), 0);
  assert.equal(moveSelectedCell(8, "right"), 8);
  assert.equal(moveSelectedCell(0, "up"), 0);
  assert.equal(moveSelectedCell(80, "down"), 80);
  assert.equal(moveSelectedCell(40, "left"), 39);
  assert.equal(moveSelectedCell(40, "right"), 41);
  assert.equal(moveSelectedCell(40, "up"), 31);
  assert.equal(moveSelectedCell(40, "down"), 49);
});

test("game-view-model — uses six columns and digits 1-6 for a 6x6 game", () => {
  const initial = createGame(PUZZLES_6X6[0]);
  const blank = initial.givens.findIndex((given) => !given);
  const selected = gameReducer(initial, { type: "selectCell", index: blank });

  assert.ok(cellAccessibilityLabel("en", selected, blank).includes(
    `Row ${Math.floor(blank / 6) + 1}, column ${(blank % 6) + 1}`,
  ));
  assert.equal(moveSelectedCell(0, "left", 6), 0);
  assert.equal(moveSelectedCell(5, "right", 6), 5);
  assert.equal(moveSelectedCell(30, "down", 6), 30);
  assert.equal(moveSelectedCell(35, "down", 6), 35);
  assert.equal(moveSelectedCell(8, "up", 6), 2);
  assert.deepEqual(boardCommandForKey(blank, "6", {}, 6), { type: "digit", digit: 6 });
  assert.equal(boardCommandForKey(blank, "7", {}, 6), null);
  assert.equal(actionForDigit(selected, 7), null);
});

test("game-view-model — detects only a newly introduced conflict for invalid feedback", () => {
  const initial = createGame(PUZZLES[1]);
  const blank = initial.givens.findIndex((given) => !given);
  const selected = gameReducer(initial, { type: "selectCell", index: blank });
  const conflictingDigit = initial.grid.find(
    (value, index) => value !== null && Math.floor(index / 9) === Math.floor(blank / 9),
  );
  const conflicted = gameReducer(selected, {
    type: "placeDigit",
    index: blank,
    digit: conflictingDigit,
  });

  assert.equal(didIntroduceInvalidValue(selected, conflicted, blank), true);
  assert.equal(didIntroduceInvalidValue(conflicted, conflicted, blank), false);
});

for (const answerCheck of [true, false]) {
  test(`game-view-model — preserves answer checking as ${answerCheck} across new and next puzzles`, () => {
    const first = createSessionGame(PUZZLES[0], answerCheck);
    const next = createSessionGame(PUZZLES[1], first.answerCheck);

    assert.equal(first.answerCheck, answerCheck);
    assert.equal(next.answerCheck, answerCheck);
  });
}

test("game-view-model — selects the first editable cell when a session starts", () => {
  assert.equal(createSessionGame(PUZZLES[0], false).selectedIndex, 36);
  assert.equal(createSessionGame(PUZZLES_6X6[0], false).selectedIndex, 0);
});

test("game-view-model — skips fixed clues when arrow keys move the selection", () => {
  const state = createGame(PUZZLES[3]);

  assert.deepEqual(boardCommandForKey(8, "ArrowLeft", {}, 9, state.givens), {
    type: "selectCell",
    index: 1,
  });
  assert.deepEqual(boardCommandForKey(1, "ArrowLeft", {}, 9, state.givens), {
    type: "selectCell",
    index: 1,
  });
});

test("game-view-model — routes board-scoped keys from the focused cell without capturing unrelated keys", () => {
  assert.deepEqual(boardCommandForKey(0, "ArrowRight"), { type: "selectCell", index: 1 });
  assert.deepEqual(boardCommandForKey(1, "ArrowLeft"), { type: "selectCell", index: 0 });
  assert.deepEqual(boardCommandForKey(1, "4"), { type: "digit", digit: 4 });
  assert.deepEqual(boardCommandForKey(1, "Delete"), { type: "erase" });
  assert.deepEqual(boardCommandForKey(1, "m"), { type: "toggleNote" });
  assert.deepEqual(boardCommandForKey(1, "z", { metaKey: true }), { type: "undo" });
  assert.deepEqual(boardCommandForKey(1, "z", { ctrlKey: true, shiftKey: true }), { type: "redo" });
  assert.equal(boardCommandForKey(1, "ArrowRight", { altKey: true }), null);
  assert.equal(boardCommandForKey(1, "Home"), null);
});

test("game-view-model — emits distinct sounds for note, erase, undo, and a valid redo", () => {
  const initial = createGame(PUZZLES[1]);
  const blank = initial.givens.findIndex((given) => !given);
  const noted = gameReducer(initial, { type: "toggleNote", index: blank, digit: 7 });
  const placed = gameReducer(noted, { type: "placeDigit", index: blank, digit: 7 });
  const erased = gameReducer(placed, { type: "eraseCell", index: blank });
  const undone = gameReducer(erased, { type: "undo" });
  const redone = gameReducer(undone, { type: "redo" });

  assert.deepEqual(feedbackEffectsForTransition(initial, noted, {
    type: "toggleNote",
    index: blank,
    digit: 7,
  }), ["note"]);
  assert.deepEqual(feedbackEffectsForTransition(placed, erased, {
    type: "eraseCell",
    index: blank,
  }), ["erase"]);
  assert.deepEqual(feedbackEffectsForTransition(erased, undone, { type: "undo" }), ["undo"]);
  assert.deepEqual(feedbackEffectsForTransition(undone, redone, { type: "redo" }), ["redo"]);
});

test("game-view-model — emits invalid exactly once when redo restores a conflict", () => {
  const initial = createGame(PUZZLES[1]);
  const blank = initial.givens.findIndex((given) => !given);
  const conflictingDigit = initial.grid.find(
    (value, index) => value !== null && Math.floor(index / 9) === Math.floor(blank / 9),
  );
  const placed = gameReducer(initial, { type: "placeDigit", index: blank, digit: conflictingDigit });
  const undone = gameReducer(placed, { type: "undo" });
  const redone = gameReducer(undone, { type: "redo" });

  assert.deepEqual(feedbackEffectsForTransition(undone, redone, { type: "redo" }), [
    "redo",
    "invalid",
  ]);
});

test("game-view-model — emits invalid exactly once when redo restores an answer-check mismatch", () => {
  const initial = createSessionGame(PUZZLES.find((puzzle) => puzzle.difficulty === "medium"), true);
  const mismatch = initial.grid.flatMap((value, index) => {
    if (value !== null) {
      return [];
    }
    const wrong = [...candidatesFor(initial.grid, index)].find(
      (digit) => digit !== initial.solution[index],
    );
    return wrong === undefined ? [] : [{ digit: wrong, index }];
  })[0];
  const placed = gameReducer(initial, {
    type: "placeDigit",
    index: mismatch.index,
    digit: mismatch.digit,
  });
  const undone = gameReducer(placed, { type: "undo" });
  const redone = gameReducer(undone, { type: "redo" });

  assert.deepEqual(feedbackEffectsForTransition(undone, redone, { type: "redo" }), [
    "redo",
    "invalid",
  ]);
});

test("game-view-model — creates a distinct monotonic token for repeated announcement text", () => {
  const first = nextGameAnnouncement(INITIAL_GAME_ANNOUNCEMENT, "Same warning");
  const second = nextGameAnnouncement(first, "Same warning");

  assert.deepEqual(first, { message: "Same warning", sequence: 1 });
  assert.deepEqual(second, { message: "Same warning", sequence: 2 });
  assert.deepEqual(gameAnnouncementPresentation(first), {
    domId: "game-announcement-1",
    key: 1,
    spokenMessage: "Same warning",
  });
  assert.deepEqual(gameAnnouncementPresentation(second), {
    domId: "game-announcement-2",
    key: 2,
    spokenMessage: "Same warning",
  });
});

// ---------------------------------------------------------------------------
// game-safe-area — from game/game-safe-area.test.ts
// (the nativeSafeAreaPadding case is dropped along with the function: Step 4)
// ---------------------------------------------------------------------------

test("game-safe-area — emits CSS env maximums on web", () => {
  assert.deepEqual(webSafeAreaPadding(16), {
    paddingBottom: "max(16px, env(safe-area-inset-bottom))",
    paddingLeft: "max(16px, env(safe-area-inset-left))",
    paddingRight: "max(16px, env(safe-area-inset-right))",
    paddingTop: "max(16px, env(safe-area-inset-top))",
  });
});

// ---------------------------------------------------------------------------
// pointer — from platform/pointer.test.ts (web half only — native has no web target here)
// ---------------------------------------------------------------------------

test("pointer — preserves Pencil pressure and tilt", () => {
  const event = {
    buttons: 1,
    clientX: 120,
    clientY: 80,
    pointerType: "pen",
    pressure: 0.7,
    tiltX: 12,
    tiltY: -8,
  };

  assert.deepEqual(normalizeWebPointer(event, "move"), {
    hovering: false,
    kind: "pencil",
    phase: "move",
    pressure: 0.7,
    tiltX: 12,
    tiltY: -8,
    x: 120,
    y: 80,
  });
});

test("pointer — clamps sensor values and defaults missing or invalid values", () => {
  const event = {
    buttons: 0,
    clientX: 0,
    clientY: 0,
    pointerType: "touch",
    pressure: Number.NaN,
    tiltX: undefined,
    tiltY: 120,
  };

  const normalized = normalizeWebPointer(event, "move");
  assert.equal(normalized.hovering, false);
  assert.equal(normalized.pressure, 0);
  assert.equal(normalized.tiltX, 0);
  assert.equal(normalized.tiltY, 90);
});

for (const [pointerType, kind] of [
  ["pen", "pencil"],
  ["touch", "touch"],
  ["mouse", "mouse"],
  ["", "unknown"],
  ["eraser", "unknown"],
]) {
  test(`pointer — maps ${pointerType || "(empty)"} to ${kind}`, () => {
    const event = {
      buttons: 1,
      clientX: 4,
      clientY: 8,
      pointerType,
      pressure: 0,
      tiltX: 0,
      tiltY: 0,
    };

    assert.equal(normalizeWebPointer(event, "down").kind, kind);
  });
}

for (const [name, pointerType, phase, buttons, hovering] of [
  ["pencil move without buttons", "pen", "move", 0, true],
  ["mouse move without buttons", "mouse", "move", 0, true],
  ["touch move without buttons", "touch", "move", 0, false],
  ["pencil down without buttons", "pen", "down", 0, false],
  ["pencil move with a button", "pen", "move", 1, false],
]) {
  test(`pointer — ${name}`, () => {
    const event = {
      buttons,
      clientX: 4,
      clientY: 8,
      pointerType,
      pressure: 0,
      tiltX: 0,
      tiltY: 0,
    };

    assert.equal(normalizeWebPointer(event, phase).hovering, hovering);
  });
}

// ---------------------------------------------------------------------------
// palette — pins the ten colours carried over from the Expo app to the exact
// hex values index.css must keep serving (Step 6)
// ---------------------------------------------------------------------------

/**
 * Written out here rather than imported, because index.css is now the only
 * place these live: the TypeScript copy they used to be compared against had
 * no readers, and the 3D materials never read it either. The point of the test
 * is unchanged — these ten must not drift from the ported palette — but it now
 * pins the live tokens to the values themselves.
 */
const PORTED_PALETTE = {
  "--color-canvas": "#18120f",
  "--color-charcoal": "#2a211c",
  "--color-cream": "#f7f0e2",
  "--color-cream-muted": "#e4dac8",
  "--color-ink": "#34251e",
  "--color-ink-muted": "#756257",
  "--color-vermilion": "#a7342d",
  "--color-walnut": "#5b321f",
  "--color-walnut-dark": "#2d1a12",
  "--color-walnut-light": "#8a5535",
};

test("index.css still carries the ten ported palette colours byte-for-byte", () => {
  const css = readFileSync(new URL("../src/index.css", import.meta.url), "utf8");
  for (const [token, value] of Object.entries(PORTED_PALETTE)) {
    assert.match(
      css,
      new RegExp(`${token}:\\s*${value};`),
      `${token} in index.css must be ${value}`,
    );
  }
});

// ---------------------------------------------------------------------------
// canvas-key — board-error-boundary bumps this on every retry (Step 5)
// ---------------------------------------------------------------------------

test("board-error-boundary — each retry asks for a fresh canvas", () => {
  assert.equal(nextCanvasKey(0), 1);
  assert.equal(nextCanvasKey(7), 8);
});
