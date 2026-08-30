/* eslint-disable react/no-unknown-property -- R3F intrinsic elements use Three.js properties. */
import { useEffect, useMemo } from 'react';
import {
  DoubleSide,
  LinearFilter,
  MeshBasicMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  TextureLoader,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

import { useLoader, type ThreeEvent } from '@react-three/fiber';
import type { Digit } from '@/lib/types';
import type { SudokuLayout } from '@/lib/sudoku/domain/layout';

import { SCENE_ASSET_SOURCES } from '@/lib/board3d/scene-assets';
import { TRAY_HIT_WORLD_SIZE } from '@/lib/board3d/board-layout';

export interface DraggedDigitPresentation {
  readonly digit: Digit;
  readonly lift: number;
  readonly rotationX: number;
  readonly rotationZ: number;
  readonly x: number;
  readonly z: number;
}

interface DigitTrayProps {
  readonly counts: readonly number[];
  readonly draggedDigit: DraggedDigitPresentation | null;
  readonly layout: SudokuLayout;
  readonly onBeginDrag: (digit: Digit, event: ThreeEvent<unknown>) => void;
}

function createAtlasGeometry(digit: Digit): PlaneGeometry {
  const geometry = new PlaneGeometry(0.56, 0.56);
  const atlasColumn = (digit - 1) % 3;
  const atlasRowFromTop = Math.floor((digit - 1) / 3);
  const uStart = atlasColumn / 3;
  const vStart = 1 - (atlasRowFromTop + 1) / 3;
  const uvs = geometry.attributes.uv;
  if (!uvs) {
    throw new Error('Digit tray atlas geometry requires UV coordinates.');
  }

  for (let index = 0; index < uvs.count; index += 1) {
    uvs.setXY(index, uStart + uvs.getX(index) / 3, vStart + uvs.getY(index) / 3);
  }
  uvs.needsUpdate = true;

  return geometry;
}

export function DigitTray({ counts, draggedDigit, layout, onBeginDrag }: DigitTrayProps) {
  const tileScale = 9 / layout.size;
  const tileSize = 0.76 * tileScale;
  const traySpacing = Math.min(1.38, 8 / Math.max(1, layout.digits.length - 1));
  const loadedDigitAtlas = useLoader(TextureLoader, SCENE_ASSET_SOURCES.digitAtlas);
  const digitAtlas = useMemo(() => {
    const texture = loadedDigitAtlas.clone();
    texture.colorSpace = SRGBColorSpace;
    texture.magFilter = LinearFilter;
    texture.minFilter = LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
  }, [loadedDigitAtlas]);
  const tileGeometry = useMemo(
    () => new RoundedBoxGeometry(tileSize, 0.18, tileSize, 3, 0.1 * tileScale),
    [tileScale, tileSize],
  );
  const glyphGeometries = useMemo(
    () => layout.digits.map((digit) => {
      const geometry = createAtlasGeometry(digit);
      geometry.scale(tileScale, tileScale, 1);
      return geometry;
    }),
    [layout.digits, tileScale],
  );
  const glyphMaterial = useMemo(
    () => new MeshBasicMaterial({
      alphaTest: 0.16,
      color: '#584133',
      map: digitAtlas,
      side: DoubleSide,
      toneMapped: false,
      transparent: true,
    }),
    [digitAtlas],
  );
  const dimmedGlyphMaterial = useMemo(
    () => new MeshBasicMaterial({
      alphaTest: 0.16,
      color: '#9b8c7c',
      map: digitAtlas,
      opacity: 0.56,
      side: DoubleSide,
      toneMapped: false,
      transparent: true,
    }),
    [digitAtlas],
  );

  useEffect(() => () => {
    digitAtlas.dispose();
    glyphGeometries.forEach((geometry) => geometry.dispose());
    dimmedGlyphMaterial.dispose();
    glyphMaterial.dispose();
    tileGeometry.dispose();
  }, [digitAtlas, dimmedGlyphMaterial, glyphGeometries, glyphMaterial, tileGeometry]);

  return (
    <group>
      <mesh position={[0, 0.02, 5.38]} receiveShadow>
        <boxGeometry args={[9.7, 0.18, 1]} />
        <meshStandardMaterial color="#6d3b22" metalness={0.02} roughness={0.72} />
      </mesh>

      {layout.digits.map((digit, index) => (
        <group
          key={digit}
          position={[(index - (layout.digits.length - 1) / 2) * traySpacing, 0.25, 5.38]}
        >
          <mesh castShadow geometry={tileGeometry} receiveShadow>
            <meshStandardMaterial
              color="#f3ead7"
              metalness={0.02}
              opacity={(counts[digit] ?? 0) >= layout.size ? 0.44 : 1}
              roughness={0.52}
              transparent={(counts[digit] ?? 0) >= layout.size}
            />
          </mesh>
          <mesh
            geometry={glyphGeometries[digit - 1]}
            material={(counts[digit] ?? 0) >= layout.size ? dimmedGlyphMaterial : glyphMaterial}
            position={[0, 0.101, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          />
          <mesh
            onPointerDown={(event) => onBeginDrag(digit, event)}
            position={[0, 0.16, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[
              Math.max(TRAY_HIT_WORLD_SIZE, tileSize),
              Math.max(TRAY_HIT_WORLD_SIZE, tileSize),
            ]} />
            <meshBasicMaterial colorWrite={false} depthWrite={false} transparent />
          </mesh>
        </group>
      ))}

      {draggedDigit ? (
        <group
          position={[draggedDigit.x, 0.18 + draggedDigit.lift, draggedDigit.z]}
          rotation={[draggedDigit.rotationX, 0, draggedDigit.rotationZ]}
        >
          <mesh castShadow geometry={tileGeometry} receiveShadow>
            <meshStandardMaterial color="#fff8e8" metalness={0.02} roughness={0.48} />
          </mesh>
          <mesh
            geometry={glyphGeometries[draggedDigit.digit - 1]}
            material={glyphMaterial}
            position={[0, 0.101, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          />
        </group>
      ) : null}
    </group>
  );
}
