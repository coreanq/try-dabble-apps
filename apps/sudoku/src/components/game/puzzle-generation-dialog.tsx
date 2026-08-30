import { GameDialog } from '@/components/game/game-dialog';
import { t } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n/locales';

interface PuzzleGenerationDialogProps {
  readonly attempt: number;
  readonly locale: Locale;
  readonly visible: boolean;
}

export function PuzzleGenerationDialog({ attempt, locale, visible }: PuzzleGenerationDialogProps) {
  const title = t(locale, 'puzzleGenerationTitle');
  const progress = t(locale, 'puzzleGenerationProgress').replace('{attempt}', String(attempt));

  return (
    <GameDialog
      allowClose={false}
      locale={locale}
      onClose={() => undefined}
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
        <p aria-live="polite" className="text-center text-[16px] leading-6 text-ink">
          {progress}
        </p>
      </div>
    </GameDialog>
  );
}
