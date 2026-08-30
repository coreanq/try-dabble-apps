import { useCallback, useEffect, useMemo, useState } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import {
  createPhysicsWorld,
  type BeginDropOptions,
  type PhysicsSnapshot,
} from './physics-world.ts';

export interface PhysicsEffects {
  readonly beginDrop: (options: BeginDropOptions) => number;
  readonly cancel: (id?: number) => void;
  readonly snapshots: readonly PhysicsSnapshot[];
}

export function usePhysicsEffects(
  onCollision?: (relativeImpactVelocity: number) => void,
): PhysicsEffects {
  const [physics] = useState(createPhysicsWorld);
  const invalidate = useThree(({ invalidate }) => invalidate);
  const [snapshots, setSnapshots] = useState<readonly PhysicsSnapshot[]>([]);

  useEffect(() => {
    physics.setCollisionHandler(onCollision);
    return () => physics.setCollisionHandler(undefined);
  }, [onCollision, physics]);

  const beginDrop = useCallback((options: BeginDropOptions): number => {
    const id = physics.beginDrop(options);
    setSnapshots(physics.snapshots());
    invalidate();
    return id;
  }, [invalidate, physics]);

  const cancel = useCallback((id?: number): void => {
    physics.cancel(id);
    setSnapshots(physics.snapshots());
    invalidate();
  }, [invalidate, physics]);

  useFrame((_, delta) => {
    const next = physics.snapshots();
    if (next.length === 0) {
      return;
    }
    const active = physics.step(delta);
    const stepped = physics.snapshots();
    const settledIds = stepped.filter((entry) => entry.settled).map((entry) => entry.id);
    if (settledIds.length > 0) {
      settledIds.forEach((id) => physics.cancel(id));
      setSnapshots(physics.snapshots());
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
        physics.pause();
        return;
      }
      physics.resume();
      if (physics.snapshots().some((entry) => !entry.settled)) {
        invalidate();
      }
    };

    document.addEventListener('visibilitychange', updatePauseState);
    updatePauseState();

    return () => {
      document.removeEventListener('visibilitychange', updatePauseState);
      physics.dispose();
    };
  }, [invalidate, physics]);

  return useMemo(() => ({ beginDrop, cancel, snapshots }), [beginDrop, cancel, snapshots]);
}
