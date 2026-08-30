import { t } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n/locales';
import type { Difficulty } from '@/lib/sudoku/domain/rating';

interface GameHeaderProps {
  readonly difficulty: Difficulty;
  readonly elapsedSeconds: number;
  readonly locale: Locale;
  readonly onHelp: () => void;
  readonly onNewGame: () => void;
  readonly onSettings: () => void;
}

function formatElapsed(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

interface HeaderButtonProps {
  readonly label: string;
  readonly onPress: () => void;
}

function HeaderButton({ label, onPress }: HeaderButtonProps) {
  return (
    <button
      // Bare tan-outlined key straight on the parchment, as in the original:
      // no fill until it is pressed, when it takes the cream-muted wash.
      className="relative flex min-h-11 items-center justify-center rounded-[0.75rem] border border-walnut/35 px-[13px] text-[13px] font-bold text-ink outline-none focus-visible:ring-3 focus-visible:ring-ring/40 active:translate-y-px active:bg-cream-muted after:absolute after:-inset-1.5 after:content-['']"
      onClick={onPress}
      type="button"
    >
      {label}
    </button>
  );
}

export function GameHeader({
  difficulty,
  elapsedSeconds,
  locale,
  onHelp,
  onNewGame,
  onSettings,
}: GameHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3.5 border-b border-walnut/30 pb-3.5">
      {/* The app title the original printed here is the page's <h1> now — the
          Masthead above renders it, so repeating it would say it twice. */}
      <div className="flex shrink flex-col gap-[5px]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-walnut">{t(locale, difficulty)}</span>
          <span
            aria-label={`${t(locale, 'timer')} ${formatElapsed(elapsedSeconds)}`}
            className="text-[15px] font-bold tracking-[0.8px] tabular-nums text-ink"
            role="timer"
          >
            {formatElapsed(elapsedSeconds)}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-[7px]" role="toolbar">
        <HeaderButton label={t(locale, 'newGame')} onPress={onNewGame} />
        <HeaderButton label={t(locale, 'help')} onPress={onHelp} />
        <HeaderButton label={t(locale, 'settings')} onPress={onSettings} />
      </div>
    </div>
  );
}
