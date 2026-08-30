import { Body, Box, Plane, Vec3, World } from 'cannon-es';

import type { CellIndex } from '@/lib/types';
import type { SudokuLayout } from '@/lib/sudoku/domain/layout';

import { cellToWorld, cellWorldSize } from './scene-math.ts';

const FIXED_TIME_STEP = 1 / 60;
const MAX_DELTA = 1 / 15;
const MAX_SUB_STEPS = 3;
const MAX_ACTIVE_BODIES = 12;
const SETTLE_AFTER_SECONDS = 1.2;

export interface BeginDropOptions {
  readonly cell: CellIndex;
  readonly layout?: SudokuLayout;
  readonly lift: number;
  readonly impulse: number;
}

export interface PhysicsSnapshot {
  readonly id: number;
  readonly cell: CellIndex;
  readonly position: readonly [number, number, number];
  readonly quaternion: readonly [number, number, number, number];
  readonly velocity: readonly [number, number, number];
  readonly settled: boolean;
}

export interface PhysicsWorld {
  readonly beginDrop: (options: BeginDropOptions) => number;
  readonly step: (delta: number) => boolean;
  readonly snapshot: (id: number) => PhysicsSnapshot;
  readonly snapshots: () => readonly PhysicsSnapshot[];
  readonly activeBodyCount: () => number;
  readonly cancel: (id?: number) => void;
  readonly setCollisionHandler: (
    handler?: (relativeImpactVelocity: number) => void,
  ) => void;
  readonly pause: () => void;
  readonly resume: () => void;
  readonly dispose: () => void;
}

interface CollisionEvent {
  readonly contact: {
    readonly getImpactVelocityAlongNormal: () => number;
  };
}

interface PhysicsEntry {
  readonly id: number;
  readonly cell: CellIndex;
  readonly collisionListener: (event: CollisionEvent) => void;
  body: Body | null;
  elapsed: number;
  settled: boolean;
  settledSnapshot: PhysicsSnapshot | null;
}

function assertFiniteNonNegative(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a finite non-negative number.`);
  }
}

function presentationSnapshot(entry: PhysicsEntry): PhysicsSnapshot {
  if (entry.settledSnapshot) {
    return entry.settledSnapshot;
  }
  const body = entry.body;
  if (!body) {
    throw new Error(`Physics effect ${entry.id} has no presentation body.`);
  }
  return Object.freeze({
    cell: entry.cell,
    id: entry.id,
    position: Object.freeze([body.position.x, body.position.y, body.position.z]) as readonly [number, number, number],
    quaternion: Object.freeze([
      body.quaternion.x,
      body.quaternion.y,
      body.quaternion.z,
      body.quaternion.w,
    ]) as readonly [number, number, number, number],
    settled: entry.settled,
    velocity: Object.freeze([body.velocity.x, body.velocity.y, body.velocity.z]) as readonly [number, number, number],
  });
}

export function createPhysicsWorld(): PhysicsWorld {
  const world = new World({ allowSleep: true, gravity: new Vec3(0, -9.82, 0) });
  const board = new Body({ mass: 0, shape: new Plane() });
  board.position.set(0, 0.18, 0);
  board.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  world.addBody(board);

  const entries = new Map<number, PhysicsEntry>();
  const insertionOrder: number[] = [];
  let nextId = 1;
  let paused = false;
  let disposed = false;
  let collisionHandler: ((relativeImpactVelocity: number) => void) | undefined;

  const detachBody = (entry: PhysicsEntry): void => {
    const body = entry.body;
    if (!body) {
      return;
    }
    body.removeEventListener('collide', entry.collisionListener);
    world.removeBody(body);
    entry.body = null;
  };

  const settle = (entry: PhysicsEntry): void => {
    const body = entry.body;
    if (!body || entry.settled) {
      return;
    }
    body.velocity.setZero();
    body.angularVelocity.setZero();
    body.force.setZero();
    body.torque.setZero();
    entry.settled = true;
    entry.settledSnapshot = presentationSnapshot(entry);
    detachBody(entry);
  };

  const remove = (id: number): void => {
    const entry = entries.get(id);
    if (!entry) {
      return;
    }
    detachBody(entry);
    entries.delete(id);
    const orderIndex = insertionOrder.indexOf(id);
    if (orderIndex >= 0) {
      insertionOrder.splice(orderIndex, 1);
    }
  };

  return Object.freeze({
    beginDrop({ cell, impulse, layout, lift }: BeginDropOptions): number {
      if (disposed) {
        throw new Error('Physics world has been disposed.');
      }
      assertFiniteNonNegative(lift, 'lift');
      assertFiniteNonNegative(impulse, 'impulse');
      if (insertionOrder.length >= MAX_ACTIVE_BODIES) {
        remove(insertionOrder[0]!);
      }

      const [x, y, z] = cellToWorld(cell, layout);
      const tileScale = cellWorldSize(layout);
      const body = new Body({
        allowSleep: true,
        angularDamping: 0.86,
        linearDamping: 0.38,
        mass: 0.12,
        position: new Vec3(x, y + lift, z),
        shape: new Box(new Vec3(0.38 * tileScale, 0.09, 0.38 * tileScale)),
        sleepSpeedLimit: 0.08,
        sleepTimeLimit: 0.22,
      });
      body.applyImpulse(
        new Vec3(0, Math.min(impulse, 0.2), 0),
        new Vec3(0.16, 0, -0.12),
      );
      body.angularVelocity.set(
        Math.min(impulse, 0.2) * 2,
        Math.min(impulse, 0.2),
        -Math.min(impulse, 0.2) * 1.5,
      );
      const collisionListener = (event: CollisionEvent): void => {
        const impact = Math.abs(event.contact.getImpactVelocityAlongNormal());
        if (impact >= 0.35) {
          collisionHandler?.(impact);
        }
      };
      body.addEventListener('collide', collisionListener);
      world.addBody(body);

      const id = nextId;
      nextId += 1;
      entries.set(id, {
        body,
        cell,
        collisionListener,
        elapsed: 0,
        id,
        settled: false,
        settledSnapshot: null,
      });
      insertionOrder.push(id);
      return id;
    },

    step(delta: number): boolean {
      if (
        disposed
        || paused
        || ![...entries.values()].some((entry) => entry.body !== null)
        || !Number.isFinite(delta)
        || delta <= 0
      ) {
        return false;
      }

      const clampedDelta = Math.min(delta, MAX_DELTA);
      world.step(FIXED_TIME_STEP, clampedDelta, MAX_SUB_STEPS);
      let active = false;
      entries.forEach((entry) => {
        if (entry.settled) {
          return;
        }
        entry.elapsed += clampedDelta;
        const body = entry.body;
        if (!body) {
          return;
        }
        if (body.sleepState === Body.SLEEPING || entry.elapsed >= SETTLE_AFTER_SECONDS) {
          settle(entry);
          return;
        }
        active = true;
      });
      return active;
    },

    snapshot(id: number): PhysicsSnapshot {
      const entry = entries.get(id);
      if (!entry) {
        throw new Error(`Unknown physics effect: ${id}`);
      }
      return presentationSnapshot(entry);
    },

    snapshots(): readonly PhysicsSnapshot[] {
      return Object.freeze(
        insertionOrder.flatMap((id) => {
          const entry = entries.get(id);
          return entry ? [presentationSnapshot(entry)] : [];
        }),
      );
    },

    activeBodyCount(): number {
      return world.bodies.filter((body) => body !== board && body.type === Body.DYNAMIC).length;
    },

    cancel(id?: number): void {
      if (id === undefined) {
        [...insertionOrder].forEach(remove);
        return;
      }
      remove(id);
    },

    setCollisionHandler(handler?: (relativeImpactVelocity: number) => void): void {
      collisionHandler = handler;
    },

    pause(): void {
      paused = true;
      world.accumulator = 0;
    },

    resume(): void {
      paused = false;
      world.accumulator = 0;
    },

    dispose(): void {
      if (disposed) {
        return;
      }
      [...insertionOrder].forEach(remove);
      world.removeBody(board);
      world.accumulator = 0;
      disposed = true;
    },
  });
}
