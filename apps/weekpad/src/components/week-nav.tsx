import { ChevronLeft, ChevronRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { Translate } from "@/lib/i18n";
import { dayOfWeek, parseDate, type WeekInfo } from "@/lib/week";

/**
 * The planner's week strip: arrows either side, the ISO week and date range
 * in the middle, seven day cells underneath with today filled in and a dot
 * on any day that has an expense.
 */
export function WeekNav({
  week,
  today,
  isCurrent,
  daysWithExpenses,
  locale,
  t,
  onPrev,
  onNext,
  onToday,
}: {
  week: WeekInfo;
  today: string;
  isCurrent: boolean;
  daysWithExpenses: Set<string>;
  locale: string;
  t: Translate;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  const rangeFmt = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" });
  const dayNameFmt = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" });
  const fmt = (d: string) => {
    const ms = parseDate(d);
    return ms === null ? d : rangeFmt.format(new Date(ms));
  };
  const weekNo = Number(week.isoId.slice(-2));
  const isPast = week.start < today && !isCurrent;

  return (
    <Card id="week-nav" size="sm">
      <CardContent className="grid gap-0">
        <div className="wp-week-row">
          <button type="button" id="week-prev" className="wp-week-btn" aria-label={t("prevWeek")} title={t("prevWeek")} onClick={onPrev}>
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <div className="wp-week-title" aria-live="polite">
            <span className={"wp-week-tag " + (isCurrent ? "" : "wp-week-tag-past")} id="week-tag">
              {isCurrent ? t("thisWeek") : isPast ? t("pastWeek") : t("futureWeek")}
            </span>
            <p className="wp-week-id" id="week-id" data-week={week.start}>
              {t("weekNumber", { n: weekNo })}
            </p>
            <p className="wp-week-range" id="week-range">
              {fmt(week.start)} – {fmt(week.end)}
            </p>
          </div>
          <button type="button" id="week-next" className="wp-week-btn" aria-label={t("nextWeek")} title={t("nextWeek")} onClick={onNext}>
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>
        <div className="wp-week-days" id="week-days">
          {week.days.map((d) => {
            const ms = parseDate(d);
            const dow = dayOfWeek(d);
            return (
              <div
                key={d}
                className={
                  "wp-day " + (d === today ? "wp-day-today " : "") + (daysWithExpenses.has(d) ? "wp-day-has" : "")
                }
                data-date={d}
                aria-current={d === today ? "date" : undefined}
              >
                <span className="wp-day-name" style={dow === 0 || dow === 6 ? { opacity: 0.8 } : undefined}>
                  {ms === null ? "" : dayNameFmt.format(new Date(ms))}
                </span>
                <span className="wp-day-num">{Number(d.slice(-2))}</span>
                <span className="wp-day-dot" aria-hidden />
              </div>
            );
          })}
        </div>
        {!isCurrent && (
          <button type="button" id="week-today" className="wp-btn wp-btn-quiet wp-back-btn" onClick={onToday}>
            {t("backToThisWeek")}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
