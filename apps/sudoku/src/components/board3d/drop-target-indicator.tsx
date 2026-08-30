/* eslint-disable react/no-unknown-property -- R3F intrinsic elements use Three.js properties. */
import type { CellIndex } from '@/lib/types';
import type { SudokuLayout } from '@/lib/sudoku/domain/layout';

import { cellToWorld, cellWorldSize } from '@/lib/board3d/scene-math';

interface DropTargetIndicatorProps {
  readonly cell: CellIndex;
  readonly layout: SudokuLayout;
}

export function DropTargetIndicator({ cell, layout }: DropTargetIndicatorProps) {
  const [x, , z] = cellToWorld(cell, layout);
  const size = cellWorldSize(layout) * 0.9;
  const edge = size * 0.48;

  return (
    <group position={[x, 0.48, z]}>
      <mesh>
        <boxGeometry args={[size, 0.035, size]} />
        <meshStandardMaterial
          color="#ffd768"
          emissive="#9b5c00"
          emissiveIntensity={0.42}
          opacity={0.26}
          transparent
        />
      </mesh>
      <mesh position={[0, 0.025, -edge]}>
        <boxGeometry args={[size, 0.07, 0.07]} />
        <meshStandardMaterial color="#ffe392" emissive="#ad6800" emissiveIntensity={0.7} />
      </mesh>
      <mesh position={[0, 0.025, edge]}>
        <boxGeometry args={[size, 0.07, 0.07]} />
        <meshStandardMaterial color="#ffe392" emissive="#ad6800" emissiveIntensity={0.7} />
      </mesh>
      <mesh position={[-edge, 0.025, 0]}>
        <boxGeometry args={[0.07, 0.07, size]} />
        <meshStandardMaterial color="#ffe392" emissive="#ad6800" emissiveIntensity={0.7} />
      </mesh>
      <mesh position={[edge, 0.025, 0]}>
        <boxGeometry args={[0.07, 0.07, size]} />
        <meshStandardMaterial color="#ffe392" emissive="#ad6800" emissiveIntensity={0.7} />
      </mesh>
    </group>
  );
}
