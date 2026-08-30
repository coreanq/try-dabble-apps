import type {
  NormalizedPointer,
  PointerKind,
  PointerPhase,
} from '@/lib/types';

function finiteOrZero(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function clamp(value: unknown, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, finiteOrZero(value)));
}

function pointerKind(pointerType: string): PointerKind {
  switch (pointerType) {
    case 'pen':
      return 'pencil';
    case 'touch':
      return 'touch';
    case 'mouse':
      return 'mouse';
    default:
      return 'unknown';
  }
}

export function normalizeWebPointer(
  event: PointerEvent,
  phase: PointerPhase,
): NormalizedPointer {
  const kind = pointerKind(event.pointerType);

  return {
    hovering: phase === 'move'
      && event.buttons === 0
      && (kind === 'pencil' || kind === 'mouse'),
    kind,
    phase,
    pressure: clamp(event.pressure, 0, 1),
    tiltX: clamp(event.tiltX, -90, 90),
    tiltY: clamp(event.tiltY, -90, 90),
    x: finiteOrZero(event.clientX),
    y: finiteOrZero(event.clientY),
  };
}
