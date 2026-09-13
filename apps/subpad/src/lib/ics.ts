/**
 * Calendar export. One VEVENT per subscription with an RRULE that matches
 * the billing cycle and a one-day-before alarm, so the OS calendar does the
 * reminding. Plain text, no network, built on this device.
 */
import { formatMoney, nextOnOrAfter, type Cycle } from "./money.ts";

export interface IcsSubscription {
  id: string;
  name: string;
  price: number;
  currency: string;
  nextRenewal: string;
  cycle: Cycle;
  website?: string;
  notes?: string;
}

const CRLF = "\r\n";

export function icsEscape(s: string): string {
  return String(s)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** RFC 5545 §3.1: lines longer than 75 octets are folded with CRLF + space. */
export function foldLine(line: string): string {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const out: string[] = [];
  let cur = "";
  let curBytes = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    const limit = out.length === 0 ? 75 : 74;
    if (curBytes + b > limit) {
      out.push(cur);
      cur = ch;
      curBytes = b;
    } else {
      cur += ch;
      curBytes += b;
    }
  }
  if (cur) out.push(cur);
  return out.join(CRLF + " ");
}

export function rruleFor(cycle: Cycle): string {
  switch (cycle) {
    case "weekly":
      return "FREQ=WEEKLY";
    case "monthly":
      return "FREQ=MONTHLY";
    case "quarterly":
      return "FREQ=MONTHLY;INTERVAL=3";
    case "yearly":
      return "FREQ=YEARLY";
  }
}

function dateValue(key: string): string {
  return key.replace(/-/g, "");
}

function stamp(now: Date): string {
  return now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function icsForSubscriptions(
  subs: IcsSubscription[],
  opts: { now?: Date; locale?: string; alarm?: boolean; summaryPrefix?: string } = {},
): string {
  const now = opts.now ?? new Date();
  const alarm = opts.alarm ?? true;
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//try-dabble//Subpad//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Subpad",
  ];
  for (const s of subs) {
    const start = nextOnOrAfter(s.nextRenewal, s.cycle, now);
    const price = formatMoney(s.price, s.currency, opts.locale);
    const desc = [price, s.website, s.notes].filter(Boolean).join("\n");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${s.id}@subpad.try-dabble.com`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART;VALUE=DATE:${dateValue(start)}`,
      `DTEND;VALUE=DATE:${dateValue(addCycleDays(start, 1))}`,
      `RRULE:${rruleFor(s.cycle)}`,
      `SUMMARY:${icsEscape((opts.summaryPrefix ?? "") + s.name)}`,
      `DESCRIPTION:${icsEscape(desc)}`,
      "TRANSP:TRANSPARENT",
    );
    if (s.website) lines.push(`URL:${icsEscape(s.website)}`);
    if (alarm) {
      lines.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${icsEscape(s.name)}`, "TRIGGER:-P1D", "END:VALARM");
    }
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join(CRLF) + CRLF;
}

function addCycleDays(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
}

export function slugify(name: string): string {
  const s = String(name)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return s || "subscription";
}

export function icsFilename(sub?: IcsSubscription | null): string {
  return sub ? `subpad-${slugify(sub.name)}.ics` : "subpad-all.ics";
}
