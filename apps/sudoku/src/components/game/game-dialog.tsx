import type { PropsWithChildren } from 'react';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { t } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n/locales';

interface GameDialogProps extends PropsWithChildren {
  readonly allowClose?: boolean;
  readonly locale: Locale;
  readonly onClose: () => void;
  readonly title: string;
  readonly visible: boolean;
}

/**
 * The shell the four game dialogs sit in — the RN Modal became a Radix one,
 * but the contract is unchanged: `visible` opens it, `onClose` is the only way
 * out, and `allowClose={false}` seals it (no escape key, no click-away, no ×).
 */
export function GameDialog({
  allowClose = true,
  children,
  locale,
  onClose,
  title,
  visible,
}: GameDialogProps) {
  return (
    <Dialog
      onOpenChange={(next) => {
        if (!next && allowClose) {
          onClose();
        }
      }}
      open={visible}
    >
      <DialogContent
        aria-describedby={undefined}
        className="flex max-h-[88%] flex-col gap-0 overflow-hidden p-0 sm:max-w-[580px]"
        onEscapeKeyDown={(event) => {
          if (!allowClose) {
            event.preventDefault();
          }
        }}
        onInteractOutside={(event) => {
          if (!allowClose) {
            event.preventDefault();
          }
        }}
        showCloseButton={false}
      >
        <DialogHeader className="min-h-[72px] flex-row items-center justify-between gap-0 border-b border-walnut-light bg-linear-to-br from-walnut-light via-walnut to-walnut-dark px-[18px] py-3">
          <span aria-hidden="true" className="h-[26px] w-0.5 shrink-0 bg-cream-muted/70" />
          <DialogTitle className="flex-1 px-3.5 font-display text-[25px] leading-tight font-bold tracking-[0.3px] text-cream">
            {title}
          </DialogTitle>
          {allowClose ? (
            <DialogClose asChild>
              <button
                aria-label={t(locale, 'close')}
                className="flex size-11 shrink-0 items-center justify-center rounded-full border border-cream/30 pb-1 text-[30px] leading-none font-light text-cream outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97] active:opacity-70"
                type="button"
              >
                ×
              </button>
            </DialogClose>
          ) : (
            <span className="w-11 shrink-0" />
          )}
        </DialogHeader>
        <div className="flex min-h-0 flex-col gap-[18px] overflow-y-auto p-[22px]">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
