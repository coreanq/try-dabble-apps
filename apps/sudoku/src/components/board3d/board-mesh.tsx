/* eslint-disable react/no-unknown-property -- R3F intrinsic elements use Three.js properties. */
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import {
  BufferGeometry,
  Color,
  InstancedMesh,
  Matrix4,
  Object3D,
  Texture,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

import type { GameState } from '@/lib/sudoku/domain/game-state';
import type { SudokuLayout } from '@/lib/sudoku/domain/layout';
import { useThree, type ThreeEvent } from '@react-three/fiber';
import type { CellIndex } from '@/lib/types';

import { boardCellRole } from '@/lib/board3d/board-cell-role';
import { cellToWorld, cellWorldSize } from '@/lib/board3d/scene-math';

interface BoardMeshProps {
  readonly state: GameState;
  readonly onSelectCell: (index: CellIndex) => void;
  readonly showEditableTargets?: boolean;
  readonly woodTexture: Texture;
}

const NORMAL_COLOR = new Color('#d7d0c0');
const PEER_COLOR = new Color('#ded2aa');
const BOX_COLOR = new Color('#e3c58f');
const SAME_DIGIT_COLOR = new Color('#e7ad58');
const SELECTED_COLOR = new Color('#f0c96d');
const CONFLICT_COLOR = new Color('#b84d42');
const EDITABLE_TARGET_COLOR = new Color('#f6dea0');
const WELL_COLORS = [
  NORMAL_COLOR,
  PEER_COLOR,
  BOX_COLOR,
  SAME_DIGIT_COLOR,
  SELECTED_COLOR,
  CONFLICT_COLOR,
  EDITABLE_TARGET_COLOR,
] as const;

function isSameBox(left: CellIndex, right: CellIndex, layout: SudokuLayout): boolean {
  const leftRow = Math.floor(left / layout.size);
  const rightRow = Math.floor(right / layout.size);
  const leftColumn = left % layout.size;
  const rightColumn = right % layout.size;

  return Math.floor(leftRow / layout.boxRows) === Math.floor(rightRow / layout.boxRows)
    && Math.floor(leftColumn / layout.boxColumns)
      === Math.floor(rightColumn / layout.boxColumns);
}

function isPeer(left: CellIndex, right: CellIndex, layout: SudokuLayout): boolean {
  return Math.floor(left / layout.size) === Math.floor(right / layout.size)
    || left % layout.size === right % layout.size;
}

function cellColor(state: GameState, index: CellIndex, showEditableTargets: boolean): Color {
  const selected = state.selectedIndex;
  const hasConflict = state.conflicts.has(index) || state.incorrectIndexes.includes(index);

  if (hasConflict) {
    return CONFLICT_COLOR;
  }
  if (showEditableTargets && boardCellRole(state, index) !== 'given') {
    return EDITABLE_TARGET_COLOR;
  }
  if (selected === index) {
    return SELECTED_COLOR;
  }
  if (selected === null) {
    return NORMAL_COLOR;
  }

  const selectedDigit = state.grid[selected];
  if (selectedDigit !== null && state.grid[index] === selectedDigit) {
    return SAME_DIGIT_COLOR;
  }
  if (isSameBox(selected, index, state.layout)) {
    return BOX_COLOR;
  }
  if (isPeer(selected, index, state.layout)) {
    return PEER_COLOR;
  }

  return NORMAL_COLOR;
}

interface WellInstancesProps {
  readonly color: Color;
  readonly geometry: BufferGeometry;
  readonly indexes: readonly CellIndex[];
  readonly layout: SudokuLayout;
}

function WellInstances({ color, geometry, indexes, layout }: WellInstancesProps) {
  const instancesRef = useRef<InstancedMesh>(null);
  const invalidate = useThree(({ invalidate }) => invalidate);

  useLayoutEffect(() => {
    const instances = instancesRef.current;
    if (!instances) {
      return;
    }

    const transform = new Object3D();
    indexes.forEach((cellIndex, instanceIndex) => {
      const [x, , z] = cellToWorld(cellIndex, layout);
      transform.position.set(x, 0.11, z);
      transform.rotation.set(0, 0, 0);
      transform.updateMatrix();
      instances.setMatrixAt(instanceIndex, transform.matrix);
    });
    instances.count = indexes.length;
    instances.instanceMatrix.needsUpdate = true;
    invalidate();
  }, [indexes, invalidate, layout]);

  return (
    <instancedMesh args={[undefined, undefined, layout.cellCount]} ref={instancesRef} receiveShadow>
      <primitive attach="geometry" object={geometry} />
      <meshStandardMaterial
        color={color}
        emissive={color === EDITABLE_TARGET_COLOR ? '#5a3600' : '#000000'}
        emissiveIntensity={color === EDITABLE_TARGET_COLOR ? 0.16 : 0}
        metalness={0.03}
        roughness={0.78}
      />
    </instancedMesh>
  );
}

export function BoardMesh({
  state,
  onSelectCell,
  showEditableTargets = false,
  woodTexture,
}: BoardMeshProps) {
  const invalidate = useThree(({ invalidate }) => invalidate);
  const separatorsRef = useRef<InstancedMesh>(null);
  const hitCellsRef = useRef<InstancedMesh>(null);
  const warningMarkersRef = useRef<InstancedMesh>(null);
  const cellSize = cellWorldSize(state.layout);
  const wellGeometry = useMemo(
    () => new RoundedBoxGeometry(
      cellSize * 0.88,
      0.12,
      cellSize * 0.88,
      2,
      cellSize * 0.09,
    ),
    [cellSize],
  );
  const baseGeometry = useMemo(() => new RoundedBoxGeometry(10.2, 0.36, 10.2, 4, 0.22), []);
  const horizontalSeparators = useMemo(
    () => Array.from(
      { length: state.layout.size / state.layout.boxRows + 1 },
      (_, index) => -4.5 + index * state.layout.boxRows * cellSize,
    ),
    [cellSize, state.layout.boxRows, state.layout.size],
  );
  const verticalSeparators = useMemo(
    () => Array.from(
      { length: state.layout.size / state.layout.boxColumns + 1 },
      (_, index) => -4.5 + index * state.layout.boxColumns * cellSize,
    ),
    [cellSize, state.layout.boxColumns, state.layout.size],
  );
  const separatorCount = horizontalSeparators.length + verticalSeparators.length;
  const conflictIndexes = useMemo(
    () => Array.from({ length: state.layout.cellCount }, (_, index) => index).filter(
      (index) => state.conflicts.has(index) || state.incorrectIndexes.includes(index),
    ),
    [state.conflicts, state.incorrectIndexes, state.layout.cellCount],
  );
  const wellGroups = useMemo(() => {
    const indexes = Array.from({ length: state.layout.cellCount }, (_, index) => index);
    return WELL_COLORS.map((color) => ({
      color,
      indexes: indexes.filter((index) => cellColor(state, index, showEditableTargets) === color),
    }));
  }, [showEditableTargets, state]);
  const selectedPosition = state.selectedIndex === null
    ? null
    : cellToWorld(state.selectedIndex, state.layout);

  useEffect(() => () => {
    baseGeometry.dispose();
    wellGeometry.dispose();
  }, [baseGeometry, wellGeometry]);

  useLayoutEffect(() => {
    const hitCells = hitCellsRef.current;
    if (!hitCells) {
      return;
    }

    const transform = new Object3D();
    for (let index = 0; index < state.layout.cellCount; index += 1) {
      const [x, , z] = cellToWorld(index, state.layout);
      transform.position.set(x, 0.7, z);
      transform.rotation.set(-Math.PI / 2, 0, 0);
      transform.updateMatrix();
      hitCells.setMatrixAt(index, transform.matrix);
    }

    hitCells.instanceMatrix.needsUpdate = true;
    invalidate();
  }, [invalidate, state.layout]);

  useLayoutEffect(() => {
    const separators = separatorsRef.current;
    if (!separators) {
      return;
    }

    const transform = new Object3D();
    horizontalSeparators.forEach((position, index) => {
      transform.position.set(0, 0.24, position);
      transform.rotation.set(0, 0, 0);
      transform.updateMatrix();
      separators.setMatrixAt(index, transform.matrix);

    });
    verticalSeparators.forEach((position, index) => {
      transform.position.set(position, 0.24, 0);
      transform.rotation.set(0, Math.PI / 2, 0);
      transform.updateMatrix();
      separators.setMatrixAt(index + horizontalSeparators.length, transform.matrix);
    });
    separators.instanceMatrix.needsUpdate = true;
    invalidate();
  }, [horizontalSeparators, invalidate, verticalSeparators]);

  useLayoutEffect(() => {
    const markers = warningMarkersRef.current;
    if (!markers) {
      return;
    }

    const transform = new Matrix4();
    conflictIndexes.forEach((index, markerIndex) => {
      const [x, , z] = cellToWorld(index, state.layout);
      transform.makeTranslation(x + cellSize * 0.31, 0.42, z - cellSize * 0.31);
      markers.setMatrixAt(markerIndex, transform);
    });
    markers.count = conflictIndexes.length;
    markers.instanceMatrix.needsUpdate = true;
    invalidate();
  }, [cellSize, conflictIndexes, invalidate, state.layout]);

  const selectCell = (event: ThreeEvent<MouseEvent>) => {
    if (event.instanceId === undefined) {
      return;
    }

    event.stopPropagation();
    onSelectCell(event.instanceId);
  };

  return (
    <group>
      <mesh geometry={baseGeometry} position={[0, -0.14, 0]} receiveShadow>
        <meshStandardMaterial map={woodTexture} metalness={0.02} roughness={0.66} />
      </mesh>

      {wellGroups.map(({ color, indexes }) => (
        <WellInstances
          color={color}
          geometry={wellGeometry}
          indexes={indexes}
          key={color.getHex()}
          layout={state.layout}
        />
      ))}

      <instancedMesh args={[undefined, undefined, separatorCount]} ref={separatorsRef} receiveShadow>
        <boxGeometry args={[9.3, 0.16, 0.09]} />
        <meshStandardMaterial color="#4e2b1b" metalness={0.04} roughness={0.72} />
      </instancedMesh>

      <instancedMesh args={[undefined, undefined, state.layout.cellCount]} ref={warningMarkersRef}>
        <coneGeometry args={[0.13, 0.2, 3]} />
        <meshStandardMaterial color="#981f2b" emissive="#4e0710" emissiveIntensity={0.3} />
      </instancedMesh>

      {selectedPosition ? (
        <group position={[selectedPosition[0], 0.38, selectedPosition[2]]}>
          <mesh position={[0, 0, -cellSize * 0.43]}>
            <boxGeometry args={[cellSize * 0.92, 0.045, 0.055]} />
            <meshStandardMaterial color="#fff0bb" emissive="#7a4d00" emissiveIntensity={0.2} />
          </mesh>
          <mesh position={[0, 0, cellSize * 0.43]}>
            <boxGeometry args={[cellSize * 0.92, 0.045, 0.055]} />
            <meshStandardMaterial color="#fff0bb" emissive="#7a4d00" emissiveIntensity={0.2} />
          </mesh>
          <mesh position={[-cellSize * 0.43, 0, 0]}>
            <boxGeometry args={[0.055, 0.045, cellSize * 0.92]} />
            <meshStandardMaterial color="#fff0bb" emissive="#7a4d00" emissiveIntensity={0.2} />
          </mesh>
          <mesh position={[cellSize * 0.43, 0, 0]}>
            <boxGeometry args={[0.055, 0.045, cellSize * 0.92]} />
            <meshStandardMaterial color="#fff0bb" emissive="#7a4d00" emissiveIntensity={0.2} />
          </mesh>
        </group>
      ) : null}

      <instancedMesh
        args={[undefined, undefined, state.layout.cellCount]}
        onClick={selectCell}
        ref={hitCellsRef}
      >
        <planeGeometry args={[cellSize, cellSize]} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} transparent />
      </instancedMesh>
    </group>
  );
}
