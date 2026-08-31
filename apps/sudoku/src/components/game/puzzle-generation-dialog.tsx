import { GameDialog } from '@/components/game/game-dialog';
import { t } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n/locales';

/**
 * A 9×9 hard or expert board can take half a minute to find — the generator
 * throws away every candidate that does not rate at the requested difficulty.
 * The spinner alone left the player staring at a modal with no idea whether it
 * was working or wedged, so this shows the clock running and, once the wait
 * stops looking momentary, says why and offers the way out.
 */
const SLOW_AFTER_SECONDS = 5;

interface PuzzleGenerationDialogProps {
  readonly attempt: number;
  readonly elapsedSeconds: number;
  readonly locale: Locale;
  readonly onCancel: () => void;
  readonly visible: boolean;
}

export function PuzzleGenerationDialog({
  attempt,
  elapsedSeconds,
  locale,
  onCancel,
  visible,
}: PuzzleGenerationDialogProps) {
  const title = t(locale, 'puzzleGenerationTitle');
  const progress = t(locale, 'puzzleGenerationProgress').replace('{attempt}', String(attempt));
  const elapsed = t(locale, 'puzzleGenerationElapsed').replace(
    '{seconds}',
    String(elapsedSeconds),
  );
  const slow = elapsedSeconds >= SLOW_AFTER_SECONDS;

  return (
    <GameDialog
      allowClose={false}
      locale={locale}
      onClose={onCancel}
      title={title}
      visible={visible}
    >
      <div className="flex flex-col items-center gap-4 py-3">
        {/* The RN ActivityIndicator, as an indeterminate progressbar. */}
        <span
          aria-label={title}
          className="size-10 animate-spin rounded-full border-4 border-vermilion/25 border-t-vermilion"
          role="progressbar"
        />
        <div className="flex flex-col items-center gap-1">
          <p aria-live="polite" className="text-center text-[16px] leading-6 text-ink">
            {progress}
          </p>
          {/* Not announced: it changes every second and would talk over everything. */}
          <p aria-hidden="true" className="text-center text-sm tabular-nums text-ink-muted">
            {elapsed}
          </p>
        </div>
        {slow ? (
          <p
            aria-live="polite"
            className="max-w-[34ch] text-center text-sm leading-6 text-ink-muted"
          >
            {t(locale, 'puzzleGenerationSlowHint')}
          </p>
        ) : null}
        <button
          className="relative rounded-[0.9rem] border border-walnut-light bg-walnut px-4 py-2 text-sm text-cream after:absolute after:-inset-1.5 after:content-['']"
          onClick={onCancel}
          type="button"
        >
          {t(locale, 'puzzleGenerationCancel')}
        </button>
      </div>
    </GameDialog>
  );
}
