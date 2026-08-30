/* eslint-disable react/no-unknown-property -- R3F intrinsic elements use Three.js properties. */
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import {
  BufferGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  Texture,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

import type { GameState } from '@/lib/sudoku/domain/game-state';
import { useFrame, useThree } from '@react-three/fiber';
import type { CellIndex, Digit } from '@/lib/types';
import type { SudokuLayout } from '@/lib/sudoku/domain/layout';

import { cellToWorld } from '@/lib/board3d/scene-math';
import { completionAnimationDuration, completionTileLift } from '@/lib/board3d/completion-motion';

interface DigitTileProps {
  readonly state: GameState;
  readonly digitAtlas: Texture;
}

interface DigitEntry {
  readonly index: CellIndex;
  readonly digit: Digit;
  readonly given: boolean;
  readonly conflict: boolean;
}

interface NoteEntry {
  readonly index: CellIndex;
  readonly digit: Digit;
}

const USER_TILE_COLOR = '#0f5f60';
const USER_TILE_ACTIVE_COLOR = '#147579';
const USER_TILE_CONFLICT_COLOR = '#a63f49';
const USER_TILE_CONFLICT_ACTIVE_COLOR = '#bd4b55';
const USER_TILE_RIM_COLOR = '#e6b94d';

function createAtlasGeometry(digit: Digit): PlaneGeometry {
  const geometry = new PlaneGeometry(0.56, 0.56);
  const atlasColumn = (digit - 1) % 3;
  const atlasRowFromTop = Math.floor((digit - 1) / 3);
  const uStart = atlasColumn / 3;
  const vStart = 1 - (atlasRowFromTop + 1) / 3;
  const uvs = geometry.attributes.uv;
  if (!uvs) {
    throw new Error('Digit atlas geometry requires UV coordinates.');
  }

  for (let index = 0; index < uvs.count; index += 1) {
    uvs.setXY(index, uStart + uvs.getX(index) / 3, vStart + uvs.getY(index) / 3);
  }
  uvs.needsUpdate = true;

  return geometry;
}

function createGlyphMaterial(digitAtlas: Texture, color: string): MeshBasicMaterial {
  return new MeshBasicMaterial({
    alphaTest: 0.16,
    color,
    map: digitAtlas,
    side: DoubleSide,
    toneMapped: false,
    transparent: true,
  });
}

interface UserTileInstancesProps {
  readonly color: string;
  readonly emissive?: string;
  readonly emissiveIntensity?: number;
  readonly entries: readonly DigitEntry[];
  readonly geometry: BufferGeometry;
  readonly layout: SudokuLayout;
  readonly positionY?: number;
}

function UserTileInstances({
  color,
  emissive = '#000000',
  emissiveIntensity = 0,
  entries,
  geometry,
  layout,
  positionY = 0.32,
}: UserTileInstancesProps) {
  const instancesRef = useRef<InstancedMesh>(null);
  const invalidate = useThree(({ invalidate }) => invalidate);

  useLayoutEffect(() => {
    const instances = instancesRef.current;
    if (!instances) {
      return;
    }

    const transform = new Object3D();
    entries.forEach((entry, instanceIndex) => {
      const [x, , z] = cellToWorld(entry.index, layout);
      transform.position.set(x, positionY, z);
      transform.rotation.set(0, 0, 0);
      transform.updateMatrix();
      instances.setMatrixAt(instanceIndex, transform.matrix);
    });
    instances.count = entries.length;
    instances.instanceMatrix.needsUpdate = true;
    invalidate();
  }, [entries, invalidate, layout, positionY]);

  return (
    <instancedMesh args={[undefined, undefined, layout.cellCount]} ref={instancesRef} receiveShadow>
      <primitive attach="geometry" object={geometry} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        metalness={0.02}
        roughness={0.52}
      />
    </instancedMesh>
  );
}

interface CompletionUserTilesProps {
  readonly entries: readonly DigitEntry[];
  readonly geometry: BufferGeometry;
  readonly glyphGeometries: readonly PlaneGeometry[];
  readonly glyphMaterials: Readonly<{
    readonly conflict: MeshBasicMaterial;
    readonly user: MeshBasicMaterial;
  }>;
  readonly layout: SudokuLayout;
  readonly reducedMotion: boolean;
}

function CompletionUserTiles({
  entries,
  geometry,
  glyphGeometries,
  glyphMaterials,
  layout,
  reducedMotion,
}: CompletionUserTilesProps) {
  const groups = useRef<(Group | null)[]>([]);
  const startedAt = useRef<number | null>(null);
  const invalidate = useThree(({ invalidate }) => invalidate);

  useEffect(() => {
    invalidate();
  }, [invalidate]);

  useFrame(({ clock }) => {
    const elapsedTime = clock.getElapsedTime();
    startedAt.current ??= elapsedTime;
    const elapsed = elapsedTime - startedAt.current;
    entries.forEach((_, entryIndex) => {
      const group = groups.current[entryIndex];
      if (!group) {
        return;
      }
      group.position.y = 0.32 + completionTileLift(
        entryIndex,
        entries.length,
        elapsed,
        reducedMotion,
      );
    });

    if (elapsed < completionAnimationDuration(reducedMotion)) {
      invalidate();
    }
  });

  return entries.map((entry, entryIndex) => {
    const [x, , z] = cellToWorld(entry.index, layout);
    return (
      <group
        key={entry.index}
        position={[x, 0.32, z]}
        ref={(group) => {
          groups.current[entryIndex] = group;
        }}
      >
        <mesh castShadow geometry={geometry} receiveShadow>
          <meshStandardMaterial
            color={entry.conflict ? USER_TILE_CONFLICT_COLOR : USER_TILE_COLOR}
            metalness={0.08}
            roughness={0.4}
          />
        </mesh>
        <mesh
          geometry={glyphGeometries[entry.digit - 1]}
          material={entry.conflict ? glyphMaterials.conflict : glyphMaterials.user}
          position={[0, 0.101, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        />
      </group>
    );
  });
}

export function DigitTile({ state, digitAtlas, reducedMotion = false }: DigitTileProps & { readonly reducedMotion?: boolean }) {
  const tileScale = 9 / state.layout.size;
  const tileGeometry = useMemo(
    () => new RoundedBoxGeometry(
      0.76 * tileScale,
      0.18,
      0.76 * tileScale,
      3,
      0.1 * tileScale,
    ),
    [tileScale],
  );
  const userRimGeometry = useMemo(
    () => new RoundedBoxGeometry(
      0.88 * tileScale,
      0.1,
      0.88 * tileScale,
      3,
      0.11 * tileScale,
    ),
    [tileScale],
  );
  const glyphGeometries = useMemo(
    () => Array.from({ length: 9 }, (_, index) => {
      const geometry = createAtlasGeometry((index + 1) as Digit);
      geometry.scale(tileScale, tileScale, 1);
      return geometry;
    }),
    [tileScale],
  );
  const glyphMaterials = useMemo(
    () => ({
      conflict: createGlyphMaterial(digitAtlas, '#a7192d'),
      given: createGlyphMaterial(digitAtlas, '#38271f'),
      note: createGlyphMaterial(digitAtlas, '#584133'),
      user: createGlyphMaterial(digitAtlas, '#fff4dc'),
    }),
    [digitAtlas],
  );
  const entries = useMemo(
    () => state.grid.flatMap((digit, index): DigitEntry[] => {
      if (digit === null) {
        return [];
      }

      return [{
        conflict: state.conflicts.has(index) || state.incorrectIndexes.includes(index),
        digit,
        given: state.givens[index] ?? false,
        index,
      }];
    }),
    [state.conflicts, state.givens, state.grid, state.incorrectIndexes],
  );
  const inactiveUserEntries = useMemo(
    () => state.status === 'completed'
      ? []
      : entries.filter((entry) => !entry.given && entry.index !== state.selectedIndex),
    [entries, state.selectedIndex, state.status],
  );
  const inactiveNormalEntries = useMemo(
    () => inactiveUserEntries.filter((entry) => !entry.conflict),
    [inactiveUserEntries],
  );
  const inactiveConflictEntries = useMemo(
    () => inactiveUserEntries.filter((entry) => entry.conflict),
    [inactiveUserEntries],
  );
  const visibleUserEntries = useMemo(
    () => state.status === 'completed' ? [] : entries.filter((entry) => !entry.given),
    [entries, state.status],
  );
  const activeUserEntry = state.status === 'completed'
    ? undefined
    : entries.find((entry) => !entry.given && entry.index === state.selectedIndex);
  const completedUserEntries = useMemo(
    () => state.status === 'completed' ? entries.filter((entry) => !entry.given) : [],
    [entries, state.status],
  );
  const noteEntries = useMemo(
    () => state.notes.flatMap((notes, index): NoteEntry[] =>
      state.grid[index] === null ? notes.map((digit) => ({ digit, index })) : []),
    [state.grid, state.notes],
  );

  useEffect(() => () => {
    tileGeometry.dispose();
    userRimGeometry.dispose();
    glyphGeometries.forEach((geometry) => geometry.dispose());
    glyphMaterials.conflict.dispose();
    glyphMaterials.given.dispose();
    glyphMaterials.note.dispose();
    glyphMaterials.user.dispose();
  }, [glyphGeometries, glyphMaterials, tileGeometry, userRimGeometry]);

  return (
    <group>
      <UserTileInstances
        color={USER_TILE_RIM_COLOR}
        emissive="#644000"
        emissiveIntensity={0.18}
        entries={visibleUserEntries}
        geometry={userRimGeometry}
        layout={state.layout}
        positionY={0.25}
      />
      <UserTileInstances
        color={USER_TILE_COLOR}
        entries={inactiveNormalEntries}
        geometry={tileGeometry}
        layout={state.layout}
      />
      <UserTileInstances
        color={USER_TILE_CONFLICT_COLOR}
        entries={inactiveConflictEntries}
        geometry={tileGeometry}
        layout={state.layout}
      />

      {state.status === 'completed' ? (
        <CompletionUserTiles
          entries={completedUserEntries}
          geometry={tileGeometry}
          glyphGeometries={glyphGeometries}
          glyphMaterials={glyphMaterials}
          layout={state.layout}
          reducedMotion={reducedMotion}
        />
      ) : null}

      {activeUserEntry ? (
        <mesh
          castShadow
          geometry={tileGeometry}
          position={[
            cellToWorld(activeUserEntry.index, state.layout)[0],
            0.32,
            cellToWorld(activeUserEntry.index, state.layout)[2],
          ]}
          receiveShadow
        >
          <meshStandardMaterial
            color={activeUserEntry.conflict
              ? USER_TILE_CONFLICT_ACTIVE_COLOR
              : USER_TILE_ACTIVE_COLOR}
            emissive={activeUserEntry.conflict ? '#4d090f' : '#063536'}
            emissiveIntensity={0.2}
            metalness={0.08}
            roughness={0.4}
          />
        </mesh>
      ) : null}

      {entries.map((entry) => {
        if (state.status === 'completed' && !entry.given) {
          return null;
        }
        const [x, , z] = cellToWorld(entry.index, state.layout);
        const material = entry.given
          ? (entry.conflict ? glyphMaterials.conflict : glyphMaterials.given)
          : glyphMaterials.user;

        return (
          <mesh
            geometry={glyphGeometries[entry.digit - 1]}
            key={entry.index}
            material={material}
            position={[x, entry.given ? 0.205 : 0.42, z]}
            rotation={[-Math.PI / 2, 0, 0]}
          />
        );
      })}

      {noteEntries.map((entry) => {
        const [x, , z] = cellToWorld(entry.index, state.layout);
        const noteColumn = (entry.digit - 1) % 3;
        const noteRow = Math.floor((entry.digit - 1) / 3);
        const noteRowCenter = (Math.ceil(state.layout.size / 3) - 1) / 2;
        return (
          <mesh
            geometry={glyphGeometries[entry.digit - 1]}
            key={`${entry.index}-${entry.digit}`}
            material={glyphMaterials.note}
            position={[
              x + (noteColumn - 1) * 0.24 * tileScale,
              0.245,
              z + (noteRow - noteRowCenter) * 0.24 * tileScale,
            ]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={[0.36, 0.36, 0.36]}
          />
        );
      })}
    </group>
  );
}
