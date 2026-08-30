import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import {
  createPhysicsWorld,
  type BeginDropOptions,
  type PhysicsSnapshot,
  type PhysicsWorld,
} from './physics-world.ts';

export interface PhysicsEffects {
  readonly beginDrop: (options: BeginDropOptions) => number;
  readonly cancel: (id?: number) => void;
  readonly snapshots: readonly PhysicsSnapshot[];
}

export function usePhysicsEffects(
  onCollision?: (relativeImpactVelocity: number) => void,
): PhysicsEffects {
  const worldRef = useRef<PhysicsWorld | null>(null);
  /**
   * `dispose()` is terminal — it takes the board body out of the world — and
   * StrictMode mounts, unmounts and mounts again in development, so a world
   * held in state would be dead by the second mount and the first drop would
   * throw. Hand out the live world instead, minting a new one whenever the
   * previous was disposed. The audio and background-music controllers survive
   * the same double mount by pairing mount() with dispose().
   */
  const physics = useCallback((): PhysicsWorld => {
    worldRef.current ??= createPhysicsWorld();
    return worldRef.current;
  }, []);
  const invalidate = useThree(({ invalidate }) => invalidate);
  const [snapshots, setSnapshots] = useState<readonly PhysicsSnapshot[]>([]);

  useEffect(() => {
    physics().setCollisionHandler(onCollision);
    return () => physics().setCollisionHandler(undefined);
  }, [onCollision, physics]);

  const beginDrop = useCallback((options: BeginDropOptions): number => {
    const id = physics().beginDrop(options);
    setSnapshots(physics().snapshots());
    invalidate();
    return id;
  }, [invalidate, physics]);

  const cancel = useCallback((id?: number): void => {
    physics().cancel(id);
    setSnapshots(physics().snapshots());
    invalidate();
  }, [invalidate, physics]);

  useFrame((_, delta) => {
    const next = physics().snapshots();
    if (next.length === 0) {
      return;
    }
    const active = physics().step(delta);
    const stepped = physics().snapshots();
    const settledIds = stepped.filter((entry) => entry.settled).map((entry) => entry.id);
    if (settledIds.length > 0) {
      settledIds.forEach((id) => physics().cancel(id));
      setSnapshots(physics().snapshots());
    } else if (active) {
      setSnapshots(stepped);
    }
    if (active) {
      invalidate();
    }
  });

  useEffect(() => {
    const updatePauseState = (): void => {
      if (document.visibilityState !== 'visible') {
        physics().pause();
        return;
      }
      physics().resume();
      if (physics().snapshots().some((entry) => !entry.settled)) {
        invalidate();
      }
    };

    document.addEventListener('visibilitychange', updatePauseState);
    updatePauseState();

    return () => {
      document.removeEventListener('visibilitychange', updatePauseState);
      worldRef.current?.dispose();
      worldRef.current = null;
    };
  }, [invalidate, physics]);

  return useMemo(() => ({ beginDrop, cancel, snapshots }), [beginDrop, cancel, snapshots]);
}
