/**
 * The live figure, printed on a thermal receipt slip with a torn foot (see
 * .cpu-receipt). It recalculates on every keystroke, so every number is
 * tabular mono and sits under an accountant's double underline.
 */
export function Receipt({
  title,
  perDayLabel,
  perDay,
  perUseLabel,
  perUse,
  perUseEmpty,
  soFarLabel,
  soFar,
  ownedLabel,
}: {
  title: string;
  perDayLabel: string;
  perDay: string;
  perUseLabel: string;
  perUse: string | null;
  perUseEmpty: string;
  soFarLabel: string | null;
  soFar: string;
  ownedLabel: string;
}) {
  return (
    <div className="cpu-receipt" aria-live="polite">
      <p className="cpu-receipt-title">{title}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0">
          <div className="cpu-figure-label">{perDayLabel}</div>
          <span className="cpu-figure cpu-total">{perDay}</span>
        </div>
        <div className="min-w-0">
          <div className="cpu-figure-label">{perUseLabel}</div>
          <span className="cpu-figure cpu-total" data-empty={perUse == null || undefined}>
            {perUse ?? perUseEmpty}
          </span>
        </div>
      </div>
      <div className="mt-3 grid gap-1">
        {soFarLabel && (
          <div className="cpu-line">
            <span className="cpu-line-label">{soFarLabel}</span>
            <span className="cpu-leader" aria-hidden="true" />
            <span className="cpu-amount">{soFar}</span>
          </div>
        )}
        <p className="cpu-entry-meta">{ownedLabel}</p>
      </div>
    </div>
  );
}
