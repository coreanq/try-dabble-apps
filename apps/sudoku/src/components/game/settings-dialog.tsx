import { GameDialog } from '@/components/game/game-dialog';
import { Slider } from '@/components/ui/slider';
import { t, type MessageKey } from '@/lib/i18n';
import { SUPPORTED_LOCALES, type Locale } from '@/lib/i18n/locales';
import { cn } from '@/lib/utils';

export interface GameSettings {
  readonly answerCheck: boolean;
  readonly haptics: boolean;
  readonly music: boolean;
  readonly musicVolume: number;
  readonly reducedMotion: boolean;
  readonly sound: boolean;
  readonly soundVolume: number;
}

interface SettingsDialogProps {
  readonly locale: Locale;
  readonly onChange: (next: GameSettings) => void;
  readonly onClose: () => void;
  readonly onLocaleChange: (locale: Locale) => void;
  readonly settings: GameSettings;
  readonly visible: boolean;
}

interface SettingToggleProps {
  readonly enabled: boolean;
  readonly label: string;
  readonly onToggle: () => void;
}

function SettingToggle({ enabled, label, onToggle }: SettingToggleProps) {
  return (
    <button
      aria-checked={enabled}
      aria-label={label}
      className={cn(
        'relative flex min-h-14 w-full items-center justify-between gap-3 border-b border-walnut/30',
        'bg-canvas/50 px-4 text-left outline-none last:border-b-0',
        'focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:ring-inset active:opacity-70',
        "after:absolute after:-inset-1.5 after:content-['']",
      )}
      onClick={onToggle}
      role="switch"
      type="button"
    >
      <span className="flex-1 text-[15px] font-semibold text-cream">{label}</span>
      <span
        className={cn(
          'flex h-[30px] w-[52px] shrink-0 items-center rounded-full p-[3px] transition-colors',
          enabled ? 'bg-walnut-light' : 'bg-ink-muted',
        )}
      >
        <span
          className={cn(
            'size-6 rounded-full bg-cream transition-transform',
            enabled && 'translate-x-[22px]',
          )}
        />
      </span>
    </button>
  );
}

interface VolumeControlProps {
  readonly enabled: boolean;
  readonly label: string;
  readonly onChange: (value: number) => void;
  readonly value: number;
}

function VolumeControl({ enabled, label, onChange, value }: VolumeControlProps) {
  return (
    <div
      className={cn(
        'flex min-h-[68px] flex-col justify-center gap-1 border-b border-walnut/30 bg-canvas/70 px-4 py-2 last:border-b-0',
        !enabled && 'opacity-50',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] font-semibold text-cream-muted">{label}</span>
        <span className="text-[13px] font-extrabold tabular-nums text-cream">
          {Math.round(value)}%
        </span>
      </div>
      <Slider
        aria-label={label}
        aria-valuetext={`${Math.round(value)}%`}
        className="h-9"
        disabled={!enabled}
        max={100}
        min={0}
        onValueChange={(next) => onChange(next[0] ?? value)}
        step={1}
        value={[value]}
      />
    </div>
  );
}

const LOCALE_LABELS: Readonly<Record<Locale, MessageKey>> = {
  ko: 'korean',
  en: 'english',
  ja: 'japanese',
};

export function SettingsDialog({
  locale,
  onChange,
  onClose,
  onLocaleChange,
  settings,
  visible,
}: SettingsDialogProps) {
  const setSetting = <Key extends keyof GameSettings>(key: Key, value: GameSettings[Key]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <GameDialog
      locale={locale}
      onClose={onClose}
      title={t(locale, 'settings')}
      visible={visible}
    >
      <div className="overflow-hidden rounded-2xl border border-walnut/50">
        <SettingToggle
          enabled={settings.music}
          label={t(locale, 'backgroundMusic')}
          onToggle={() => setSetting('music', !settings.music)}
        />
        <VolumeControl
          enabled={settings.music}
          label={t(locale, 'backgroundMusicVolume')}
          onChange={(value) => setSetting('musicVolume', value)}
          value={settings.musicVolume}
        />
        <SettingToggle
          enabled={settings.sound}
          label={t(locale, 'soundEffects')}
          onToggle={() => setSetting('sound', !settings.sound)}
        />
        <VolumeControl
          enabled={settings.sound}
          label={t(locale, 'soundEffectsVolume')}
          onChange={(value) => setSetting('soundVolume', value)}
          value={settings.soundVolume}
        />
        <SettingToggle
          enabled={settings.haptics}
          label={t(locale, 'haptics')}
          onToggle={() => setSetting('haptics', !settings.haptics)}
        />
        <SettingToggle
          enabled={settings.reducedMotion}
          label={t(locale, 'reducedMotion')}
          onToggle={() => setSetting('reducedMotion', !settings.reducedMotion)}
        />
        <SettingToggle
          enabled={settings.answerCheck}
          label={t(locale, 'answerChecking')}
          onToggle={() => setSetting('answerCheck', !settings.answerCheck)}
        />
      </div>

      <div className="flex flex-col gap-2.5">
        <span className="text-[13px] font-extrabold tracking-[1.1px] text-cream-muted uppercase">
          {t(locale, 'language')}
        </span>
        <div aria-label={t(locale, 'language')} className="flex flex-wrap gap-2" role="radiogroup">
          {SUPPORTED_LOCALES.map((option) => {
            const selected = option === locale;
            return (
              <button
                aria-checked={selected}
                className={cn(
                  'relative flex min-h-[46px] flex-row items-center gap-2 rounded-[0.875rem] border px-[13px]',
                  'outline-none focus-visible:ring-3 focus-visible:ring-ring/40 active:opacity-70',
                  "after:absolute after:-inset-1.5 after:content-['']",
                  selected
                    ? 'border-walnut-light bg-walnut text-cream'
                    : 'border-walnut/50 text-cream-muted',
                )}
                key={option}
                onClick={() => onLocaleChange(option)}
                role="radio"
                type="button"
              >
                <span
                  className={cn(
                    'size-3 rounded-full border',
                    selected ? 'border-4 border-cream bg-cream' : 'border-cream-muted/60',
                  )}
                />
                <span className="text-sm font-bold">{t(locale, LOCALE_LABELS[option])}</span>
              </button>
            );
          })}
        </div>
      </div>
    </GameDialog>
  );
}
