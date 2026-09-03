import { countdown } from "@/lib/rolls";
import type { Translate } from "@/lib/i18n";

/**
 * The darkroom readout. Always derived from the ABSOLUTE unlock time and the
 * current clock, so a reload shows the same moment the previous tab did.
 */
export function Countdown({
  unlockAt,
  now,
  t,
  id = "countdown",
}: {
  unlockAt: number;
  now: number;
  t: Translate;
  id?: string;
}) {
  const c = countdown(unlockAt, now);
  const pad = (n: number) => String(n).padStart(2, "0");
  const cells: [number, string][] = [
    [c.days, t("days")],
    [c.hours, t("hours")],
    [c.minutes, t("minutes")],
    [c.seconds, t("seconds")],
  ];
  return (
    <div className="grid gap-[0.4rem]" id={id} data-unlock-at={unlockAt}>
      <div className="sr-readout" role="timer" aria-live="off">
        {cells.map(([n, unit], i) => (
          <div className="sr-readout-cell" key={unit}>
            <span className="sr-readout-num">{i === 0 ? n : pad(n)}</span>
            <span className="sr-readout-unit">{unit}</span>
          </div>
        ))}
      </div>
      <p className="sr-readout-line" id={`${id}-line`}>
        {c.days}d {pad(c.hours)}h {pad(c.minutes)}m {pad(c.seconds)}s
      </p>
    </div>
  );
}
