import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { Pencil, Plus } from "lucide-react";

import { BackupCard } from "@/components/backup-card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { LogDialog, type LogDraft } from "@/components/log-dialog";
import { Masthead } from "@/components/masthead";
import { MilestoneList } from "@/components/milestone-list";
import { RouteDialog, type RouteDraft } from "@/components/route-dialog";
import { Toast } from "@/components/toast";
import { RouteIcon, TrailMap } from "@/components/trail-art";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { backupFilename, buildBackup, download, parseBackup, toJSON } from "@/lib/backup";
import { isDateStr, parseDate, todayStr } from "@/lib/dates";
import {
  HTML_LANG,
  NUM_LOCALE,
  OG_IMAGE,
  detectLang,
  isLang,
  rememberLang,
  translate,
  type Lang,
  type MsgKey,
} from "@/lib/i18n";
import { LOGS_KEY, loadLogs, logsForRoute, newId, saveLogs, type LogEntry } from "@/lib/logs";
import { FONT_SIZES, PREFS_KEY, loadPrefs, savePrefs, type FontSize, type Prefs } from "@/lib/prefs";
import { PROGRESS_KEY, newlyUnlocked, progressFor, saveProgress, snapshot, statsFor, type RouteProgress } from "@/lib/progress";
import { PRESET_ROUTES, ROUTES_KEY, allRoutes, findRoute, loadCustomRoutes, localized, saveCustomRoutes, type Route } from "@/lib/routes";
import { formatDistance, parseNumber, stepsToMiles, toMiles, type Unit } from "@/lib/units";
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

const CHIP_KEYS: MsgKey[] = ["chipManual", "chipSwitch", "chipNoMembership", "chipBackup", "chipNoAi", "chipLocal", "chipLangs"];
const FONT_LABEL: Record<FontSize, MsgKey> = { md: "fontMd", lg: "fontLg", xl: "fontXl" };
const UNITS: Unit[] = ["mi", "km"];
const TOAST_MS = 2400;

type Confirm =
  | { kind: "deleteRoute"; id: string }
  | { kind: "deleteLog"; id: string }
  | { kind: "import"; parsed: ReturnType<typeof parseBackup> }
  | { kind: "clearAll" };

function Home() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  const lang = useMemo(() => detectLang(search.lang ?? null), [search.lang]);
  const t = useCallback(
    (key: MsgKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );
  const locale = NUM_LOCALE[lang];

  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs());
  const [custom, setCustom] = useState<Route[]>(() => loadCustomRoutes());
  const [logs, setLogs] = useState<LogEntry[]>(() => loadLogs());
  const [today, setToday] = useState<string>(() => todayStr());

  const routes = useMemo(() => allRoutes(custom), [custom]);
  const active: Route = useMemo(() => findRoute(routes, prefs.activeRouteId) ?? PRESET_ROUTES[0], [routes, prefs.activeRouteId]);
  const unitLabel = t(prefs.unit === "km" ? "unitKm" : "unitMi");

  const [routeDialog, setRouteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [logDialog, setLogDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [confirm, setConfirm] = useState<Confirm | null>(null);

  const [distance, setDistance] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState<string>(() => todayStr());
  const [formError, setFormError] = useState("");
  const [steps, setSteps] = useState("");
  const [stepsError, setStepsError] = useState("");

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
    if (search.lang !== lang) {
      navigate({ search: (prev) => ({ ...prev, lang }), replace: true });
    }
  }, [lang, search.lang, navigate]);

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[lang];
    document.title = t("title");
    setMetaContent('meta[name="description"]', t("metaDescription"));
    setMetaContent('meta[property="og:image"], meta[name="twitter:image"]', OG_IMAGE[lang]);
    // Manifest fetches omit cookies, so the language has to ride on the URL.
    document
      .querySelector('link[rel="manifest"]')
      ?.setAttribute("href", `/manifest.webmanifest?lang=${lang}`);
  }, [lang, t]);

  // The date in the log form follows the wall clock when the tab comes back.
  useEffect(() => {
    const check = () => {
      const now = todayStr();
      setToday((prev) => {
        if (prev !== now) setDate((d) => (d === prev ? now : d));
        return now;
      });
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", check);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", check);
    };
  }, []);

  const commitPrefs = useCallback((next: Prefs) => {
    setPrefs(next);
    savePrefs(next);
  }, []);
  const commitCustom = useCallback((next: Route[]) => {
    setCustom(next);
    saveCustomRoutes(next);
  }, []);
  const commitLogs = useCallback(
    (next: LogEntry[], routesNow: Route[] = routes) => {
      setLogs(next);
      saveLogs(next);
      // The explicit per-route snapshot: switching routes never touches it,
      // and a backup carries the unlocked badges along.
      saveProgress(snapshot(routesNow, next));
    },
    [routes],
  );

  const progress: RouteProgress = useMemo(() => progressFor(active, logs), [active, logs]);
  const progressById = useMemo(() => new Map(routes.map((r) => [r.id, progressFor(r, logs)])), [routes, logs]);
  const history = useMemo(() => logsForRoute(logs, active.id), [logs, active.id]);
  const stats = useMemo(() => statsFor(logs, today), [logs, today]);

  const dist = useCallback((miles: number, digits = 1) => formatDistance(miles, prefs.unit, locale, unitLabel, digits), [prefs.unit, locale, unitLabel]);
  const monFmt = useMemo(() => new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }), [locale]);
  const dateFmt = useMemo(() => new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }), [locale]);
  const fmtDate = useCallback(
    (d: string) => {
      const ms = parseDate(d);
      return ms === null ? d : dateFmt.format(new Date(ms));
    },
    [dateFmt],
  );
  const numFmt = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  const stepsN = parseNumber(steps);
  const stepsMiles = Number.isNaN(stepsN) ? 0 : stepsToMiles(stepsN, prefs.stepsPerMile);

  // ---- logging -------------------------------------------------------------

  function announce(before: RouteProgress, after: RouteProgress, fallback: string) {
    const fresh = newlyUnlocked(before, after);
    if (after.done && !before.done) showToast(t("routeDone"));
    else if (fresh.length > 0) showToast(t("milestoneUnlockedToast", { name: localized(fresh[fresh.length - 1].milestone.name, lang) }));
    else showToast(fallback);
  }

  function addEntry(miles: number, source: "manual" | "steps", stepCount?: number) {
    const when = isDateStr(date) ? date : today;
    const now = new Date().toISOString();
    const entry: LogEntry = { id: newId(), routeId: active.id, miles, date: when, source, createdAt: now, updatedAt: now };
    if (note.trim()) entry.note = note.trim().slice(0, 140);
    if (source === "steps" && stepCount) entry.steps = Math.round(stepCount);
    const next = [...logs, entry];
    commitLogs(next);
    announce(progress, progressFor(active, next), t("logAdded"));
    setDistance("");
    setNote("");
    setSteps("");
    setFormError("");
    setStepsError("");
  }

  function addManual() {
    const n = parseNumber(distance);
    if (Number.isNaN(n) || n <= 0) {
      setFormError(t("invalidDistance"));
      return;
    }
    if (!isDateStr(date)) {
      setFormError(t("invalidDate"));
      return;
    }
    addEntry(toMiles(n, prefs.unit), "manual");
  }

  function addFromSteps() {
    if (Number.isNaN(stepsN) || stepsN <= 0 || stepsMiles <= 0) {
      setStepsError(t("invalidSteps"));
      return;
    }
    if (!isDateStr(date)) {
      setFormError(t("invalidDate"));
      return;
    }
    addEntry(stepsMiles, "steps", stepsN);
  }

  function saveEntry(draft: LogDraft) {
    if (!logDialog.id) return;
    const next = logs.map((l) =>
      l.id === logDialog.id
        ? { ...l, miles: draft.miles, date: draft.date, note: draft.note ? draft.note.slice(0, 140) : undefined, updatedAt: new Date().toISOString() }
        : l,
    );
    commitLogs(next);
    announce(progress, progressFor(active, next), t("logSaved"));
  }

  function deleteEntry(id: string) {
    commitLogs(logs.filter((l) => l.id !== id));
    showToast(t("logDeleted"));
  }

  // ---- routes --------------------------------------------------------------

  function pickRoute(id: string) {
    // Only the pointer moves. Every route's log stays exactly where it was.
    commitPrefs({ ...prefs, activeRouteId: id });
  }

  function saveRoute(draft: RouteDraft) {
    const now = new Date().toISOString();
    if (routeDialog.id) {
      commitCustom(custom.map((r) => (r.id === routeDialog.id ? { ...r, name: draft.name, totalMiles: draft.totalMiles, milestones: draft.milestones, updatedAt: now } : r)));
    } else {
      const route: Route = { id: newId(), kind: "custom", name: draft.name, totalMiles: draft.totalMiles, milestones: draft.milestones, createdAt: now, updatedAt: now };
      const nextCustom = [...custom, route];
      commitCustom(nextCustom);
      commitPrefs({ ...prefs, activeRouteId: route.id });
    }
    showToast(t("routeSaved"));
  }

  function deleteRoute(id: string) {
    const nextCustom = custom.filter((r) => r.id !== id);
    commitCustom(nextCustom);
    commitLogs(logs.filter((l) => l.routeId !== id), allRoutes(nextCustom));
    if (prefs.activeRouteId === id) commitPrefs({ ...prefs, activeRouteId: PRESET_ROUTES[0].id });
    showToast(t("routeDeleted"));
  }

  // ---- backup --------------------------------------------------------------

  function exportJson() {
    download(toJSON(buildBackup(custom, logs, prefs)), backupFilename(), "application/json");
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
    if (custom.length === 0 && logs.length === 0) applyImport(parsed);
    else setConfirm({ kind: "import", parsed });
  }

  function applyImport(parsed: ReturnType<typeof parseBackup>) {
    commitCustom(parsed.routes);
    commitLogs(parsed.logs, allRoutes(parsed.routes));
    if (parsed.prefs) commitPrefs({ ...parsed.prefs, fontSize: prefs.fontSize });
    showToast(t("importOk", { r: parsed.routes.length, l: parsed.logs.length }));
  }

  function clearAll() {
    try {
      localStorage.removeItem(ROUTES_KEY);
      localStorage.removeItem(LOGS_KEY);
      localStorage.removeItem(PROGRESS_KEY);
      localStorage.removeItem(PREFS_KEY);
    } catch {
      /* private mode */
    }
    setCustom([]);
    setLogs([]);
    setPrefs({ ...prefs, activeRouteId: undefined });
    showToast(t("cleared"));
  }

  const editingRoute = routeDialog.id ? (custom.find((r) => r.id === routeDialog.id) ?? null) : null;
  const editingLog = logDialog.id ? (logs.find((l) => l.id === logDialog.id) ?? null) : null;
  const hasData = custom.length > 0 || logs.length > 0;
  const milestoneRatios = progress.milestones.map((m) => (active.totalMiles > 0 ? m.milestone.milesFromStart / active.totalMiles : 0));
  const unlockedCount = progress.milestones.filter((m) => m.unlocked).length;

  const confirmText = (() => {
    if (!confirm) return { title: "", body: "", ok: "" };
    switch (confirm.kind) {
      case "deleteRoute": {
        const r = custom.find((x) => x.id === confirm.id);
        const count = logs.filter((l) => l.routeId === confirm.id).length;
        return { title: t("deleteRouteTitle"), body: t("deleteRouteBody", { name: r ? localized(r.name, lang) : "", count }), ok: t("delete") };
      }
      case "deleteLog":
        return { title: t("deleteLog"), body: t("historyHint"), ok: t("delete") };
      case "import":
        return { title: t("importConfirmTitle"), body: t("importConfirmBody"), ok: t("importJson") };
      case "clearAll":
        return { title: t("clearAllTitle"), body: t("clearAllBody"), ok: t("delete") };
    }
  })();

  return (
    <div className="tq-app" data-size={prefs.fontSize} data-route={active.id} data-unit={prefs.unit}>
      <LocalOnlyBanner text={t("localOnly")} />

      <Masthead
        title={t("title")}
        tagline={t("tagline")}
        langLabel={t("langLabel")}
        lang={lang}
        onLangChange={(nextLang) => {
          rememberLang(nextLang);
          navigate({ search: (prev) => ({ ...prev, lang: nextLang }), replace: true });
        }}
      />

      <Card id="active-route" size="sm" className="tq-card-mist">
        <CardHeader className="grid-cols-[1fr_auto]">
          <div className="min-w-0">
            <p className="tq-group-label m-0">{t("activeRoute")}</p>
            <h2 className="tq-route-name" id="route-name">
              {localized(active.name, lang)}
            </h2>
            {active.region && <p className="tq-route-region">{localized(active.region, lang)}</p>}
          </div>
          {active.kind === "custom" && (
            <button type="button" className="tq-btn tq-btn-icon" id="edit-route" aria-label={t("editRoute")} onClick={() => setRouteDialog({ open: true, id: active.id })}>
              <Pencil className="size-4" aria-hidden />
            </button>
          )}
        </CardHeader>
        <CardContent className="grid gap-3">
          <TrailMap ratio={progress.ratio} milestoneRatios={milestoneRatios} unlockedCount={unlockedCount} label={`${t("progressLabel")} ${progress.percent}%`} />
          <div className="grid gap-1">
            <div className="tq-rail-row">
              <span>{t("progressLabel")}</span>
              <b id="progress-percent">{progress.percent}%</b>
            </div>
            <div className="tq-rail" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress.ratio * 100)} aria-label={t("progressLabel")}>
              <div className="tq-rail-fill" data-done={progress.done ? "true" : "false"} style={{ width: `${Math.max(progress.ratio > 0 ? 1.5 : 0, progress.ratio * 100)}%` }} />
            </div>
          </div>
          <div className="tq-figures">
            <div className="tq-figure tq-figure-accent">
              <span className="tq-figure-label">{t("walked")}</span>
              <span className="tq-figure-value" id="miles-done">
                {dist(progress.miles)}
              </span>
            </div>
            <div className="tq-figure">
              <span className="tq-figure-label">{t("totalDistanceLabel")}</span>
              <span className="tq-figure-value" id="miles-total">
                {dist(active.totalMiles, 0)}
              </span>
            </div>
            <div className="tq-figure tq-figure-moss">
              <span className="tq-figure-label">{t("remaining")}</span>
              <span className="tq-figure-value" id="miles-remaining">
                {dist(progress.remaining)}
              </span>
            </div>
          </div>
          {progress.done ? (
            <div className="tq-done" id="route-done">
              <p className="tq-done-title">{t("routeDone")}</p>
              <p className="tq-hint">{t("routeDoneBody")}</p>
            </div>
          ) : progress.next ? (
            <div className="tq-next" id="next-milestone">
              <span className="tq-next-label">{t("nextMilestone")}</span>
              <span className="min-w-0 truncate">
                <b>{localized(progress.next.milestone.name, lang)}</b> · {t("toGo", { dist: dist(Math.max(0, progress.next.milestone.milesFromStart - progress.miles)) })}
              </span>
            </div>
          ) : progress.milestones.length > 0 ? (
            <p className="tq-hint">{t("allUnlocked")}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card id="log-card" size="sm">
        <CardHeader className="grid-cols-[1fr_auto]">
          <CardTitle>{t("logTitle")}</CardTitle>
          <div className="tq-seg" role="group" aria-label={t("unitLabel")} id="unit-toggle">
            {UNITS.map((u) => (
              <button key={u} type="button" className="tq-seg-btn" id={`unit-${u}`} aria-pressed={prefs.unit === u} onClick={() => commitPrefs({ ...prefs, unit: u })}>
                {t(u === "km" ? "unitKm" : "unitMi")}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              addManual();
            }}
          >
            <div>
              <label className="tq-field-label" htmlFor="distance">
                {t("distanceLabel")}
              </label>
              <div className="tq-amount-wrap">
                <input
                  id="distance"
                  className="tq-input tq-amount"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  enterKeyHint="done"
                  placeholder={t("distancePlaceholder")}
                  aria-label={t("distanceLabel")}
                  value={distance}
                  onChange={(e) => {
                    setDistance(e.target.value);
                    if (formError) setFormError("");
                  }}
                />
                <span className="tq-amount-unit" aria-hidden>
                  {unitLabel}
                </span>
              </div>
            </div>
            <div className="tq-two">
              <div>
                <label className="tq-field-label" htmlFor="note">
                  {t("noteLabel")}
                </label>
                <input id="note" className="tq-input" type="text" autoComplete="off" maxLength={140} placeholder={t("notePlaceholder")} value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              <div>
                <label className="tq-field-label" htmlFor="date">
                  {t("dateLabel")}
                </label>
                <input id="date" className="tq-input" type="date" max={today} value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>
            {formError && (
              <p className="tq-error" role="alert" id="form-error">
                {formError}
              </p>
            )}
            <button type="submit" className="tq-btn tq-btn-primary" id="add-log">
              <Plus className="size-5" aria-hidden />
              {t("addLog")}
            </button>
          </form>
        </CardContent>
      </Card>

      <Card id="steps-card" size="sm">
        <CardHeader>
          <CardTitle>{t("stepsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <p className="tq-hint" id="steps-hint">
            {t("stepsHint")}
          </p>
          <div className="tq-two">
            <div>
              <label className="tq-field-label" htmlFor="steps">
                {t("stepsLabel")}
              </label>
              <input
                id="steps"
                className="tq-input"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder={t("stepsPlaceholder")}
                value={steps}
                onChange={(e) => {
                  setSteps(e.target.value);
                  if (stepsError) setStepsError("");
                }}
              />
            </div>
            <div>
              <label className="tq-field-label" htmlFor="steps-per-mile">
                {t("stepsPerMileLabel")}
              </label>
              <input
                id="steps-per-mile"
                className="tq-input"
                type="number"
                inputMode="numeric"
                min={500}
                max={5000}
                step={10}
                value={prefs.stepsPerMile}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isFinite(n) && n >= 500 && n <= 5000) commitPrefs({ ...prefs, stepsPerMile: Math.round(n) });
                }}
              />
            </div>
          </div>
          <p className="tq-hint">{t("stepsPerMileHint")}</p>
          {stepsMiles > 0 && (
            <p className="tq-result" id="steps-result">
              {t("stepsResult", { steps: numFmt.format(stepsN), dist: dist(stepsMiles, 2) })}
            </p>
          )}
          {stepsError && (
            <p className="tq-error" role="alert" id="steps-error">
              {stepsError}
            </p>
          )}
          <button type="button" className="tq-btn tq-btn-ochre" id="add-steps" disabled={stepsMiles <= 0} onClick={addFromSteps}>
            <Plus className="size-5" aria-hidden />
            {t("useSteps")}
          </button>
        </CardContent>
      </Card>

      <Card id="milestones" size="sm">
        <CardHeader>
          <CardTitle>{t("milestonesTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <MilestoneList items={progress.milestones} lang={lang} t={t} distance={(m) => dist(m, 0)} formatDate={fmtDate} />
        </CardContent>
      </Card>

      <Card id="routes" size="sm">
        <CardHeader className="grid-cols-[1fr_auto]">
          <CardTitle>{t("routesTitle")}</CardTitle>
          <button type="button" className="tq-btn tq-btn-quiet" id="add-route" onClick={() => setRouteDialog({ open: true, id: null })}>
            <Plus className="size-4" aria-hidden />
            {t("addRoute")}
          </button>
        </CardHeader>
        <CardContent className="grid gap-2">
          <p className="tq-hint">{t("routesHint")}</p>
          <p className="tq-group-label">{t("presetRoutes")}</p>
          <ul className="tq-route-list" id="preset-routes">
            {PRESET_ROUTES.map((r) => {
              const p = progressById.get(r.id)!;
              return (
                <li key={r.id}>
                  <button type="button" className="tq-route-btn" data-route={r.id} aria-pressed={r.id === active.id} onClick={() => pickRoute(r.id)}>
                    <RouteIcon custom={false} className="tq-route-icon" />
                    <span className="tq-route-main">
                      <span className="tq-route-title">{localized(r.name, lang)}</span>
                      <span className="tq-route-sub">
                        {dist(p.miles)} / {dist(r.totalMiles, 0)}
                      </span>
                    </span>
                    <span className="tq-route-pct" data-done={p.done ? "true" : "false"}>
                      {p.percent}%
                    </span>
                    <span className="tq-mini-rail" aria-hidden>
                      <span className="tq-mini-rail-fill block" data-done={p.done ? "true" : "false"} style={{ width: `${p.ratio * 100}%` }} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="tq-group-label">{t("customRoutes")}</p>
          {custom.length === 0 ? (
            <div className="tq-empty" id="custom-empty">
              <p className="tq-hint">{t("milestonesHint")}</p>
            </div>
          ) : (
            <ul className="tq-route-list" id="custom-routes">
              {custom.map((r) => {
                const p = progressById.get(r.id)!;
                return (
                  <li key={r.id}>
                    <button type="button" className="tq-route-btn" data-route={r.id} aria-pressed={r.id === active.id} onClick={() => pickRoute(r.id)}>
                      <RouteIcon custom className="tq-route-icon" />
                      <span className="tq-route-main">
                        <span className="tq-route-title">{localized(r.name, lang)}</span>
                        <span className="tq-route-sub">
                          {dist(p.miles)} / {dist(r.totalMiles, 0)}
                        </span>
                      </span>
                      <span className="tq-route-pct" data-done={p.done ? "true" : "false"}>
                        {p.percent}%
                      </span>
                      <span className="tq-mini-rail" aria-hidden>
                        <span className="tq-mini-rail-fill block" data-done={p.done ? "true" : "false"} style={{ width: `${p.ratio * 100}%` }} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card id="history" size="sm">
        <CardHeader>
          <CardTitle>{t("historyTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          <p className="tq-hint">{t("historyHint")}</p>
          {history.length === 0 ? (
            <p className="tq-hint" id="history-empty">
              {t("noHistory")}
            </p>
          ) : (
            <ul className="tq-log-list" id="log-list">
              {history.map((e) => {
                const ms = parseDate(e.date);
                return (
                  <li key={e.id}>
                    <button type="button" className="tq-log" data-log={e.id} aria-label={`${t("editLog")}: ${dist(e.miles)} ${e.date}`} onClick={() => setLogDialog({ open: true, id: e.id })}>
                      <span className="tq-log-date" aria-hidden>
                        <span className="tq-log-date-mon">{ms === null ? "" : monFmt.format(new Date(ms))}</span>
                        <span className="tq-log-date-num">{Number(e.date.slice(-2))}</span>
                      </span>
                      <span className="tq-log-main">
                        <span className="tq-log-note">{e.note || fmtDate(e.date)}</span>
                        <span className="tq-log-meta">{e.source === "steps" && e.steps ? t("fromSteps", { steps: numFmt.format(e.steps) }) : fmtDate(e.date)}</span>
                      </span>
                      <span className="tq-log-dist">{dist(e.miles)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card id="stats" size="sm">
        <CardHeader>
          <CardTitle>{t("statsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="tq-stats">
          <div className="tq-figure tq-figure-accent">
            <span className="tq-figure-label">{t("totalAllTime")}</span>
            <span className="tq-figure-value" id="stat-total">
              {dist(stats.totalMiles)}
            </span>
          </div>
          <div className="tq-figure">
            <span className="tq-figure-label">{t("activeDays")}</span>
            <span className="tq-figure-value" id="stat-active-days">
              {t("days", { n: stats.activeDays })}
            </span>
          </div>
          <div className="tq-figure tq-figure-moss">
            <span className="tq-figure-label">{t("currentStreak")}</span>
            <span className="tq-figure-value" id="stat-streak">
              {t("days", { n: stats.currentStreak })}
            </span>
          </div>
          <div className="tq-figure">
            <span className="tq-figure-label">{t("longestStreak")}</span>
            <span className="tq-figure-value" id="stat-longest">
              {t("days", { n: stats.longestStreak })}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card id="settings" size="sm">
        <CardHeader>
          <CardTitle>{t("settingsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="tq-setting-row">
            <span className="tq-field-label m-0" id="font-size-label">
              {t("fontSizeLabel")}
            </span>
            <div className="tq-seg" role="group" aria-labelledby="font-size-label" id="font-sizes">
              {FONT_SIZES.map((size) => (
                <button key={size} type="button" className="tq-seg-btn" id={`font-${size}`} aria-pressed={prefs.fontSize === size} onClick={() => commitPrefs({ ...prefs, fontSize: size })}>
                  {t(FONT_LABEL[size])}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <BackupCard t={t} hasData={hasData} onExportJson={exportJson} onImportFile={(f) => void importFile(f)} onClearAll={() => setConfirm({ kind: "clearAll" })} />

      <div className="flex flex-wrap gap-[0.3rem]" id="promise-chips">
        {CHIP_KEYS.map((key) => (
          <span key={key} className="tq-promise">
            {t(key)}
          </span>
        ))}
      </div>

      <p className="tq-hint" id="about-text">
        {t("about")}
      </p>

      <footer className="flex flex-wrap justify-center gap-3 px-0 pt-1 pb-2 text-[0.8em] text-ink-muted">
        <a id="link-privacy" href={`https://try-dabble.com/${lang}/privacy`}>
          {t("privacy")}
        </a>
        <a id="link-terms" href={`https://try-dabble.com/${lang}/terms`}>
          {t("terms")}
        </a>
        <a id="link-guide" href={`https://try-dabble.com/${lang}/guides/trailquest`}>
          {t("guide")}
        </a>
        <a id="link-hub" href={`https://try-dabble.com/${lang}`}>
          try-dabble.com
        </a>
      </footer>

      <Toast message={toastMsg} visible={toastOn} />

      <RouteDialog
        open={routeDialog.open}
        route={editingRoute}
        unit={prefs.unit}
        unitLabel={unitLabel}
        logCount={editingRoute ? logs.filter((l) => l.routeId === editingRoute.id).length : 0}
        t={t}
        onOpenChange={(open) => setRouteDialog((d) => ({ ...d, open }))}
        onSave={saveRoute}
        onDelete={() => {
          if (!routeDialog.id) return;
          setRouteDialog({ open: false, id: routeDialog.id });
          setConfirm({ kind: "deleteRoute", id: routeDialog.id });
        }}
      />

      <LogDialog
        open={logDialog.open}
        entry={editingLog}
        unit={prefs.unit}
        unitLabel={unitLabel}
        t={t}
        onOpenChange={(open) => setLogDialog((d) => ({ ...d, open }))}
        onSave={saveEntry}
        onDelete={() => {
          if (!logDialog.id) return;
          setLogDialog({ open: false, id: logDialog.id });
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
            case "deleteRoute":
              deleteRoute(confirm.id);
              break;
            case "deleteLog":
              deleteEntry(confirm.id);
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
    </div>
  );
}
