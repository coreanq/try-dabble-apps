/* eslint-disable react/no-unknown-property -- R3F intrinsic elements use Three.js properties. */
import { Suspense, useEffect, useMemo, useRef } from 'react';
import { LinearFilter, OrthographicCamera, RepeatWrapping, SRGBColorSpace, TextureLoader } from 'three';

import { useLoader, useThree } from '@react-three/fiber';
import type { GameState } from '@/lib/sudoku/domain/game-state';
import type { CellIndex, Digit, NormalizedPointer } from '@/lib/types';

import { configureBoardCamera } from '@/lib/board3d/board-camera';
import { BoardMesh } from './board-mesh';
import { DigitTile } from './digit-tile';
import { SCENE_ASSET_SOURCES } from '@/lib/board3d/scene-assets';
import { usePhysicsEffects } from '@/lib/board3d/use-physics-effects';

export interface BoardCanvasProps {
  readonly errorMessage: string;
  readonly state: GameState;
  readonly onSelectCell: (index: CellIndex) => void;
  readonly onPickDigit?: (digit: Digit) => void;
  readonly onPhysicsCollision?: (relativeImpactVelocity: number) => void;
  readonly onDropDigit: (
    index: CellIndex,
    digit: Digit,
    pointer: NormalizedPointer,
  ) => void;
  readonly reducedMotion: boolean;
  readonly retryLabel: string;
}

type BoardSceneProps = Pick<
  BoardCanvasProps,
  'state' | 'onSelectCell' | 'onPhysicsCollision' | 'reducedMotion'
> & { readonly showEditableTargets?: boolean };

function ResponsiveCamera() {
  const get = useThree(({ get }) => get);
  const size = useThree(({ size }) => size);
  const invalidate = useThree(({ invalidate }) => invalidate);

  useEffect(() => {
    const camera = get().camera;
    if (!(camera instanceof OrthographicCamera) || size.width <= 0 || size.height <= 0) {
      return;
    }

    configureBoardCamera(camera, { height: size.height, width: size.width });
    invalidate();
  }, [get, invalidate, size.height, size.width]);

  return null;
}

function LoadedBoard({
  state,
  onSelectCell,
  reducedMotion,
  showEditableTargets,
}: Pick<BoardSceneProps, 'state' | 'onSelectCell' | 'reducedMotion' | 'showEditableTargets'>) {
  const loadedDigitAtlas = useLoader(
    TextureLoader,
    SCENE_ASSET_SOURCES.digitAtlas,
  );
  const loadedWoodTexture = useLoader(
    TextureLoader,
    SCENE_ASSET_SOURCES.wood,
  );
  const invalidate = useThree(({ invalidate }) => invalidate);
  const digitAtlas = useMemo(() => {
    const texture = loadedDigitAtlas.clone();
    texture.colorSpace = SRGBColorSpace;
    texture.magFilter = LinearFilter;
    texture.minFilter = LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
  }, [loadedDigitAtlas]);
  const woodTexture = useMemo(() => {
    const texture = loadedWoodTexture.clone();
    texture.colorSpace = SRGBColorSpace;
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(2, 2);
    texture.needsUpdate = true;
    return texture;
  }, [loadedWoodTexture]);

  useEffect(() => {
    invalidate();
    return () => {
      digitAtlas.dispose();
      woodTexture.dispose();
    };
  }, [digitAtlas, invalidate, woodTexture]);

  return (
    <>
      <BoardMesh
        onSelectCell={onSelectCell}
        showEditableTargets={showEditableTargets}
        state={state}
        woodTexture={woodTexture}
      />
      <DigitTile digitAtlas={digitAtlas} reducedMotion={reducedMotion} state={state} />
    </>
  );
}

function PhysicsEffectLayer({
  state,
  reducedMotion,
  onPhysicsCollision,
}: Pick<BoardSceneProps, 'state' | 'reducedMotion' | 'onPhysicsCollision'>) {
  const previousGrid = useRef(state.grid);
  const { beginDrop, snapshots } = usePhysicsEffects(onPhysicsCollision);

  useEffect(() => {
    state.grid.forEach((digit, index) => {
      if (
        digit !== null
        && !state.givens[index]
        && previousGrid.current[index] !== digit
      ) {
        beginDrop({
          cell: index,
          impulse: reducedMotion ? 0 : 0.15,
          layout: state.layout,
          lift: reducedMotion ? 0.08 : 0.5,
        });
      }
    });
    previousGrid.current = state.grid;
  }, [beginDrop, reducedMotion, state.givens, state.grid, state.layout]);

  return snapshots.map((snapshot) => (
    <mesh
      castShadow
      key={snapshot.id}
      position={[...snapshot.position]}
      quaternion={[...snapshot.quaternion]}
      receiveShadow
    >
      <boxGeometry args={[
        0.76 * 9 / state.layout.size,
        0.18,
        0.76 * 9 / state.layout.size,
      ]} />
      <meshStandardMaterial color="#fff8e8" metalness={0.02} roughness={0.48} />
    </mesh>
  ));
}

export function BoardScene({
  state,
  onSelectCell,
  onPhysicsCollision,
  reducedMotion,
  showEditableTargets = false,
}: BoardSceneProps) {
  return (
    <>
      <color args={['#18120f']} attach="background" />
      <ambientLight intensity={1.7} />
      <directionalLight
        castShadow
        intensity={2.4}
        position={[-4, 9, 6]}
        shadow-camera-bottom={-7}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-mapSize-height={1024}
        shadow-mapSize-width={1024}
      />
      <ResponsiveCamera />
      <Suspense fallback={null}>
        <LoadedBoard
          onSelectCell={onSelectCell}
          reducedMotion={reducedMotion}
          showEditableTargets={showEditableTargets}
          state={state}
        />
      </Suspense>
      <PhysicsEffectLayer
        onPhysicsCollision={onPhysicsCollision}
        reducedMotion={reducedMotion}
        state={state}
      />
    </>
  );
}
