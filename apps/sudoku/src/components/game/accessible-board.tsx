import { useEffect, useRef, type KeyboardEvent } from 'react';

import {
  boardCommandForKey,
  cellAccessibilityLabel,
  type BoardKeyboardCommand,
} from '@/lib/game/game-view-model';
import type { Locale } from '@/lib/i18n/locales';
import type { GameState } from '@/lib/sudoku/domain/game-state';
import type { CellIndex } from '@/lib/types';

interface AccessibleBoardProps {
  readonly active: boolean;
  readonly locale: Locale;
  readonly onFocusCell: (index: CellIndex) => void;
  readonly onKeyboardCommand: (command: BoardKeyboardCommand) => void;
  readonly onSelectCell: (index: CellIndex) => void;
  readonly state: GameState;
}

/**
 * The board a screen reader and a keyboard walk: one button per cell, a single
 * pixel each, sitting behind the WebGL canvas. Roving tabindex keeps exactly
 * one cell in the tab order, and focus follows the selection.
 */
export function AccessibleBoard({
  active,
  locale,
  onFocusCell,
  onKeyboardCommand,
  onSelectCell,
  state,
}: AccessibleBoardProps) {
  const rovingIndex = state.selectedIndex ?? 0;
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (active) {
      cellRefs.current[rovingIndex]?.focus({ preventScroll: true });
    }
  }, [active, rovingIndex]);

  const handleKeyDown = (index: CellIndex) => (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!active) {
      return;
    }

    const command = boardCommandForKey(
      index,
      event.key,
      event,
      state.layout.size,
      state.givens,
    );
    if (!command) {
      return;
    }
    event.preventDefault();
    onKeyboardCommand(command);
  };

  return (
    <div className="absolute top-0 left-0 h-px w-px overflow-hidden">
      {state.grid.map((_, index) => (
        <button
          aria-label={cellAccessibilityLabel(locale, state, index)}
          aria-pressed={state.selectedIndex === index}
          className="h-px w-px opacity-[0.01]"
          key={index}
          onClick={() => onSelectCell(index)}
          onFocus={() => {
            if (active) {
              onFocusCell(index);
              if (state.selectedIndex !== index) {
                onSelectCell(index);
              }
            }
          }}
          onKeyDown={handleKeyDown(index)}
          ref={(cell) => {
            cellRefs.current[index] = cell;
          }}
          tabIndex={active && rovingIndex === index ? 0 : -1}
          type="button"
        />
      ))}
    </div>
  );
}
