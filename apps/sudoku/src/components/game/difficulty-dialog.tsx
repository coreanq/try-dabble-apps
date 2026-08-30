import { useState } from 'react';

import { GameDialog } from '@/components/game/game-dialog';
import { t } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n/locales';
import type { BoardSize } from '@/lib/sudoku/domain/layout';
import type { Difficulty } from '@/lib/sudoku/domain/rating';
import { cn } from '@/lib/utils';

const DIFFICULTIES: readonly Difficulty[] = ['beginner', 'easy', 'medium', 'hard', 'expert'];

interface DifficultyDialogProps {
  readonly allowClose: boolean;
  readonly errorMessage?: string | null;
  readonly initialSize: BoardSize;
  readonly locale: Locale;
  readonly onClose: () => void;
  readonly onSelect: (size: BoardSize, difficulty: Difficulty) => void;
  readonly visible: boolean;
}

export function DifficultyDialog({
  allowClose,
  errorMessage,
  initialSize,
  locale,
  onClose,
  onSelect,
  visible,
}: DifficultyDialogProps) {
  const [selectedSize, setSelectedSize] = useState<BoardSize>(initialSize);

  return (
    <GameDialog
      allowClose={allowClose}
      locale={locale}
      onClose={onClose}
      title={t(locale, 'difficulty')}
      visible={visible}
    >
      {errorMessage ? (
        <p
          aria-live="assertive"
          className="text-center text-[15px] leading-[22px] font-bold text-vermilion"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}
      <div className="flex flex-col gap-[9px]">
        <span className="text-[13px] font-extrabold tracking-[1.1px] text-ink-muted uppercase">
          {t(locale, 'boardSize')}
        </span>
        <div aria-label={t(locale, 'boardSize')} className="flex gap-2.5" role="radiogroup">
          {([6, 9] as const).map((size) => {
            const selected = size === selectedSize;
            return (
              <button
                aria-checked={selected}
                aria-label={`${t(locale, 'boardSize')} ${size}×${size}`}
                className={cn(
                  'relative flex min-h-12 flex-1 items-center justify-center rounded-[0.875rem] border',
                  'font-display text-[20px] font-bold outline-none',
                  'focus-visible:ring-3 focus-visible:ring-ring/40 active:translate-y-0.5',
                  "after:absolute after:-inset-1.5 after:content-['']",
                  selected
                    ? 'border-walnut bg-walnut text-cream'
                    : 'border-walnut/25 text-ink',
                )}
                key={size}
                onClick={() => setSelectedSize(size)}
                role="radio"
                type="button"
              >
                {size}×{size}
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-center text-[15px] leading-[22px] text-ink-muted">
        {t(locale, 'dragHint')}
      </p>
      <div className="flex flex-wrap gap-2.5">
        {DIFFICULTIES.map((difficulty, index) => (
          <button
            aria-label={`${t(locale, difficulty)}. ${t(locale, 'startGame')}`}
            className={cn(
              'relative flex min-h-[66px] grow basis-[47%] flex-row items-center gap-[13px]',
              'rounded-[1.125rem] border border-walnut/25 bg-parchment-light px-[15px]',
              'shadow-[0_5px_12px_rgba(43,25,17,0.22),inset_0_1px_0_rgba(255,255,255,0.7)]',
              'outline-none transition-transform duration-75 focus-visible:ring-3 focus-visible:ring-ring/40',
              "after:absolute after:-inset-1.5 after:content-['']",
              'active:translate-y-0.5 active:bg-cream-muted',
            )}
            key={difficulty}
            onClick={() => onSelect(selectedSize, difficulty)}
            type="button"
          >
            <span className="text-[11px] font-extrabold tracking-[1.2px] tabular-nums text-vermilion">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="font-display text-[20px] font-bold text-ink">
              {t(locale, difficulty)}
            </span>
          </button>
        ))}
      </div>
    </GameDialog>
  );
}
