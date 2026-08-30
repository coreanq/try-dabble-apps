import { GameDialog } from '@/components/game/game-dialog';
import { localizedFaq, t } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n/locales';

interface HelpDialogProps {
  readonly locale: Locale;
  readonly onClose: () => void;
  readonly visible: boolean;
}

export function HelpDialog({ locale, onClose, visible }: HelpDialogProps) {
  const faq = localizedFaq(locale);

  return (
    <GameDialog
      locale={locale}
      onClose={onClose}
      title={t(locale, 'rulesTitle')}
      visible={visible}
    >
      <p className="font-display text-[18px] leading-[30px] text-cream">{t(locale, 'rulesBody')}</p>
      <div className="h-px w-full bg-walnut/60" />
      <h3 className="text-[13px] font-extrabold tracking-[1.2px] text-cream-muted uppercase">
        {t(locale, 'faq')}
      </h3>
      <div className="flex flex-col gap-[17px]">
        {faq.map(({ question, answer }, index) => (
          <div className="flex flex-row items-start gap-[13px]" key={question}>
            <span className="pt-1 text-[11px] font-extrabold tabular-nums text-vermilion">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className="flex flex-1 flex-col gap-[5px]">
              <h4 className="text-[16px] font-bold text-cream">{question}</h4>
              <p className="text-sm leading-[22px] text-cream-muted">{answer}</p>
            </div>
          </div>
        ))}
      </div>
    </GameDialog>
  );
}
