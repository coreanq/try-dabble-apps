import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";
import { dateKeyOfIso, fromLocalInput, toLocalInput } from "@/lib/dates";
import { siteName, type Lang, type Translate } from "@/lib/i18n";
import { NOTES_MAX, UNIT_LABELS, type Compound, type DoseLog, type Vial } from "@/lib/model";
import { SITES } from "@/lib/rotation";

export interface LogDraft {
  compoundId: string;
  vialId?: string;
  amount: number;
  unitLabel: string;
  datetime: string;
  date: string;
  site?: string;
  notes?: string;
}

/**
 * One form for both the quick-log card and the edit dialog. The date & time
 * field is a plain datetime-local input that defaults to now (or to the day
 * picked on the calendar) and is always editable: nothing locks it to today.
 * Nothing is focused on open, so the sheet is readable before the keyboard
 * covers half of it.
 */
export function LogForm({
  t,
  lang,
  compounds,
  vials,
  initial,
  defaultDate,
  suggestedSite,
  defaultSite,
  submitLabel,
  idPrefix,
  resetKey,
  onSave,
}: {
  t: Translate;
  lang: Lang;
  compounds: Compound[];
  vials: Vial[];
  initial: DoseLog | null;
  defaultDate?: string;
  suggestedSite: string;
  defaultSite?: string;
  submitLabel: string;
  idPrefix: string;
  resetKey: string | number;
  onSave: (draft: LogDraft) => void;
}) {
  const [compoundId, setCompoundId] = useState("");
  const [vialId, setVialId] = useState("");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("mcg");
  const [when, setWhen] = useState("");
  const [site, setSite] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  // Rebuild the fields whenever the parent hands us a different log / day.
  useEffect(() => {
    const first = compounds[0];
    const cid = initial?.compoundId ?? first?.id ?? "";
    const c = compounds.find((x) => x.id === cid);
    setCompoundId(cid);
    setVialId(initial?.vialId ?? "");
    setAmount(initial ? String(initial.amount) : c?.defaultDose !== undefined ? String(c.defaultDose) : "");
    setUnit(initial?.unitLabel ?? c?.unitLabel ?? "mcg");
    if (initial) setWhen(toLocalInput(initial.datetime));
    else if (defaultDate) {
      const now = new Date();
      setWhen(`${defaultDate}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
    } else setWhen(toLocalInput(new Date().toISOString()));
    setSite(initial?.site ?? defaultSite ?? suggestedSite ?? "");
    setNotes(initial?.notes ?? "");
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, initial?.id, defaultDate]);

  // Switching compound: follow its default unit / dose unless the user typed something.
  function pickCompound(id: string) {
    setCompoundId(id);
    const c = compounds.find((x) => x.id === id);
    if (c?.unitLabel) setUnit(c.unitLabel);
    if (!initial && c?.defaultDose !== undefined && amount === "") setAmount(String(c.defaultDose));
    if (vialId && !vials.some((v) => v.id === vialId && v.compoundId === id)) setVialId("");
  }

  const compoundVials = vials.filter((v) => v.compoundId === compoundId);

  function submit() {
    if (!compoundId) return setError(t("needCompound"));
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return setError(t("needAmount"));
    const iso = fromLocalInput(when);
    if (!iso) return setError(t("needDatetime"));
    const draft: LogDraft = { compoundId, amount: n, unitLabel: unit, datetime: iso, date: dateKeyOfIso(iso) };
    if (vialId) draft.vialId = vialId;
    if (site) draft.site = site;
    const nt = notes.trim();
    if (nt) draft.notes = nt.slice(0, NOTES_MAX);
    onSave(draft);
  }

  const id = (s: string) => `${idPrefix}-${s}`;

  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div>
        <label className="pl-field-label" htmlFor={id("compound")}>
          {t("compoundLabel")}
        </label>
        <Select id={id("compound")} value={compoundId} onChange={(e) => pickCompound(e.target.value)} disabled={compounds.length === 0}>
          {compounds.length === 0 && <SelectOption value="">{t("addCompoundFirst")}</SelectOption>}
          {compounds.map((c) => (
            <SelectOption key={c.id} value={c.id}>
              {c.name}
            </SelectOption>
          ))}
        </Select>
      </div>
      <div className="pl-grid-2">
        <div>
          <label className="pl-field-label" htmlFor={id("amount")}>
            {t("amountLabel")}
          </label>
          <Input id={id("amount")} type="text" inputMode="decimal" autoComplete="off" enterKeyHint="done" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} />
        </div>
        <div>
          <label className="pl-field-label" htmlFor={id("unit")}>
            {t("unitLabel")}
          </label>
          <Select id={id("unit")} value={unit} onChange={(e) => setUnit(e.target.value)}>
            {UNIT_LABELS.map((u) => (
              <SelectOption key={u} value={u}>
                {u}
              </SelectOption>
            ))}
            {!(UNIT_LABELS as readonly string[]).includes(unit) && <SelectOption value={unit}>{unit}</SelectOption>}
          </Select>
        </div>
      </div>
      <div>
        <label className="pl-field-label" htmlFor={id("when")}>
          {t("datetimeLabel")}
        </label>
        <Input id={id("when")} type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
      </div>
      <div className="pl-grid-2">
        <div>
          <label className="pl-field-label" htmlFor={id("site")}>
            {t("siteLabel")}
          </label>
          <Select id={id("site")} value={site} onChange={(e) => setSite(e.target.value)}>
            <SelectOption value="">{t("siteNone")}</SelectOption>
            {SITES.map((s) => (
              <SelectOption key={s} value={s}>
                {siteName(lang, s)}
                {s === suggestedSite ? ` · ${t("siteSuggested")}` : ""}
              </SelectOption>
            ))}
          </Select>
        </div>
        <div>
          <label className="pl-field-label" htmlFor={id("vial")}>
            {t("vialLabel")}
          </label>
          <Select id={id("vial")} value={vialId} onChange={(e) => setVialId(e.target.value)}>
            <SelectOption value="">{t("vialNone")}</SelectOption>
            {compoundVials.map((v) => (
              <SelectOption key={v.id} value={v.id}>
                {v.label || `${v.vialMg} mg`}
              </SelectOption>
            ))}
          </Select>
        </div>
      </div>
      <div>
        <label className="pl-field-label" htmlFor={id("notes")}>
          {t("notesLabel")}
        </label>
        <textarea id={id("notes")} className="pl-textarea" rows={2} maxLength={NOTES_MAX} autoComplete="off" placeholder={t("notesPlaceholder")} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      {error && (
        <p className="pl-error" role="alert" id={id("error")}>
          {error}
        </p>
      )}
      <button type="submit" className="pl-btn pl-btn-primary" id={id("save")} disabled={compounds.length === 0}>
        {submitLabel}
      </button>
    </form>
  );
}
