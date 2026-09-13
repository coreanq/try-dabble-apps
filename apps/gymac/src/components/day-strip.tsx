import { ChevronLeft, ChevronRight } from "lucide-react";

import { shiftDay, todayStr } from "@/lib/dates";
import { formatDay } from "@/lib/format";
import type { Lang, Translate } from "@/lib/i18n";

/** Date navigation for the day everything below refers to: prev / label / next, plus a Today jump. */
export function DayStrip({
  t,
  lang,
  date,
  workoutCount,
  kcal,
  onChange,
}: {
  t: Translate;
  lang: Lang;
  date: string;
  workoutCount: number;
  kcal: number;
  onChange: (next: string) => void;
}) {
  const isToday = date === todayStr();
  return (
    <div className="gm-day-strip" id="day-strip">
      <button type="button" className="gm-btn gm-btn-icon" id="day-prev" aria-label={t("prevDay")} onClick={() => onChange(shiftDay(date, -1))}>
        <ChevronLeft className="size-5" aria-hidden />
      </button>
      <div className="gm-day-main">
        <p className="gm-day-label" id="day-label">
          {formatDay(lang, date)}
        </p>
        <div className="gm-day-meta">
          <span>{t("exercisesCount", { n: workoutCount })}</span>
          <span>·</span>
          <span>{kcal} kcal</span>
          {!isToday && (
            <button type="button" className="gm-today-btn" id="day-today" onClick={() => onChange(todayStr())}>
              {t("today")}
            </button>
          )}
        </div>
      </div>
      <button type="button" className="gm-btn gm-btn-icon" id="day-next" aria-label={t("nextDay")} onClick={() => onChange(shiftDay(date, 1))}>
        <ChevronRight className="size-5" aria-hidden />
      </button>
    </div>
  );
}
