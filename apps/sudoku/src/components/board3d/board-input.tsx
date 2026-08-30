/* eslint-disable react/no-unknown-property -- R3F intrinsic elements use Three.js properties. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { addAfterEffect, Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { normalizeWebPointer } from '@/lib/pointer';
import type { Digit, NormalizedPointer } from '@/lib/types';
import type { SudokuLayout } from '@/lib/sudoku/domain/layout';

import { BOARD_CAMERA_POSITION, BOARD_CAMERA_TARGET } from '@/lib/board3d/board-camera';
import { BoardScene, type BoardCanvasProps } from './board-scene';
import { pointerPresentation, rayToBoardTarget, type BoardRayTarget } from '@/lib/board3d/board-input';
import { containWebCanvasDrag } from '@/lib/board3d/board-layout';
import { DigitTray, type DraggedDigitPresentation } from './digit-tray';
import { DropTargetIndicator } from './drop-target-indicator';
import { createDemandFrameSampler, createFrameBudget } from '@/lib/board3d/frame-budget';
import type { DemandFrameSampler, RenderQuality } from '@/lib/board3d/frame-budget';

interface DragRecord {
  readonly digit: Digit;
  readonly pointer: NormalizedPointer;
  readonly target: BoardRayTarget | null;
}

interface WebInputSceneProps {
  readonly counts: readonly number[];
  readonly givens: readonly boolean[];
  readonly layout: SudokuLayout;
  readonly onDraggingChange: (dragging: boolean) => void;
  readonly onDropDigit: BoardCanvasProps['onDropDigit'];
  readonly onPickDigit: BoardCanvasProps['onPickDigit'];
}

function WebInputScene({
  counts,
  givens,
  layout,
  onDraggingChange,
  onDropDigit,
  onPickDigit,
}: WebInputSceneProps) {
  const [drag, setDrag] = useState<DragRecord | null>(null);
  const gl = useThree(({ gl }) => gl);
  const cancelDrag = useCallback(() => setDrag(null), []);

  useEffect(() => {
    onDraggingChange(drag !== null);
  }, [drag, onDraggingChange]);

  useEffect(() => {
    const canvas = gl.domElement;
    const restoreTouchAction = containWebCanvasDrag(canvas.style);
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        cancelDrag();
      }
    };

    canvas.addEventListener('lostpointercapture', cancelDrag);
    canvas.addEventListener('pointercancel', cancelDrag);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', cancelDrag);

    return () => {
      canvas.removeEventListener('lostpointercapture', cancelDrag);
      canvas.removeEventListener('pointercancel', cancelDrag);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', cancelDrag);
      restoreTouchAction();
    };
  }, [cancelDrag, gl]);

  const beginDrag = useCallback((digit: Digit, event: ThreeEvent<unknown>) => {
    const sourceEvent = event.nativeEvent as PointerEvent;
    event.stopPropagation();
    if (sourceEvent.target instanceof Element) {
      sourceEvent.target.setPointerCapture(sourceEvent.pointerId);
    }
    onPickDigit?.(digit);
    setDrag({
      digit,
      pointer: normalizeWebPointer(sourceEvent, 'down'),
      target: rayToBoardTarget(event.ray, layout),
    });
  }, [layout, onPickDigit]);

  const moveDrag = useCallback((event: ThreeEvent<PointerEvent>) => {
    setDrag((current) => current ? {
      ...current,
      pointer: normalizeWebPointer(event.nativeEvent, 'move'),
      target: rayToBoardTarget(event.ray, layout),
    } : null);
  }, [layout]);

  const finishDrag = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (!drag) {
      return;
    }

    const pointer = normalizeWebPointer(event.nativeEvent, 'up');
    const target = rayToBoardTarget(event.ray, layout);
    if (target?.cell !== null && target?.cell !== undefined) {
      onDropDigit(target.cell, drag.digit, pointer);
    }
    setDrag(null);
  }, [drag, layout, onDropDigit]);

  const draggedDigit = useMemo((): DraggedDigitPresentation | null => {
    if (!drag?.target) {
      return null;
    }

    return {
      digit: drag.digit,
      ...pointerPresentation(drag.pointer),
      x: drag.target.x,
      z: drag.target.z,
    };
  }, [drag]);

  return (
    <>
      <DigitTray
        counts={counts}
        draggedDigit={draggedDigit}
        layout={layout}
        onBeginDrag={beginDrag}
      />
      {drag?.target?.cell !== null
        && drag?.target?.cell !== undefined
        && !givens[drag.target.cell] ? (
        <DropTargetIndicator cell={drag.target.cell} layout={layout} />
      ) : null}
      <mesh
        onLostPointerCapture={cancelDrag}
        onPointerCancel={cancelDrag}
        onPointerMove={moveDrag}
        onPointerUp={finishDrag}
        position={[0, 0.92, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[24, 24]} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} transparent />
      </mesh>
    </>
  );
}

interface FrameBudgetMonitorProps {
  readonly sampler: DemandFrameSampler;
  readonly onQualityChange: (quality: RenderQuality) => void;
}

function FrameBudgetMonitor({ sampler, onQualityChange }: FrameBudgetMonitorProps) {
  const currentQuality = useRef<RenderQuality | null>(null);
  const invalidate = useThree(({ invalidate }) => invalidate);

  useFrame(() => {
    sampler.beginFrame(performance.now());
  });

  useEffect(() => addAfterEffect(() => {
    const sample = sampler.finishFrame(performance.now());
    if (!sample) {
      return;
    }

    queueMicrotask(() => {
      if (
        sample.quality.dynamicShadows !== currentQuality.current?.dynamicShadows
        || sample.quality.maxDpr !== currentQuality.current?.maxDpr
      ) {
        currentQuality.current = sample.quality;
        onQualityChange(sample.quality);
      }
      if (sample.requestFrame) {
        invalidate();
      }
    });
  }), [invalidate, onQualityChange, sampler]);

  return null;
}

function QualityBoardInput({
  state,
  onSelectCell,
  onPickDigit,
  onPhysicsCollision,
  onDropDigit,
  reducedMotion,
}: BoardCanvasProps) {
  const budget = useMemo(() => createFrameBudget(reducedMotion), [reducedMotion]);
  const sampler = useMemo(() => createDemandFrameSampler(budget), [budget]);
  const [quality, setQuality] = useState<RenderQuality>(() => budget.quality());
  const [dragging, setDragging] = useState(false);
  const counts = useMemo(() => state.grid.reduce<number[]>((result, digit) => {
    if (digit !== null) {
      result[digit] = (result[digit] ?? 0) + 1;
    }
    return result;
  }, Array.from({ length: 10 }, () => 0)), [state.grid]);

  return (
    <Canvas
      camera={{ far: 100, near: 0.1, position: [...BOARD_CAMERA_POSITION] }}
      dpr={[1, quality.maxDpr]}
      frameloop="demand"
      gl={{ alpha: true, antialias: true }}
      onCreated={({ camera }) => camera.lookAt(...BOARD_CAMERA_TARGET)}
      orthographic
      shadows={quality.dynamicShadows}
    >
      <FrameBudgetMonitor onQualityChange={setQuality} sampler={sampler} />
      <BoardScene
        onPhysicsCollision={onPhysicsCollision}
        onSelectCell={onSelectCell}
        reducedMotion={reducedMotion}
        showEditableTargets={dragging}
        state={state}
      />
      <WebInputScene
        counts={counts}
        givens={state.givens}
        layout={state.layout}
        onDraggingChange={setDragging}
        onDropDigit={onDropDigit}
        onPickDigit={onPickDigit}
      />
    </Canvas>
  );
}

export function BoardInput(props: BoardCanvasProps) {
  return (
    <QualityBoardInput
      {...props}
      key={props.reducedMotion ? 'reduced-motion' : 'full-motion'}
    />
  );
}
