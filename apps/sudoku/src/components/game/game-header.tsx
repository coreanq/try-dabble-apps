import { Button } from '@/components/ui/button';
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
    <Button
      className="relative h-11 rounded-[0.75rem] px-[13px] text-[13px] after:absolute after:-inset-1.5 after:content-['']"
      onClick={onPress}
      type="button"
      variant="outline"
    >
      {label}
    </Button>
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
    <div className="flex flex-wrap items-center justify-between gap-3.5 border-b border-walnut pb-3.5">
      <div className="flex shrink flex-col gap-[5px]">
        <h2 className="font-display text-[1.75rem] font-bold tracking-[0.4px] text-cream">
          {t(locale, 'appTitle')}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-walnut-light">{t(locale, difficulty)}</span>
          <span
            aria-label={`${t(locale, 'timer')} ${formatElapsed(elapsedSeconds)}`}
            className="text-[15px] font-bold tracking-[0.8px] tabular-nums text-vermilion"
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
