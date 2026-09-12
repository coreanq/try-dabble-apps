import { useEffect, useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";
import { TIME_RE } from "@/lib/dates";
import { siteName, type Lang, type Translate } from "@/lib/i18n";
import { NAME_MAX, UNIT_LABELS, type Compound, type Schedule } from "@/lib/model";
import { SITES } from "@/lib/rotation";

export interface ScheduleDraft {
  name: string;
  compoundId: string;
  doseAmount: number;
  unitLabel: string;
  times: string[];
  daysOfWeek: number[];
  intervalDays?: number;
  sitePrefer?: string;
  active: boolean;
}

/** Add or edit one protocol: compound, dose per slot, times, weekdays or every-N-days, preferred site. */
export function ScheduleDialog({
  open,
  schedule,
  compounds,
  t,
  lang,
  onOpenChange,
  onSave,
  onDelete,
}: {
  open: boolean;
  schedule: Schedule | null;
  compounds: Compound[];
  t: Translate;
  lang: Lang;
  onOpenChange: (open: boolean) => void;
  onSave: (draft: ScheduleDraft) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState("");
  const [compoundId, setCompoundId] = useState("");
  const [dose, setDose] = useState("");
  const [unit, setUnit] = useState("mcg");
  const [times, setTimes] = useState("09:00");
  const [mode, setMode] = useState<"weekdays" | "interval">("weekdays");
  const [days, setDays] = useState<number[]>([1, 3, 5]);
  const [interval, setInterval] = useState("2");
  const [site, setSite] = useState("");
  const [active, setActive] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const c = compounds.find((x) => x.id === (schedule?.compoundId ?? "")) ?? compounds[0];
    setName(schedule?.name ?? "");
    setCompoundId(schedule?.compoundId ?? c?.id ?? "");
    setDose(schedule ? String(schedule.doseAmount) : c?.defaultDose !== undefined ? String(c.defaultDose) : "");
    setUnit(schedule?.unitLabel ?? c?.unitLabel ?? "mcg");
    setTimes(schedule ? schedule.times.join(", ") : "09:00");
    setMode(schedule?.intervalDays ? "interval" : "weekdays");
    setDays(schedule && schedule.daysOfWeek.length ? schedule.daysOfWeek : [1, 3, 5]);
    setInterval(schedule?.intervalDays ? String(schedule.intervalDays) : "2");
    setSite(schedule?.sitePrefer ?? "");
    setActive(schedule ? schedule.active : true);
    setError("");
  }, [open, schedule, compounds]);

  const dayNames = t("daysShort").split(",");

  function toggleDay(d: number) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b)));
  }

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return setError(t("needScheduleName"));
    if (!compoundId) return setError(t("needCompound"));
    const n = Number(dose);
    if (!Number.isFinite(n) || n <= 0) return setError(t("needAmount"));
    const parsedTimes = [...new Set(times.split(/[,\s]+/).map((s) => s.trim()).filter((s) => TIME_RE.test(s)))].sort();
    if (parsedTimes.length === 0) return setError(t("needTimes"));
    const draft: ScheduleDraft = { name: trimmed.slice(0, NAME_MAX), compoundId, doseAmount: n, unitLabel: unit, times: parsedTimes, daysOfWeek: [], active };
    if (mode === "interval") {
      const iv = Math.floor(Number(interval));
      if (!Number.isFinite(iv) || iv < 1) return setError(t("needDays"));
      draft.intervalDays = iv;
    } else {
      if (days.length === 0) return setError(t("needDays"));
      draft.daysOfWeek = days;
    }
    if (site) draft.sitePrefer = site;
    onSave(draft);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent id="schedule-dialog" className="gap-3 max-h-[92dvh] overflow-y-auto">
        <DialogTitle className="pl-sheet-title pr-8">{schedule ? t("editScheduleTitle") : t("newScheduleTitle")}</DialogTitle>
        <DialogDescription className="sr-only">{t("schedulesTitle")}</DialogDescription>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div>
            <label className="pl-field-label" htmlFor="sch-name">
              {t("scheduleNameLabel")}
            </label>
            <Input id="sch-name" maxLength={NAME_MAX} autoComplete="off" placeholder={t("scheduleNamePlaceholder")} value={name} onChange={(e) => { setName(e.target.value); if (error) setError(""); }} />
          </div>
          <div>
            <label className="pl-field-label" htmlFor="sch-compound">
              {t("compoundLabel")}
            </label>
            <Select id="sch-compound" value={compoundId} onChange={(e) => setCompoundId(e.target.value)}>
              {compounds.map((c) => (
                <SelectOption key={c.id} value={c.id}>
                  {c.name}
                </SelectOption>
              ))}
            </Select>
          </div>
          <div className="pl-grid-2">
            <div>
              <label className="pl-field-label" htmlFor="sch-dose">
                {t("doseLabel")}
              </label>
              <Input id="sch-dose" inputMode="decimal" autoComplete="off" value={dose} onChange={(e) => setDose(e.target.value.replace(/[^\d.]/g, ""))} />
            </div>
            <div>
              <label className="pl-field-label" htmlFor="sch-unit">
                {t("unitLabel")}
              </label>
              <Select id="sch-unit" value={unit} onChange={(e) => setUnit(e.target.value)}>
                {UNIT_LABELS.map((u) => (
                  <SelectOption key={u} value={u}>
                    {u}
                  </SelectOption>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <label className="pl-field-label" htmlFor="sch-times">
              {t("timesLabel")}
            </label>
            <Input id="sch-times" inputMode="numeric" autoComplete="off" placeholder={t("timesHint")} value={times} onChange={(e) => setTimes(e.target.value)} />
          </div>
          <div>
            <span className="pl-field-label">{t("repeatLabel")}</span>
            <div className="pl-seg" role="group" aria-label={t("repeatLabel")} id="sch-mode">
              <button type="button" className="pl-seg-btn" aria-pressed={mode === "weekdays"} onClick={() => setMode("weekdays")}>
                {t("repeatWeekdays")}
              </button>
              <button type="button" className="pl-seg-btn" aria-pressed={mode === "interval"} onClick={() => setMode("interval")}>
                {t("repeatInterval")}
              </button>
            </div>
          </div>
          {mode === "weekdays" ? (
            <div className="pl-chip-row" id="sch-days" role="group" aria-label={t("repeatWeekdays")}>
              {dayNames.map((label, d) => (
                <button key={d} type="button" className="pl-chip" aria-pressed={days.includes(d)} data-day={d} onClick={() => toggleDay(d)}>
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <div className="pl-setting-row">
              <label className="pl-toggle-label" htmlFor="sch-interval">
                {t("repeatInterval")}
              </label>
              <Input id="sch-interval" className="pl-num-input" inputMode="numeric" autoComplete="off" value={interval} onChange={(e) => setInterval(e.target.value.replace(/[^\d]/g, ""))} />
            </div>
          )}
          <div>
            <label className="pl-field-label" htmlFor="sch-site">
              {t("sitePreferLabel")}
            </label>
            <Select id="sch-site" value={site} onChange={(e) => setSite(e.target.value)}>
              <SelectOption value="">{t("siteNone")}</SelectOption>
              {SITES.map((s) => (
                <SelectOption key={s} value={s}>
                  {siteName(lang, s)}
                </SelectOption>
              ))}
            </Select>
          </div>
          <label className="pl-toggle" htmlFor="sch-active">
            <span className="pl-toggle-label">{t("activeLabel")}</span>
            <input id="sch-active" className="pl-switch" type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          </label>
          {error && (
            <p className="pl-error" role="alert" id="sch-error">
              {error}
            </p>
          )}
          <div className="pl-actions">
            <button type="button" className="pl-btn pl-btn-quiet" id="sch-cancel" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </button>
            <button type="submit" className="pl-btn pl-btn-primary" id="sch-save">
              {t("save")}
            </button>
            {schedule && (
              <button type="button" className="pl-btn pl-btn-danger col-span-2" id="sch-delete" onClick={onDelete}>
                {t("delete")}
              </button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
