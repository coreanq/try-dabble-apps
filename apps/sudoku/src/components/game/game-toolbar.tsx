import { t } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n/locales';
import { cn } from '@/lib/utils';

interface GameToolbarProps {
  readonly canRedo: boolean;
  readonly canUndo: boolean;
  readonly locale: Locale;
  readonly noteMode: boolean;
  readonly onErase: () => void;
  readonly onRedo: () => void;
  readonly onToggleNote: () => void;
  readonly onUndo: () => void;
}

interface ToolButtonProps {
  readonly active?: boolean;
  readonly disabled?: boolean;
  readonly glyph: string;
  readonly label: string;
  readonly onPress: () => void;
}

function ToolButton({ active = false, disabled = false, glyph, label, onPress }: ToolButtonProps) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      className={cn(
        // hitSlop={6} lives on the ::after box: the tap target grows 6px on
        // every side without moving the ceramic key itself.
        'relative flex min-h-15 min-w-14 flex-1 flex-col items-center justify-center gap-0.5',
        'rounded-[0.875rem] border px-[5px] py-1.5 transition-transform duration-75',
        'shadow-[0_5px_12px_rgba(43,25,17,0.22),inset_0_1px_0_rgba(255,255,255,0.7)]',
        'outline-none focus-visible:ring-3 focus-visible:ring-ring/40',
        "after:absolute after:-inset-1.5 after:content-['']",
        'active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-35',
        active ? 'border-walnut-dark bg-walnut' : 'border-walnut/40 bg-cream',
      )}
      disabled={disabled}
      onClick={onPress}
      type="button"
    >
      <span className={cn('text-[19px] font-bold', active ? 'text-cream' : 'text-ink')}>
        {glyph}
      </span>
      <span
        className={cn(
          'text-center text-[10px] font-bold',
          active ? 'text-cream' : 'text-ink-muted',
        )}
      >
        {label}
      </span>
    </button>
  );
}

export function GameToolbar({
  canRedo,
  canUndo,
  locale,
  noteMode,
  onErase,
  onRedo,
  onToggleNote,
  onUndo,
}: GameToolbarProps) {
  return (
    <div className="flex justify-between gap-2" role="toolbar">
      <ToolButton
        active={noteMode}
        glyph="✎"
        label={noteMode ? t(locale, 'notesOn') : t(locale, 'notesOff')}
        onPress={onToggleNote}
      />
      <ToolButton glyph="⌫" label={t(locale, 'erase')} onPress={onErase} />
      <ToolButton disabled={!canUndo} glyph="↶" label={t(locale, 'undo')} onPress={onUndo} />
      <ToolButton disabled={!canRedo} glyph="↷" label={t(locale, 'redo')} onPress={onRedo} />
    </div>
  );
}
