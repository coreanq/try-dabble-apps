import { PhotoThumb } from "@/components/photo-thumb";
import type { Translate } from "@/lib/i18n";
import { formatCoords, memoTitle, type Pin } from "@/lib/pins";

/** One line of the journal: the taped snapshot, the memo, the postmark. */
export function PinEntry({
  pin,
  t,
  dateLabel,
  onOpen,
}: {
  pin: Pin;
  t: Translate;
  dateLabel: string;
  onOpen: (id: string) => void;
}) {
  const headline = memoTitle(pin);

  return (
    <button
      type="button"
      className="mm-entry"
      data-pin-id={pin.id}
      onClick={() => onOpen(pin.id)}
    >
      <PhotoThumb pinId={pin.id} hasPhoto={pin.photo} alt={t("photoAlt")} />

      <span className="flex min-w-0 flex-1 flex-col gap-[0.2rem]">
        <span
          className={
            "line-clamp-2 text-[0.88rem] leading-[1.35] font-semibold " +
            (headline ? "text-ink" : "text-muted-ink italic")
          }
        >
          {headline || t("noMemo")}
        </span>
        <span className="mm-coords">{formatCoords(pin)}</span>
        <span className="mm-date">{dateLabel}</span>
      </span>
    </button>
  );
}
