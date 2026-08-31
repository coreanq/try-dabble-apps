import { t } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n/locales';
import type { SudokuLayout } from '@/lib/sudoku/domain/layout';
import type { Digit } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DigitControlsProps {
  readonly compact?: boolean;
  readonly counts: readonly number[];
  readonly dense?: boolean;
  readonly layout: SudokuLayout;
  readonly locale: Locale;
  readonly onDigit: (digit: Digit) => void;
}

function digitLabel(locale: Locale, digit: Digit, count: number): string {
  return t(locale, 'digitUsage')
    .replace('{digit}', String(digit))
    .replace('{count}', String(count));
}

export function DigitControls({
  compact = false,
  counts,
  dense = false,
  layout,
  locale,
  onDigit,
}: DigitControlsProps) {
  // Stacked under the board on a phone, three rows of square keys cost more
  // height than the board itself has to spare, so the keys go wide and short:
  // 5 + 4 for a 9x9, one row of 6 for the small board.
  const grid = compact && !dense;

  return (
    <div
      className={cn(
        grid
          ? cn('grid gap-1.5', layout.digits.length > 6 ? 'grid-cols-5' : 'grid-cols-6')
          : cn('flex flex-wrap gap-2', dense && 'flex-nowrap'),
      )}
    >
      {layout.digits.map((digit) => {
        const count = counts[digit] ?? 0;
        const exhausted = count >= layout.size;
        return (
          <button
            aria-label={digitLabel(locale, digit, count)}
            className={cn(
              // Cream ceramic on the walnut rack: three keys to a row when the
              // rack is stacked, one row when dense.
              'relative flex aspect-square grow basis-[30%] flex-col items-center justify-center',
              'min-h-[58px] min-w-[58px] rounded-[0.9375rem] border border-walnut/25 bg-cream p-1',
              'shadow-[0_5px_12px_rgba(43,25,17,0.22),inset_0_1px_0_rgba(255,255,255,0.7)]',
              'outline-none transition-transform duration-75 focus-visible:ring-3 focus-visible:ring-ring/40',
              // hitSlop={6}, as a transparent ::after box around the key.
              "after:absolute after:-inset-1.5 after:content-['']",
              'active:translate-y-0.5 active:shadow-[0_1px_3px_rgba(43,25,17,0.22)]',
              dense && 'min-h-[52px] min-w-[52px] basis-0',
              grid && 'aspect-auto h-13 min-h-0 min-w-0 basis-auto rounded-[0.75rem] p-0.5',
              exhausted && 'opacity-40',
            )}
            key={digit}
            onClick={() => onDigit(digit)}
            type="button"
          >
            <span
              className={cn(
                'font-display font-bold text-ink',
                compact ? 'text-[21px] leading-[23px]' : 'text-[26px] leading-[29px]',
              )}
            >
              {digit}
            </span>
            <span
              className={cn(
                'font-bold tabular-nums text-ink-muted',
                compact ? 'text-[8px] leading-[10px]' : 'text-[9px]',
              )}
            >
              {count}/{layout.size}
            </span>
          </button>
        );
      })}
    </div>
  );
}
