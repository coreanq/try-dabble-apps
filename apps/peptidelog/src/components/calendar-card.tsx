import { useEffect, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { monthGrid, shiftMonth, todayStr, yearMonthOf } from "@/lib/dates";
import { formatDay, formatMonth, formatTime } from "@/lib/format";
import { siteName, type Lang, type Translate } from "@/lib/i18n";
import type { Compound, DoseLog } from "@/lib/model";

/**
 * Month grid plus the picked day's logs. Any day is a tap away, past or
 * future, and each row has edit + delete: the calendar is never locked to
 * today and a wrong entry is never stuck.
 */
export function CalendarCard({
  t,
  lang,
  logs,
  compounds,
  selected,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
}: {
  t: Translate;
  lang: Lang;
  logs: DoseLog[];
  compounds: Compound[];
  selected: string;
  onSelect: (date: string) => void;
  onAdd: (date: string) => void;
  onEdit: (log: DoseLog) => void;
  onDelete: (log: DoseLog) => void;
}) {
  const [month, setMonth] = useState(() => yearMonthOf(selected));
  useEffect(() => {
    setMonth(yearMonthOf(selected));
  }, [selected]);

  const today = todayStr();
  const cells = monthGrid(month);
  const dayNames = t("daysShort").split(",");
  const byDay = new Map<string, number>();
  for (const l of logs) byDay.set(l.date, (byDay.get(l.date) ?? 0) + 1);
  const dayLogs = logs.filter((l) => l.date === selected).sort((a, b) => a.datetime.localeCompare(b.datetime));
  const nameOf = (id: string) => compounds.find((c) => c.id === id)?.name ?? "?";

  return (
    <Card id="calendar-card" size="sm">
      <CardHeader className="grid-cols-[auto_1fr] items-center gap-2">
        <CalendarDays className="size-4 text-teal-deep" aria-hidden />
        <CardTitle>{t("calendarTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <p className="pl-hint">{t("calendarBody")}</p>
        <div className="pl-cal-head">
          <button type="button" className="pl-btn pl-btn-icon" id="cal-prev" aria-label={t("prevMonth")} onClick={() => setMonth(shiftMonth(month, -1))}>
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <p className="pl-cal-month" id="cal-month">
            {formatMonth(lang, month)}
          </p>
          <button type="button" className="pl-btn pl-btn-icon" id="cal-next" aria-label={t("nextMonth")} onClick={() => setMonth(shiftMonth(month, 1))}>
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
        <div className="pl-cal-grid" id="cal-grid" role="grid">
          {dayNames.map((d) => (
            <span key={d} className="pl-cal-dow" role="columnheader">
              {d}
            </span>
          ))}
          {cells.map((key, i) =>
            key ? (
              <button
                key={key}
                type="button"
                className="pl-cal-day"
                role="gridcell"
                data-date={key}
                data-today={key === today ? "true" : "false"}
                data-has={byDay.has(key) ? "true" : "false"}
                aria-pressed={key === selected}
                aria-label={formatDay(lang, key)}
                onClick={() => onSelect(key)}
              >
                {Number(key.slice(8, 10))}
              </button>
            ) : (
              <span key={`blank-${i}`} className="pl-cal-blank" aria-hidden />
            ),
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="pl-row-text" id="cal-selected">
            {t("logsOn", { date: formatDay(lang, selected) })}
          </p>
          {selected !== today && (
            <button type="button" className="pl-btn pl-btn-sm pl-btn-quiet" id="cal-today" onClick={() => onSelect(today)}>
              {t("today")}
            </button>
          )}
        </div>
        {dayLogs.length === 0 ? (
          <p className="pl-hint" id="cal-empty">
            {t("noLogsOn")}
          </p>
        ) : (
          <ul className="pl-list" id="cal-logs">
            {dayLogs.map((l) => (
              <li key={l.id} className="pl-row" data-id={l.id} data-role="cal-log">
                <div className="pl-row-main">
                  <p className="pl-row-text">
                    {nameOf(l.compoundId)} · {l.amount} {l.unitLabel ?? ""}
                  </p>
                  <span className="pl-row-meta">
                    <span>{formatTime(lang, l.datetime)}</span>
                    {l.site && <span className="pl-badge">{siteName(lang, l.site)}</span>}
                    {l.notes && <span>{l.notes}</span>}
                  </span>
                </div>
                <span className="pl-row-actions">
                  <button type="button" className="pl-btn pl-btn-icon" data-role="edit-log" aria-label={t("edit")} onClick={() => onEdit(l)}>
                    <Pencil className="size-4" aria-hidden />
                  </button>
                  <button type="button" className="pl-btn pl-btn-icon" data-role="delete-log" aria-label={t("delete")} onClick={() => onDelete(l)}>
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
        <button type="button" className="pl-btn pl-btn-lav" id="cal-add" onClick={() => onAdd(selected)} disabled={compounds.length === 0}>
          <Plus className="size-4" aria-hidden />
          {t("addLogForDay")}
        </button>
      </CardContent>
    </Card>
  );
}
