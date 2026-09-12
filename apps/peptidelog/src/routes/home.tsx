import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { Beaker, CalendarClock, Check, FlaskConical, Pencil, Plus, Syringe } from "lucide-react";

import { BackupCard } from "@/components/backup-card";
import { CalcCard } from "@/components/calc-card";
import { CalendarCard } from "@/components/calendar-card";
import { CompoundDialog, type CompoundDraft } from "@/components/compound-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Disclaimer } from "@/components/disclaimer";
import { HalfLifeCard } from "@/components/half-life-card";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { LogDialog } from "@/components/log-dialog";
import { LogForm, type LogDraft } from "@/components/log-form";
import { Masthead } from "@/components/masthead";
import { RotationCard } from "@/components/rotation-card";
import { ScheduleDialog, type ScheduleDraft } from "@/components/schedule-dialog";
import { SuppliesCard } from "@/components/supplies-card";
import { Toast } from "@/components/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";
import { VialDialog, type VialDraft } from "@/components/vial-dialog";
import { backupFilename, buildBackup, download, parseBackup, toJSON } from "@/lib/backup";
import { applyDoseToVial, fmt, isLowStock, remainingOf } from "@/lib/calc";
import { todayStr } from "@/lib/dates";
import { formatRelativeDay } from "@/lib/format";
import { HTML_LANG, OG_IMAGE, detectLang, isLang, rememberLang, siteName, translate, type Lang, type MsgKey } from "@/lib/i18n";
import {
  clearStore,
  emptyStore,
  loadStore,
  reconcile,
  removeById,
  removeCompound,
  saveStore,
  upsert,
  type Compound,
  type DoseLog,
  type Schedule,
  type Store,
  type Vial,
} from "@/lib/model";
import { FONT_SIZES, clampUnitsPerMl, loadPrefs, savePrefs, type FontSize, type Prefs } from "@/lib/prefs";
import { SITES, suggestNextSite } from "@/lib/rotation";
import { logFromSlot, upcomingSlots, type Slot } from "@/lib/schedule";
import { rootRoute } from "@/routes/root";

interface HomeSearch {
  lang?: Lang;
}

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
  validateSearch: (search: Record<string, unknown>): HomeSearch => {
    const next: HomeSearch = {};
    if (isLang(search.lang)) next.lang = search.lang;
    return next;
  },
});

function setMetaContent(selector: string, value: string) {
  document.querySelectorAll<HTMLMetaElement>(selector).forEach((el) => {
    el.setAttribute("content", value);
  });
}

const CHIP_KEYS: MsgKey[] = ["chipNoWall", "chipAnyDay", "chipEditDoses", "chipUnlimited", "chipArithmetic", "chipLocal", "chipLangs"];
const FONT_LABEL: Record<FontSize, MsgKey> = { md: "fontMd", lg: "fontLg", xl: "fontXl" };
const TOAST_MS = 2200;

type Confirm =
  | { kind: "deleteCompound"; id: string }
  | { kind: "deleteVial"; id: string }
  | { kind: "deleteSchedule"; id: string }
  | { kind: "deleteLog"; id: string }
  | { kind: "import"; parsed: ReturnType<typeof parseBackup> }
  | { kind: "clearAll" };

function Home() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  const lang = useMemo(() => detectLang(search.lang ?? null), [search.lang]);
  const t = useCallback((key: MsgKey, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);

  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs());
  const [store, setStore] = useState<Store>(() => loadStore());
  const { compounds, vials, logs, schedules, supplies } = store;
  const [selectedDate, setSelectedDate] = useState(() => todayStr());
  const [quickSite, setQuickSite] = useState<string | undefined>(undefined);
  const [quickKey, setQuickKey] = useState(0);
  const [unitsText, setUnitsText] = useState(String(prefs.syringeUnitsPerMl));

  const [cmpDialog, setCmpDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [vialDialog, setVialDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [schDialog, setSchDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [logDialog, setLogDialog] = useState<{ open: boolean; id: string | null; forDate?: string }>({ open: false, id: null });
  const [confirm, setConfirm] = useState<Confirm | null>(null);

  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const toastTimer = useRef<number | undefined>(undefined);
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastOn(true);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastOn(false), TOAST_MS);
  }, []);
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  // Keep ?lang= on the URL so a reload, a share or a crawler hit resolves the
  // same language the Worker already baked into the first HTML.
  useEffect(() => {
    if (search.lang !== lang) navigate({ search: (prev) => ({ ...prev, lang }), replace: true });
  }, [lang, search.lang, navigate]);

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[lang];
    document.title = t("title");
    setMetaContent('meta[name="description"]', t("metaDescription"));
    setMetaContent('meta[property="og:image"], meta[name="twitter:image"]', OG_IMAGE[lang]);
    document.querySelector('link[rel="manifest"]')?.setAttribute("href", `/manifest.webmanifest?lang=${lang}`);
  }, [lang, t]);

  const commitPrefs = useCallback((next: Prefs) => {
    setPrefs(next);
    savePrefs(next);
  }, []);
  const commit = useCallback((next: Store) => {
    const clean = reconcile(next);
    setStore(clean);
    saveStore(clean);
  }, []);

  // ---- derived ------------------------------------------------------------
  const byId = useMemo(() => new Map(compounds.map((c) => [c.id, c])), [compounds]);
  const nameOf = (id: string) => byId.get(id)?.name ?? "?";
  const suggestedSite = useMemo(() => suggestNextSite(logs), [logs]);
  const today = todayStr();
  const slots = useMemo(() => upcomingSlots(schedules, logs, today, 7), [schedules, logs, today]);
  const logCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of logs) m.set(l.compoundId, (m.get(l.compoundId) ?? 0) + 1);
    return m;
  }, [logs]);
  const hasData = compounds.length + vials.length + logs.length + schedules.length + supplies.length > 0;

  // ---- logs -----------------------------------------------------------------
  function addLog(draft: LogDraft) {
    const { list } = upsert<DoseLog>(logs, draft);
    let nextVials = vials;
    if (draft.vialId) {
      nextVials = vials.map((v) => (v.id === draft.vialId ? applyDoseToVial(v, draft.amount, draft.unitLabel, prefs.syringeUnitsPerMl) : v));
    }
    commit({ ...store, logs: list, vials: nextVials });
    setSelectedDate(draft.date);
    setQuickSite(undefined);
    setQuickKey((k) => k + 1);
    showToast(t("logSaved"));
  }
  function saveEditedLog(draft: LogDraft) {
    if (!logDialog.id) return addLog(draft);
    const existing = logs.find((l) => l.id === logDialog.id);
    const merged = { ...draft, id: logDialog.id, scheduleId: existing?.scheduleId, scheduleTime: existing?.scheduleTime };
    const { list } = upsert<DoseLog>(logs, merged);
    commit({ ...store, logs: list });
    setSelectedDate(draft.date);
    showToast(t("logUpdated"));
  }
  function deleteLog(id: string) {
    commit({ ...store, logs: removeById(logs, id) });
    showToast(t("logDeleted"));
  }

  // ---- compounds --------------------------------------------------------------
  function saveCompound(draft: CompoundDraft) {
    const { list } = upsert<Compound>(compounds, { ...draft, id: cmpDialog.id });
    commit({ ...store, compounds: list });
    showToast(t("compoundSaved"));
  }
  function deleteCompound(id: string) {
    commit(removeCompound(store, id));
    showToast(t("compoundDeleted"));
  }

  // ---- vials -----------------------------------------------------------------------
  function saveVial(draft: VialDraft) {
    const { list } = upsert<Vial>(vials, { ...draft, id: vialDialog.id });
    commit({ ...store, vials: list });
    showToast(t("vialSaved"));
  }
  function deleteVial(id: string) {
    commit({ ...store, vials: removeById(vials, id) });
    showToast(t("vialDeleted"));
  }

  // ---- schedules -------------------------------------------------------------------
  function saveSchedule(draft: ScheduleDraft) {
    const { list } = upsert<Schedule>(schedules, { ...draft, id: schDialog.id });
    commit({ ...store, schedules: list });
    showToast(t("scheduleSaved"));
  }
  function deleteSchedule(id: string) {
    commit({ ...store, schedules: removeById(schedules, id) });
    showToast(t("scheduleDeleted"));
  }
  function markDone(slot: Slot) {
    if (slot.done) return;
    const created = logFromSlot(slot, slot.sitePrefer ?? prefs.defaultSite ?? suggestedSite);
    commit({ ...store, logs: [created, ...logs] });
    setSelectedDate(slot.date);
    showToast(t("logSaved"));
  }

  // ---- settings ------------------------------------------------------------------------
  function commitUnits(raw: string) {
    const n = clampUnitsPerMl(raw === "" ? undefined : raw);
    setUnitsText(String(n));
    if (n !== prefs.syringeUnitsPerMl) commitPrefs({ ...prefs, syringeUnitsPerMl: n });
  }

  // ---- backup ----------------------------------------------------------------------------
  function exportJson() {
    download(toJSON(buildBackup(store, prefs)), backupFilename(), "application/json");
    showToast(t("exported"));
  }
  async function importFile(file: File) {
    let parsed: ReturnType<typeof parseBackup>;
    try {
      parsed = parseBackup(await file.text());
    } catch {
      showToast(t("importBad"));
      return;
    }
    if (!hasData) applyImport(parsed);
    else setConfirm({ kind: "import", parsed });
  }
  function applyImport(parsed: ReturnType<typeof parseBackup>) {
    commit(parsed.store);
    if (parsed.prefs) {
      commitPrefs(parsed.prefs);
      setUnitsText(String(parsed.prefs.syringeUnitsPerMl));
    }
    showToast(t("importOk", { c: parsed.store.compounds.length, l: parsed.store.logs.length }));
  }
  function clearAll() {
    clearStore();
    setStore(emptyStore());
    showToast(t("cleared"));
  }

  const editingCompound = cmpDialog.id ? (byId.get(cmpDialog.id) ?? null) : null;
  const editingVial = vialDialog.id ? (vials.find((v) => v.id === vialDialog.id) ?? null) : null;
  const editingSchedule = schDialog.id ? (schedules.find((s) => s.id === schDialog.id) ?? null) : null;
  const editingLog = logDialog.id ? (logs.find((l) => l.id === logDialog.id) ?? null) : null;

  const confirmText = (() => {
    if (!confirm) return { title: "", body: "", ok: "" };
    switch (confirm.kind) {
      case "deleteCompound": {
        const c = byId.get(confirm.id);
        return {
          title: t("deleteCompoundTitle", { name: c?.name ?? "" }),
          body: t("deleteCompoundBody", {
            vials: vials.filter((v) => v.compoundId === confirm.id).length,
            logs: logs.filter((l) => l.compoundId === confirm.id).length,
            schedules: schedules.filter((s) => s.compoundId === confirm.id).length,
          }),
          ok: t("delete"),
        };
      }
      case "deleteVial":
        return { title: t("deleteVialTitle"), body: t("deleteVialBody"), ok: t("delete") };
      case "deleteSchedule":
        return { title: t("deleteScheduleTitle"), body: t("deleteScheduleBody"), ok: t("delete") };
      case "deleteLog":
        return { title: t("deleteLogTitle"), body: t("deleteLogBody"), ok: t("delete") };
      case "import":
        return { title: t("importConfirmTitle"), body: t("importConfirmBody"), ok: t("importJson") };
      case "clearAll":
        return { title: t("clearAllTitle"), body: t("clearAllBody"), ok: t("delete") };
    }
  })();

  const dayNames = t("daysShort").split(",");

  return (
    <div className="pl-app" data-size={prefs.fontSize}>
      <LocalOnlyBanner text={t("localOnly")} />
      <Disclaimer text={t("notMedical")} />
      <Masthead
        t={t}
        lang={lang}
        onLangChange={(nextLang) => {
          rememberLang(nextLang);
          navigate({ search: (prev) => ({ ...prev, lang: nextLang }), replace: true });
        }}
      />

      {/* 4. Quick log */}
      <Card id="quick-log" size="sm">
        <CardHeader className="grid-cols-[auto_1fr] items-center gap-2">
          <Syringe className="size-4 text-teal-deep" aria-hidden />
          <CardTitle>{t("quickLogTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <LogForm
            t={t}
            lang={lang}
            compounds={compounds}
            vials={vials}
            initial={null}
            suggestedSite={suggestedSite}
            defaultSite={quickSite ?? prefs.defaultSite}
            submitLabel={t("saveLog")}
            idPrefix="quick"
            resetKey={`${quickKey}-${quickSite ?? ""}-${compounds.length}`}
            onSave={addLog}
          />
        </CardContent>
      </Card>

      {/* 5. Reconstitution calculator */}
      <CalcCard t={t} unitsPerMl={prefs.syringeUnitsPerMl} notMedical={t("notMedical")} />

      {/* 6. Compounds */}
      <Card id="compounds" size="sm">
        <CardHeader className="grid-cols-[auto_1fr_auto] items-center gap-2">
          <FlaskConical className="size-4 text-teal-deep" aria-hidden />
          <CardTitle>
            {t("compoundsTitle")} <span className="pl-badge" data-tone="ok">{t("compoundCount", { n: compounds.length })}</span>
          </CardTitle>
          <span className="pl-hint">{t("unlimitedHint")}</span>
        </CardHeader>
        <CardContent className="grid gap-2">
          {compounds.length === 0 ? (
            <div className="pl-empty" id="compounds-empty">
              <p className="pl-empty-title">{t("noCompoundsTitle")}</p>
              <p className="pl-hint">{t("noCompoundsBody")}</p>
            </div>
          ) : (
            <ul className="pl-list" id="compound-list">
              {compounds.map((c) => (
                <li key={c.id} className="pl-row" data-id={c.id} data-role="compound">
                  <div className="pl-row-main">
                    <p className="pl-row-text">{c.name}</p>
                    <span className="pl-row-meta">
                      {c.unitLabel && <span className="pl-badge">{c.unitLabel}</span>}
                      {c.defaultDose !== undefined && (
                        <span>
                          {c.defaultDose} {c.unitLabel ?? ""}
                        </span>
                      )}
                      {(logCount.get(c.id) ?? 0) > 0 && <span>× {logCount.get(c.id)}</span>}
                      {c.halfLifeHours !== undefined && <span>t½ {c.halfLifeHours} h</span>}
                    </span>
                  </div>
                  <span className="pl-row-actions">
                    <button type="button" className="pl-btn pl-btn-icon" data-role="edit-compound" aria-label={`${t("edit")}: ${c.name}`} onClick={() => setCmpDialog({ open: true, id: c.id })}>
                      <Pencil className="size-4" aria-hidden />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <button type="button" className="pl-btn pl-btn-primary" id="add-compound" onClick={() => setCmpDialog({ open: true, id: null })}>
            <Plus className="size-4" aria-hidden />
            {t("addCompound")}
          </button>
        </CardContent>
      </Card>

      {/* 7. Vial inventory */}
      <Card id="vials" size="sm">
        <CardHeader className="grid-cols-[auto_1fr] items-center gap-2">
          <Beaker className="size-4 text-teal-deep" aria-hidden />
          <CardTitle>{t("vialsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {vials.length === 0 ? (
            <div className="pl-empty" id="vials-empty">
              <p className="pl-empty-title">{t("noVialsTitle")}</p>
              <p className="pl-hint">{t("noVialsBody")}</p>
            </div>
          ) : (
            <ul className="pl-list" id="vial-list">
              {vials.map((v) => {
                const low = isLowStock(v);
                const rem = remainingOf(v);
                return (
                  <li key={v.id} className="pl-row" data-id={v.id} data-role="vial" data-tone={low ? "low" : undefined} data-low={low ? "true" : "false"}>
                    <div className="pl-row-main">
                      <p className="pl-row-text">
                        {nameOf(v.compoundId)}
                        {v.label ? ` · ${v.label}` : ""}
                      </p>
                      <span className="pl-row-meta">
                        <span className="pl-badge" data-tone={low ? "low" : "ok"}>
                          {low ? t("lowStock") : t("inStock")}
                        </span>
                        {rem && (
                          <span>
                            {fmt(rem.value, 3)} {rem.unit} {t("remainingLabel")}
                          </span>
                        )}
                        <span>
                          {v.vialMg} mg{v.diluentMl !== undefined ? ` + ${v.diluentMl} mL` : ""}
                        </span>
                        {v.lowStockThreshold !== undefined && (
                          <span>
                            {t("lowThresholdLabel")} {v.lowStockThreshold}
                          </span>
                        )}
                      </span>
                    </div>
                    <span className="pl-row-actions">
                      <button type="button" className="pl-btn pl-btn-icon" data-role="edit-vial" aria-label={t("edit")} onClick={() => setVialDialog({ open: true, id: v.id })}>
                        <Pencil className="size-4" aria-hidden />
                      </button>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <button type="button" className="pl-btn pl-btn-primary" id="add-vial" disabled={compounds.length === 0} onClick={() => setVialDialog({ open: true, id: null })}>
            <Plus className="size-4" aria-hidden />
            {t("addVial")}
          </button>
        </CardContent>
      </Card>

      {/* 8. Schedules */}
      <Card id="schedules" size="sm">
        <CardHeader className="grid-cols-[auto_1fr] items-center gap-2">
          <CalendarClock className="size-4 text-teal-deep" aria-hidden />
          <CardTitle>{t("schedulesTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {schedules.length === 0 ? (
            <div className="pl-empty" id="schedules-empty">
              <p className="pl-empty-title">{t("noSchedulesTitle")}</p>
              <p className="pl-hint">{t("noSchedulesBody")}</p>
            </div>
          ) : (
            <ul className="pl-list" id="schedule-list">
              {schedules.map((s) => (
                <li key={s.id} className="pl-row" data-id={s.id} data-role="schedule" data-tone={s.active ? undefined : "paused"}>
                  <div className="pl-row-main">
                    <p className="pl-row-text">{s.name}</p>
                    <span className="pl-row-meta">
                      <span className="pl-badge">{nameOf(s.compoundId)}</span>
                      <span>
                        {s.doseAmount} {s.unitLabel ?? ""}
                      </span>
                      <span>{s.times.join(" · ")}</span>
                      <span>{s.intervalDays ? t("everyNDays", { n: s.intervalDays }) : s.daysOfWeek.map((d) => dayNames[d]).join(" ")}</span>
                      {!s.active && <span className="pl-badge">{t("paused")}</span>}
                    </span>
                  </div>
                  <span className="pl-row-actions">
                    <button type="button" className="pl-btn pl-btn-icon" data-role="edit-schedule" aria-label={t("edit")} onClick={() => setSchDialog({ open: true, id: s.id })}>
                      <Pencil className="size-4" aria-hidden />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <button type="button" className="pl-btn pl-btn-primary" id="add-schedule" disabled={compounds.length === 0} onClick={() => setSchDialog({ open: true, id: null })}>
            <Plus className="size-4" aria-hidden />
            {t("addSchedule")}
          </button>
          {schedules.length > 0 && (
            <>
              <p className="pl-field-label" id="upcoming-title">
                {t("upcomingTitle")}
              </p>
              {slots.length === 0 ? (
                <p className="pl-hint" id="upcoming-empty">
                  {t("noUpcoming")}
                </p>
              ) : (
                <ul className="pl-list" id="upcoming-list">
                  {slots.map((slot) => (
                    <li key={`${slot.scheduleId}-${slot.date}-${slot.time}`} className="pl-row" data-role="slot" data-done={slot.done ? "true" : "false"} data-tone={slot.done ? "done" : undefined}>
                      <div className="pl-row-main">
                        <p className="pl-row-text">
                          {formatRelativeDay(lang, slot.date)} {slot.time} · {nameOf(slot.compoundId)}
                        </p>
                        <span className="pl-row-meta">
                          <span>{slot.scheduleName}</span>
                          <span>
                            {slot.doseAmount} {slot.unitLabel ?? ""}
                          </span>
                          {slot.sitePrefer && <span className="pl-badge">{siteName(lang, slot.sitePrefer)}</span>}
                        </span>
                      </div>
                      <span className="pl-row-actions">
                        {slot.done ? (
                          <span className="pl-badge" data-tone="lav">
                            <Check className="size-3.5" aria-hidden /> {t("done")}
                          </span>
                        ) : (
                          <button type="button" className="pl-btn pl-btn-sm pl-btn-lav" data-role="mark-done" onClick={() => markDone(slot)}>
                            <Check className="size-4" aria-hidden />
                            {t("markDone")}
                          </button>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 9. Calendar */}
      <CalendarCard
        t={t}
        lang={lang}
        logs={logs}
        compounds={compounds}
        selected={selectedDate}
        onSelect={setSelectedDate}
        onAdd={(date) => setLogDialog({ open: true, id: null, forDate: date })}
        onEdit={(l) => setLogDialog({ open: true, id: l.id })}
        onDelete={(l) => setConfirm({ kind: "deleteLog", id: l.id })}
      />

      {/* 10. Site rotation */}
      <RotationCard
        t={t}
        lang={lang}
        logs={logs}
        onUse={(site) => {
          setQuickSite(site);
          document.getElementById("quick-log")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />

      {/* 11. Optional half-life estimate */}
      <HalfLifeCard t={t} compounds={compounds} logs={logs} enabled={prefs.showHalfLife} onToggle={(v) => commitPrefs({ ...prefs, showHalfLife: v })} />

      {/* 12. Supplies stub */}
      <SuppliesCard t={t} supplies={supplies} onChange={(next) => commit({ ...store, supplies: next })} />

      {/* Settings */}
      <Card id="settings" size="sm">
        <CardHeader>
          <CardTitle>{t("settingsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="pl-setting-row">
            <div className="grid gap-0.5 min-w-0">
              <label className="pl-toggle-label" htmlFor="units-per-ml">
                {t("unitsPerMlLabel")}
              </label>
              <span className="pl-hint">{t("unitsPerMlHint")}</span>
            </div>
            <Input
              id="units-per-ml"
              className="pl-num-input"
              inputMode="numeric"
              autoComplete="off"
              enterKeyHint="done"
              value={unitsText}
              onChange={(e) => setUnitsText(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
              onBlur={(e) => commitUnits(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
            />
          </div>
          <div className="pl-setting-row">
            <label className="pl-toggle-label" htmlFor="default-site">
              {t("defaultSiteLabel")}
            </label>
            <Select id="default-site" className="max-w-[12rem]" value={prefs.defaultSite ?? ""} onChange={(e) => commitPrefs({ ...prefs, defaultSite: e.target.value || undefined })}>
              <SelectOption value="">{t("siteNone")}</SelectOption>
              {SITES.map((s) => (
                <SelectOption key={s} value={s}>
                  {siteName(lang, s)}
                </SelectOption>
              ))}
            </Select>
          </div>
          <div className="pl-setting-row">
            <span className="pl-toggle-label">{t("fontSize")}</span>
            <div className="pl-seg" role="group" aria-label={t("fontSize")} id="font-size">
              {FONT_SIZES.map((size) => (
                <button key={size} type="button" className="pl-seg-btn" aria-pressed={prefs.fontSize === size} onClick={() => commitPrefs({ ...prefs, fontSize: size })}>
                  {t(FONT_LABEL[size])}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 14. Backup */}
      <BackupCard t={t} hasData={hasData} onExportJson={exportJson} onImportFile={(f) => void importFile(f)} onClearAll={() => setConfirm({ kind: "clearAll" })} />

      {/* 13. Fail-case chips */}
      <div className="flex flex-wrap gap-[0.3rem]" id="promise-chips">
        {CHIP_KEYS.map((key) => (
          <span key={key} className="pl-promise">
            {t(key)}
          </span>
        ))}
      </div>

      <p className="pl-hint" id="about-text">
        {t("about")}
      </p>
      <p className="pl-disclaimer-inline" id="footer-disclaimer" role="note">
        {t("notMedical")}
      </p>

      <footer className="pl-footer">
        <a id="link-privacy" href={`https://try-dabble.com/${lang}/privacy`}>
          {t("privacy")}
        </a>
        <a id="link-terms" href={`https://try-dabble.com/${lang}/terms`}>
          {t("terms")}
        </a>
        <a id="link-guide" href={`https://try-dabble.com/${lang}/guides/peptidelog`}>
          {t("guide")}
        </a>
        <a id="link-hub" href={`https://try-dabble.com/${lang}`}>
          try-dabble.com
        </a>
      </footer>

      <CompoundDialog
        open={cmpDialog.open}
        compound={editingCompound}
        t={t}
        onOpenChange={(open) => setCmpDialog((d) => ({ ...d, open }))}
        onSave={saveCompound}
        onDelete={() => {
          if (!cmpDialog.id) return;
          setCmpDialog({ open: false, id: null });
          setConfirm({ kind: "deleteCompound", id: cmpDialog.id });
        }}
      />
      <VialDialog
        open={vialDialog.open}
        vial={editingVial}
        compounds={compounds}
        defaultCompoundId={compounds[0]?.id ?? ""}
        t={t}
        onOpenChange={(open) => setVialDialog((d) => ({ ...d, open }))}
        onSave={saveVial}
        onDelete={() => {
          if (!vialDialog.id) return;
          setVialDialog({ open: false, id: null });
          setConfirm({ kind: "deleteVial", id: vialDialog.id });
        }}
      />
      <ScheduleDialog
        open={schDialog.open}
        schedule={editingSchedule}
        compounds={compounds}
        t={t}
        lang={lang}
        onOpenChange={(open) => setSchDialog((d) => ({ ...d, open }))}
        onSave={saveSchedule}
        onDelete={() => {
          if (!schDialog.id) return;
          setSchDialog({ open: false, id: null });
          setConfirm({ kind: "deleteSchedule", id: schDialog.id });
        }}
      />
      <LogDialog
        open={logDialog.open}
        log={editingLog}
        forDate={logDialog.forDate}
        compounds={compounds}
        vials={vials}
        suggestedSite={suggestedSite}
        defaultSite={prefs.defaultSite}
        t={t}
        lang={lang}
        onOpenChange={(open) => setLogDialog((d) => ({ ...d, open }))}
        onSave={saveEditedLog}
        onDelete={() => {
          if (!logDialog.id) return;
          setLogDialog({ open: false, id: null });
          setConfirm({ kind: "deleteLog", id: logDialog.id });
        }}
      />
      <ConfirmDialog
        open={confirm !== null}
        title={confirmText.title}
        body={confirmText.body}
        confirmLabel={confirmText.ok}
        cancelLabel={t("cancel")}
        destructive={confirm?.kind !== "import"}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
        onConfirm={() => {
          if (!confirm) return;
          switch (confirm.kind) {
            case "deleteCompound":
              deleteCompound(confirm.id);
              break;
            case "deleteVial":
              deleteVial(confirm.id);
              break;
            case "deleteSchedule":
              deleteSchedule(confirm.id);
              break;
            case "deleteLog":
              deleteLog(confirm.id);
              break;
            case "import":
              applyImport(confirm.parsed);
              break;
            case "clearAll":
              clearAll();
              break;
          }
        }}
      />
      <Toast message={toastMsg} visible={toastOn} />
    </div>
  );
}
