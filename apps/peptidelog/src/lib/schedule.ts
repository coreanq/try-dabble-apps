/**
 * Multi-protocol schedules → the upcoming list. A schedule is either weekday
 * based (Mon/Wed/Fri) or every N days counted from the day it was created.
 * "Mark done" produces a normal DoseLog tagged with the schedule id and slot
 * time, so the slot shows as done and the calendar shows the injection.
 */
import { daysBetween, isoAt, shiftDay, dateKeyOfIso, todayStr } from "./dates.ts";
import type { DoseLog, Schedule } from "./model.ts";
import { newId } from "./model.ts";

export interface Slot {
  scheduleId: string;
  scheduleName: string;
  compoundId: string;
  date: string;
  time: string;
  doseAmount: number;
  unitLabel?: string;
  sitePrefer?: string;
  done: boolean;
  logId?: string;
}

export function occursOn(schedule: Schedule, dateKey: string): boolean {
  if (!schedule.active) return false;
  if (schedule.intervalDays && schedule.intervalDays >= 1) {
    const anchor = dateKeyOfIso(schedule.createdAt) || todayStr();
    const diff = daysBetween(anchor, dateKey);
    return diff >= 0 && diff % schedule.intervalDays === 0;
  }
  const d = new Date(`${dateKey}T12:00:00`);
  return schedule.daysOfWeek.includes(d.getDay());
}

export function findDoneLog(logs: DoseLog[], scheduleId: string, date: string, time: string): DoseLog | undefined {
  return logs.find((l) => l.scheduleId === scheduleId && l.date === date && (l.scheduleTime ?? "") === time);
}

/** Every slot from `fromDate` for `days` days, in chronological order. */
export function upcomingSlots(schedules: Schedule[], logs: DoseLog[], fromDate: string, days = 7): Slot[] {
  const out: Slot[] = [];
  for (let i = 0; i < days; i++) {
    const date = shiftDay(fromDate, i);
    for (const s of schedules) {
      if (!occursOn(s, date)) continue;
      for (const time of s.times) {
        const done = findDoneLog(logs, s.id, date, time);
        out.push({
          scheduleId: s.id,
          scheduleName: s.name,
          compoundId: s.compoundId,
          date,
          time,
          doseAmount: s.doseAmount,
          unitLabel: s.unitLabel,
          sitePrefer: s.sitePrefer,
          done: Boolean(done),
          logId: done?.id,
        });
      }
    }
  }
  return out.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

/** The DoseLog created by tapping "done" on a slot. */
export function logFromSlot(slot: Slot, site: string | undefined, now: Date = new Date()): DoseLog {
  const iso = now.toISOString();
  const log: DoseLog = {
    id: newId(),
    compoundId: slot.compoundId,
    amount: slot.doseAmount,
    datetime: isoAt(slot.date, slot.time),
    date: slot.date,
    scheduleId: slot.scheduleId,
    scheduleTime: slot.time,
    createdAt: iso,
    updatedAt: iso,
  };
  if (slot.unitLabel) log.unitLabel = slot.unitLabel;
  const chosen = site || slot.sitePrefer;
  if (chosen) log.site = chosen;
  return log;
}
