import { BOARD_CAMERA_POSITION, BOARD_CAMERA_WORLD_SPAN } from './board-camera.ts';
import type { BoardSize } from '@/lib/sudoku/domain/layout';

const MIN_TARGET_CSS_SIZE = 44;
const CAMERA_GROUND_VERTICAL_SCALE = BOARD_CAMERA_POSITION[1]
  / Math.hypot(BOARD_CAMERA_POSITION[1], BOARD_CAMERA_POSITION[2]);

export const MIN_INTERACTIVE_CANVAS_SIZE = Math.ceil(
  MIN_TARGET_CSS_SIZE * BOARD_CAMERA_WORLD_SPAN / CAMERA_GROUND_VERTICAL_SCALE,
);
export const MAX_INTERACTIVE_CANVAS_SIZE = 720;

/**
 * Vertical room the rest of the one-screen layout needs when isWide is false:
 * the local-only line and masthead above the game (92), this screen's own
 * padding (16), the game header (51), the two gaps around the board (24), and
 * the control rack (255 — hint line, two rows of digit keys, divider, tools),
 * which comes to 438 with two to spare. Measured in the tallest locale, which
 * is what sets it: the Japanese drag hint wraps to two lines on a phone where
 * the Korean and English ones do not, and this has to hold for all three.
 * Deliberately an upper bound, so the board
 * rounds down rather than pushing the page past one screen. Growing that chrome
 * — a taller key, a bigger font, another row — without growing this number is
 * exactly what puts the vertical scrollbar back on a phone.
 */
export const PORTRAIT_CHROME_HEIGHT = 440;

/**
 * The board shrinks with the screen down to this and then stops. A 9x9 cell is
 * 24px here — small, but the whole board is on screen with the keys, which is
 * what a phone in portrait can actually offer: MIN_INTERACTIVE_CANVAS_SIZE, the
 * size at which every cell clears the 44px touch target, does not fit a phone
 * alongside the controls. Below this the board stops being playable at all, so
 * shorter screens scroll instead.
 */
export const MIN_PORTRAIT_CANVAS_SIZE = 264;
export const BOARD_FRAME_INSET = 12;
export const CELL_HIT_WORLD_SIZE = 1;
export const TRAY_HIT_WORLD_SIZE = 1;
export const WEB_CANVAS_TOUCH_ACTION = 'none';
const BOARD_SCROLL_STEP = 3 * MIN_TARGET_CSS_SIZE;

export interface WebTouchActionStyle {
  touchAction: string;
}

export function containWebCanvasDrag(style: WebTouchActionStyle): () => void {
  const previousTouchAction = style.touchAction;
  style.touchAction = WEB_CANVAS_TOUCH_ACTION;
  return () => {
    style.touchAction = previousTouchAction;
  };
}

export interface BoardViewportLayout {
  readonly canvasSize: number;
  readonly frameSize: number;
  readonly horizontalOverflow: boolean;
  readonly isWide: boolean;
  readonly viewportWidth: number;
}

export type BoardScrollDirection = 'left' | 'right';

export interface BoardHorizontalBounds {
  readonly left: number;
  readonly right: number;
}

export function projectedCellHorizontalBounds(
  index: number,
  layout: BoardViewportLayout,
  size: BoardSize = 9,
): BoardHorizontalBounds {
  const column = index % size;
  const cellSize = 9 / size;
  const pixelsPerWorldUnit = layout.canvasSize / BOARD_CAMERA_WORLD_SPAN;
  const center = BOARD_FRAME_INSET / 2
    + layout.canvasSize / 2
    + (-4.5 + cellSize / 2 + column * cellSize) * pixelsPerWorldUnit;
  const halfWidth = cellSize * pixelsPerWorldUnit / 2;

  return Object.freeze({ left: center - halfWidth, right: center + halfWidth });
}

export function nearestBoardScrollOffset(
  currentOffset: number,
  bounds: BoardHorizontalBounds,
  layout: BoardViewportLayout,
): number {
  const maximumOffset = Math.max(0, layout.frameSize - layout.viewportWidth);
  let nextOffset = currentOffset;

  if (bounds.left < currentOffset) {
    nextOffset = bounds.left;
  } else if (bounds.right > currentOffset + layout.viewportWidth) {
    nextOffset = bounds.right - layout.viewportWidth;
  }

  return Math.min(maximumOffset, Math.max(0, nextOffset));
}

export function nextBoardScrollOffset(
  currentOffset: number,
  direction: BoardScrollDirection,
  layout: BoardViewportLayout,
): number {
  const maximumOffset = Math.max(0, layout.frameSize - layout.viewportWidth);
  const delta = direction === 'left' ? -BOARD_SCROLL_STEP : BOARD_SCROLL_STEP;
  return Math.min(maximumOffset, Math.max(0, currentOffset + delta));
}

export function calculateBoardViewport(width: number, height: number): BoardViewportLayout {
  const isWide = width >= 860 && width > height;
  // Stacked, the board answers to the height as much as to the width: whatever
  // the chrome above and below does not need is what the board may be.
  const availableFrameSize = isWide
    ? Math.min(width - 380, height - 140)
    : Math.min(
      width - 32,
      height - PORTRAIT_CHROME_HEIGHT,
      MAX_INTERACTIVE_CANVAS_SIZE + BOARD_FRAME_INSET,
    );
  const canvasSize = Math.max(
    isWide ? MIN_INTERACTIVE_CANVAS_SIZE : MIN_PORTRAIT_CANVAS_SIZE,
    Math.min(MAX_INTERACTIVE_CANVAS_SIZE, availableFrameSize - BOARD_FRAME_INSET),
  );
  const frameSize = canvasSize + BOARD_FRAME_INSET;
  const viewportWidth = isWide ? frameSize : Math.min(frameSize, Math.max(0, width - 32));

  return Object.freeze({
    canvasSize,
    frameSize,
    horizontalOverflow: viewportWidth < frameSize,
    isWide,
    viewportWidth,
  });
}
