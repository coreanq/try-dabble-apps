import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { Toast } from "@/components/toast";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  allocate,
  annualAllocation,
  CATEGORIES,
  CATEGORY_COLOR,
  duplicatePlan,
  earningCurrency,
  earningsFor,
  INCOME_MODES,
  incomeSummary,
  makeEarning,
  makeEnvelope,
  makePlan,
  renamePlan,
  sortEnvelopes,
  type Allocation,
  type Earning,
  type Envelope,
  type EnvelopeCategory,
  type EnvelopeKind,
  type IncomeMode,
  type Plan,
  type View,
} from "@/lib/budget";
import { detectLang, HTML_LANG, isLang, OG_IMAGE, rememberLang, translate, type Lang, type MsgKey } from "@/lib/i18n";
import {
  clampAmount,
  clampPercent,
  CURRENCIES,
  currentMonthKey,
  currentYearKey,
  formatDate,
  formatMoney,
  formatMonth,
  formatMonthShort,
  formatPercent,
  isDateKey,
  normalizeCurrency,
  roundMoney,
  shiftMonthKey,
  shiftYearKey,
  toDateKey,
} from "@/lib/money";
import {
  backupFilename,
  buildBackup,
  clearAll,
  download,
  loadEarnings,
  loadEnvelopes,
  loadPlans,
  loadPrefs,
  parseBackup,
  saveEarnings,
  saveEnvelopes,
  savePlans,
  savePrefs,
  toJSON,
  type Backup,
  type Prefs,
} from "@/lib/store";
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

const CHIP_KEYS: MsgKey[] = ["chipNoCap", "chipNoPlus", "chipNoAccount", "chipAuto", "chipViews", "chipBackup", "chipNoAds", "chipFree", "chipLocal", "chipLangs"];
const TOAST_MS = 2200;

const MODE_KEY: Record<IncomeMode, MsgKey> = { biweekly: "modeBiweekly", monthly: "modeMonthly", irregular: "modeIrregular" };
const MODE_HINT_KEY: Record<IncomeMode, MsgKey> = { biweekly: "modeHintBiweekly", monthly: "modeHintMonthly", irregular: "modeHintIrregular" };
const LABEL_DEFAULT_KEY: Record<IncomeMode, MsgKey> = { biweekly: "labelDefaultBiweekly", monthly: "labelDefaultMonthly", irregular: "labelDefaultIrregular" };
const CAT_KEY: Record<EnvelopeCategory, MsgKey> = { savings: "catSavings", debt: "catDebt", bills: "catBills", sinking: "catSinking", flexible: "catFlexible" };

/** First open: one plan with a few percent envelopes so the pad is not blank. Percent only, so nothing is over-allocated before the first earning. */
function starterEnvelopes(planId: string, lang: Lang): Envelope[] {
  const t = (k: MsgKey) => translate(lang, k);
  return [
    makeEnvelope(planId, t("starterSavings"), "percent", 20, "savings", 0),
    makeEnvelope(planId, t("starterBills"), "percent", 40, "bills", 1),
    makeEnvelope(planId, t("starterDebt"), "percent", 10, "debt", 2),
    makeEnvelope(planId, t("starterSinking"), "percent", 15, "sinking", 3),
    makeEnvelope(planId, t("starterFun"), "percent", 10, "flexible", 4),
  ];
}

function defaultCurrencyFor(lang: Lang): string {
  return lang === "ko" ? "KRW" : lang === "ja" ? "JPY" : lang === "zh" ? "CNY" : "USD";
}

interface Boot {
  plans: Plan[];
  earnings: Earning[];
  envelopes: Envelope[];
  prefs: Prefs;
}

function boot(lang: Lang): Boot {
  const plans = loadPlans();
  const earnings = loadEarnings();
  const envelopes = loadEnvelopes();
  const prefs = loadPrefs();
  if (plans.length > 0) return { plans, earnings, envelopes, prefs };
  const plan = makePlan(translate(lang, "planDefaultName"), defaultCurrencyFor(lang), "irregular");
  return { plans: [plan], earnings, envelopes: [...envelopes, ...starterEnvelopes(plan.id, lang)], prefs: { ...prefs, activePlanId: plan.id } };
}

interface EarningDraft {
  id?: string;
  amount: string;
  date: string;
  label: string;
  currency: string;
}

interface EnvelopeDraft {
  id?: string;
  name: string;
  kind: EnvelopeKind;
  value: string;
  category: EnvelopeCategory;
}

interface PlanDraft {
  mode: "new" | "rename";
  name: string;
}

type Confirm = { kind: "import"; parsed: Backup } | { kind: "clearAll" } | { kind: "deletePlan" } | { kind: "deleteEarning"; id: string } | { kind: "deleteEnvelope"; id: string };

function Home() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  const lang = useMemo(() => detectLang(search.lang ?? null), [search.lang]);
  const t = useCallback((key: MsgKey, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);

  const [initial] = useState<Boot>(() => boot(detectLang(search.lang ?? null)));
  const [plans, setPlans] = useState<Plan[]>(initial.plans);
  const [earnings, setEarnings] = useState<Earning[]>(initial.earnings);
  const [envelopes, setEnvelopes] = useState<Envelope[]>(initial.envelopes);
  const [prefs, setPrefs] = useState<Prefs>(initial.prefs);
  const [month, setMonth] = useState(() => currentMonthKey());
  const [year, setYear] = useState(() => currentYearKey());
  const [earningDraft, setEarningDraft] = useState<EarningDraft | null>(null);
  const [envelopeDraft, setEnvelopeDraft] = useState<EnvelopeDraft | null>(null);
  const [planDraft, setPlanDraft] = useState<PlanDraft | null>(null);
  const [draftError, setDraftError] = useState<MsgKey | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const toastTimer = useRef<number | undefined>(undefined);
  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastOn(true);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastOn(false), TOAST_MS);
  }, []);
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  useEffect(() => {
    if (search.lang !== lang) navigate({ search: (prev) => ({ ...prev, lang }), replace: true });
  }, [lang, search.lang, navigate]);

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[lang];
    document.title = t("title");
    setMetaContent('meta[name="description"]', t("metaDescription"));
    setMetaContent('meta[property="og:image"], meta[name="twitter:image"]', OG_IMAGE[lang]);
    document.querySelector('link[rel="manifest"]')?.setAttribute("href", `/manifest.webmanifest?lang=${lang}`);
    rememberLang(lang);
  }, [lang, t]);

  useEffect(() => savePlans(plans), [plans]);
  useEffect(() => saveEarnings(earnings), [earnings]);
  useEffect(() => saveEnvelopes(envelopes), [envelopes]);
  useEffect(() => savePrefs(prefs), [prefs]);

  const onLangChange = (next: Lang) => {
    rememberLang(next);
    navigate({ search: (prev) => ({ ...prev, lang: next }) });
  };

  const view: View = prefs.view;
  const plan = useMemo(() => plans.find((p) => p.id === prefs.activePlanId) ?? plans[0], [plans, prefs.activePlanId]);

  // Never leave the pad without a plan: deleting the last one creates a blank one.
  useEffect(() => {
    if (plans.length === 0) {
      const fresh = makePlan(t("planDefaultName"), defaultCurrencyFor(lang), "irregular");
      setPlans([fresh]);
      setPrefs((p) => ({ ...p, activePlanId: fresh.id }));
    } else if (!plans.some((p) => p.id === prefs.activePlanId)) {
      setPrefs((p) => ({ ...p, activePlanId: plans[0].id }));
    }
  }, [plans, prefs.activePlanId, lang, t]);

  const planEnvelopes = useMemo(() => (plan ? sortEnvelopes(envelopes.filter((e) => e.planId === plan.id)) : []), [envelopes, plan]);
  const periodEarnings = useMemo(
    () => (plan ? earningsFor(earnings, plan.id, view === "monthly" ? { kind: "month", key: month } : { kind: "year", key: year }) : []),
    [earnings, plan, view, month, year],
  );
  const summary = useMemo(() => incomeSummary(periodEarnings, plan?.currency ?? "USD"), [periodEarnings, plan]);
  const alloc: Allocation & { months?: ReturnType<typeof annualAllocation>["months"] } = useMemo(() => {
    if (!plan) return allocate([], 0);
    return view === "monthly" ? allocate(planEnvelopes, summary.total) : annualAllocation(earnings, planEnvelopes, plan, year);
  }, [plan, planEnvelopes, summary.total, view, earnings, year]);
  const otherCurrencies = summary.byCurrency.filter((r) => r.currency !== normalizeCurrency(plan?.currency));
  const activeMonths = alloc.months ? alloc.months.filter((m) => m.count > 0).length : 0;

  const money = (n: number, cur = plan?.currency ?? "USD") => formatMoney(roundMoney(n, cur), cur, lang);
  const periodLabel = view === "monthly" ? formatMonth(month, lang) : year;

  const patchPrefs = (partial: Partial<Prefs>) => setPrefs((p) => ({ ...p, ...partial }));
  const patchPlan = (partial: Partial<Plan>) => {
    if (!plan) return;
    const now = new Date().toISOString();
    setPlans((list) => list.map((p) => (p.id === plan.id ? { ...p, ...partial, updatedAt: now } : p)));
  };

  const shiftPeriod = (n: number) => {
    if (view === "monthly") setMonth((m) => shiftMonthKey(m, n));
    else setYear((y) => shiftYearKey(y, n));
  };
  const jumpToday = () => {
    setMonth(currentMonthKey());
    setYear(currentYearKey());
  };

  /* ---------- plans ---------- */

  const savePlanDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planDraft) return;
    const name = planDraft.name.trim();
    if (!name) return setDraftError("needPlanName");
    if (planDraft.mode === "new") {
      const fresh = makePlan(name, plan?.currency ?? defaultCurrencyFor(lang), plan?.incomeMode ?? "irregular");
      setPlans((list) => [...list, fresh]);
      patchPrefs({ activePlanId: fresh.id });
      showToast(t("planCreated"));
    } else if (plan) {
      setPlans((list) => list.map((p) => (p.id === plan.id ? renamePlan(p, name) : p)));
      showToast(t("planRenamed"));
    }
    setPlanDraft(null);
    setDraftError(null);
  };

  const onDuplicate = () => {
    if (!plan) return;
    const copy = duplicatePlan(plan, envelopes, t("planCopySuffix"));
    setPlans((list) => [...list, copy.plan]);
    setEnvelopes((list) => [...list, ...copy.envelopes]);
    patchPrefs({ activePlanId: copy.plan.id });
    showToast(t("planDuplicated"));
  };

  const doDeletePlan = () => {
    if (!plan) return;
    const id = plan.id;
    setEarnings((list) => list.filter((e) => e.planId !== id));
    setEnvelopes((list) => list.filter((e) => e.planId !== id));
    setPlans((list) => list.filter((p) => p.id !== id));
    showToast(t("planDeleted"));
  };

  /* ---------- earnings ---------- */

  const openEarning = (existing?: Earning) => {
    if (!plan) return;
    setDraftError(null);
    if (existing) {
      setEarningDraft({ id: existing.id, amount: String(existing.amount), date: existing.date, label: existing.label ?? "", currency: earningCurrency(existing, plan.currency) });
    } else {
      const today = toDateKey(new Date());
      const inMonth = view === "monthly" && !today.startsWith(month) ? `${month}-01` : today;
      setEarningDraft({ amount: "", date: inMonth, label: "", currency: plan.currency });
    }
  };

  const saveEarningDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!earningDraft || !plan) return;
    const amount = clampAmount(earningDraft.amount, -1);
    if (amount <= 0) return setDraftError("needAmount");
    if (!isDateKey(earningDraft.date)) return setDraftError("needDate");
    const cur = normalizeCurrency(earningDraft.currency, plan.currency);
    const currency = cur === normalizeCurrency(plan.currency) ? undefined : cur;
    if (earningDraft.id) {
      const id = earningDraft.id;
      setEarnings((list) =>
        list.map((row) => {
          if (row.id !== id) return row;
          const next: Earning = { ...row, amount, date: earningDraft.date };
          const label = earningDraft.label.trim().slice(0, 120);
          if (label) next.label = label;
          else delete next.label;
          if (currency) next.currency = currency;
          else delete next.currency;
          return next;
        }),
      );
      showToast(t("earningSaved"));
    } else {
      setEarnings((list) => [...list, makeEarning(plan.id, amount, earningDraft.date, earningDraft.label, currency)]);
      showToast(t("earningAdded"));
    }
    setEarningDraft(null);
    setDraftError(null);
  };

  /* ---------- envelopes ---------- */

  const openEnvelope = (existing?: Envelope) => {
    setDraftError(null);
    if (existing) setEnvelopeDraft({ id: existing.id, name: existing.name, kind: existing.kind, value: String(existing.value), category: existing.category });
    else setEnvelopeDraft({ name: "", kind: "percent", value: "", category: "flexible" });
  };

  const saveEnvelopeDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!envelopeDraft || !plan) return;
    const name = envelopeDraft.name.trim();
    if (!name) return setDraftError("needName");
    const value = envelopeDraft.kind === "percent" ? clampPercent(envelopeDraft.value, -1) : clampAmount(envelopeDraft.value, -1);
    if (value < 0) return setDraftError("needValue");
    if (envelopeDraft.id) {
      const id = envelopeDraft.id;
      setEnvelopes((list) => list.map((row) => (row.id === id ? { ...row, name: name.slice(0, 80), kind: envelopeDraft.kind, value, category: envelopeDraft.category } : row)));
    } else {
      const order = planEnvelopes.length > 0 ? Math.max(...planEnvelopes.map((x) => x.sortOrder ?? 0)) + 1 : 0;
      setEnvelopes((list) => [...list, makeEnvelope(plan.id, name, envelopeDraft.kind, value, envelopeDraft.category, order)]);
    }
    showToast(t("envelopeSaved"));
    setEnvelopeDraft(null);
    setDraftError(null);
  };

  const moveEnvelope = (id: string, dir: -1 | 1) => {
    const ordered = planEnvelopes.map((e) => e.id);
    const i = ordered.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ordered.length) return;
    [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
    const pos = new Map(ordered.map((eid, idx) => [eid, idx]));
    setEnvelopes((list) => list.map((e) => (pos.has(e.id) ? { ...e, sortOrder: pos.get(e.id) } : e)));
  };

  /* ---------- backup ---------- */

  const onExport = () => {
    download(backupFilename(), toJSON(buildBackup(plans, earnings, envelopes, prefs)));
    showToast(t("exported"));
  };

  const onImportFile = async (file: File) => {
    try {
      const parsed = parseBackup(JSON.parse(await file.text()), t("planDefaultName"));
      if (!parsed) return showToast(t("importBad"));
      setConfirm({ kind: "import", parsed });
    } catch {
      showToast(t("importBad"));
    }
  };

  const applyImport = (b: Backup) => {
    setPlans(b.plans);
    setEarnings(b.earnings);
    setEnvelopes(b.envelopes);
    setPrefs({ ...b.prefs, activePlanId: b.prefs.activePlanId ?? b.plans[0]?.id });
    showToast(t("importOk", { n: b.plans.length, e: b.envelopes.length, i: b.earnings.length }));
  };

  const doClear = () => {
    clearAll();
    setEarnings([]);
    setEnvelopes([]);
    setPlans([]);
    showToast(t("cleared"));
  };

  const confirmTitle = confirm?.kind === "import" ? t("importConfirmTitle") : confirm?.kind === "deletePlan" ? t("deletePlanTitle") : confirm?.kind === "deleteEarning" ? t("deleteEarningTitle") : confirm?.kind === "deleteEnvelope" ? t("deleteEnvelopeTitle") : t("clearAllTitle");
  const confirmBody = confirm?.kind === "import" ? t("importConfirmBody") : confirm?.kind === "deletePlan" ? t("deletePlanBody") : confirm?.kind === "deleteEarning" ? t("deleteEarningBody") : confirm?.kind === "deleteEnvelope" ? t("deleteEnvelopeBody") : t("clearAllBody");
  const confirmLabel = confirm?.kind === "import" ? t("importJson") : confirm?.kind === "clearAll" ? t("clearAll") : t("delete");

  const allocShare = alloc.income > 0 ? Math.min(alloc.allocated / alloc.income, 1) : alloc.allocated > 0 ? 1 : 0;

  return (
    <div className="pp-app">
      <LocalOnlyBanner text={t("localOnly")} />
      <Masthead t={t} lang={lang} onLangChange={onLangChange} />

      {/* plan switcher */}
      <section className="pp-card" id="plan-card">
        <div className="pp-card-head">
          <h2>{t("planLabel")}</h2>
          <button type="button" className="pp-btn pp-btn-sm pp-btn-primary" id="btn-plan-new" onClick={() => { setDraftError(null); setPlanDraft({ mode: "new", name: "" }); }}>
            + {t("planNew")}
          </button>
        </div>
        <label className="pp-field">
          <span className="sr-only">{t("planLabel")}</span>
          <select id="plan-select" className="pp-select-block" value={plan?.id ?? ""} onChange={(e) => patchPrefs({ activePlanId: e.target.value })}>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
        <div className="pp-row wrap" id="plan-actions">
          <button type="button" className="pp-btn pp-btn-sm" id="btn-plan-rename" onClick={() => { setDraftError(null); setPlanDraft({ mode: "rename", name: plan?.name ?? "" }); }}>{t("planRename")}</button>
          <button type="button" className="pp-btn pp-btn-sm" id="btn-plan-duplicate" onClick={onDuplicate}>{t("planDuplicate")}</button>
          <button type="button" className="pp-btn pp-btn-sm pp-btn-danger" id="btn-plan-delete" onClick={() => setConfirm({ kind: "deletePlan" })}>{t("planDelete")}</button>
        </div>
        <div className="pp-grid">
          <label className="pp-field">
            {t("incomeMode")}
            <select id="plan-mode" className="pp-select-block" value={plan?.incomeMode ?? "irregular"} onChange={(e) => patchPlan({ incomeMode: e.target.value as IncomeMode })}>
              {INCOME_MODES.map((m) => (
                <option key={m} value={m}>{t(MODE_KEY[m])}</option>
              ))}
            </select>
          </label>
          <label className="pp-field">
            {t("currencyLabel")}
            <select id="plan-currency" className="pp-select-block" value={plan?.currency ?? "USD"} onChange={(e) => patchPlan({ currency: e.target.value })}>
              {[...new Set([...CURRENCIES, plan?.currency ?? "USD"])].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="pp-hint" id="mode-hint">{t(MODE_HINT_KEY[plan?.incomeMode ?? "irregular"])}</p>
      </section>

      {/* view + period */}
      <div className="pp-tabs" id="view-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={view === "monthly"} className={"pp-tab" + (view === "monthly" ? " is-on" : "")} id="view-monthly" onClick={() => patchPrefs({ view: "monthly" })}>{t("viewMonthly")}</button>
        <button type="button" role="tab" aria-selected={view === "annual"} className={"pp-tab" + (view === "annual" ? " is-on" : "")} id="view-annual" onClick={() => patchPrefs({ view: "annual" })}>{t("viewAnnual")}</button>
      </div>
      <div className="pp-period" id="period-nav">
        <button type="button" className="pp-btn pp-btn-sm pp-btn-quiet" id="period-prev" aria-label={t("prevPeriod")} onClick={() => shiftPeriod(-1)}>‹</button>
        <p className="pp-period-label" id="period-label">{periodLabel}</p>
        <button type="button" className="pp-btn pp-btn-sm pp-btn-quiet" id="period-next" aria-label={t("nextPeriod")} onClick={() => shiftPeriod(1)}>›</button>
        <button type="button" className="pp-btn pp-btn-sm pp-btn-quiet" id="period-today" onClick={jumpToday}>{t("jumpToday")}</button>
      </div>

      {/* totals + chart */}
      <section className="pp-card" id="totals">
        <div className="pp-card-head">
          <h2>{t("totalsTitle")}</h2>
          <span className="pp-hint">{plan?.currency}</span>
        </div>
        <div className="pp-stats">
          <div className="pp-stat is-gold">
            <p className="pp-stat-label">{t("totalIncome")}</p>
            <p className="pp-stat-value is-gold" id="total-income">{money(alloc.income)}</p>
          </div>
          <div className="pp-stat">
            <p className="pp-stat-label">{t("totalAllocated")}</p>
            <p className="pp-stat-value is-mint" id="total-allocated">{money(alloc.allocated)}</p>
          </div>
          <div className={"pp-stat" + (alloc.over ? " is-coral" : "")}>
            <p className="pp-stat-label">{alloc.over ? t("totalOverflow") : t("totalBuffer")}</p>
            <p className={"pp-stat-value " + (alloc.over ? "is-coral" : "is-gold")} id="total-buffer">{money(Math.abs(alloc.buffer))}</p>
          </div>
        </div>
        {alloc.over && <p className="pp-warn" id="over-warn" role="alert">{t("overWarn", { amt: money(-alloc.buffer) })}</p>}
        {alloc.income === 0 && !alloc.over && <p className="pp-hint" id="no-income-note">{t("noIncomeYet")}</p>}
        <div>
          <p className="pp-hint" style={{ marginBottom: "0.3rem" }}>{t("chartTitle")}</p>
          <div className="pp-bar" id="chart-bar" role="img" aria-label={`${t("chartAllocated")} ${money(alloc.allocated)} · ${t("chartBuffer")} ${money(Math.max(alloc.buffer, 0))}`}>
            <div className={"pp-bar-seg " + (alloc.over ? "is-over" : "is-alloc")} style={{ width: `${allocShare * 100}%` }} />
            {!alloc.over && <div className="pp-bar-seg is-buffer" style={{ width: `${(1 - allocShare) * 100}%` }} />}
          </div>
          <div className="pp-legend">
            <span><i style={{ background: alloc.over ? "#e11d48" : "#0f766e" }} />{t("chartAllocated")} {alloc.income > 0 ? formatPercent(Math.round((alloc.allocated / alloc.income) * 1000) / 10, lang) : "—"}</span>
            <span><i style={{ background: "#ca8a04" }} />{t("chartBuffer")} {alloc.income > 0 && !alloc.over ? formatPercent(Math.round((alloc.buffer / alloc.income) * 1000) / 10, lang) : "—"}</span>
          </div>
        </div>
        {alloc.byCategory.length > 0 && (
          <div>
            <p className="pp-hint" style={{ marginBottom: "0.3rem" }}>{t("byCategory")}</p>
            <ul className="pp-cats" id="chart-categories">
              {alloc.byCategory.map((c) => (
                <li key={c.category} className="pp-cat-row" data-category={c.category}>
                  <span><span className="pp-cat" style={{ background: CATEGORY_COLOR[c.category] }}>{t(CAT_KEY[c.category])}</span></span>
                  <div className="pp-cat-track"><div className="pp-cat-fill" style={{ width: `${Math.min(c.share, 1) * 100}%`, background: CATEGORY_COLOR[c.category] }} /></div>
                  <b>{money(c.amount)}</b>
                </li>
              ))}
            </ul>
          </div>
        )}
        {otherCurrencies.length > 0 && (
          <div id="other-currencies">
            {otherCurrencies.map((r) => (
              <p key={r.currency} className="pp-hint"><b>{r.currency}</b> {formatMoney(roundMoney(r.total, r.currency), r.currency, lang)} · {t("earningsCount", { n: r.count })}</p>
            ))}
            <p className="pp-hint">{t("otherCurrencyNote")}</p>
          </div>
        )}
        {view === "annual" && (
          <div>
            <p className="pp-hint" style={{ marginBottom: "0.3rem" }}>{t("annualMonths")} · {t("activeMonths", { n: activeMonths })}</p>
            <ul className="pp-months" id="annual-months">
              {(alloc.months ?? []).map((m) => {
                const share = m.income > 0 ? Math.min(m.allocated / m.income, 1) : 0;
                return (
                  <li key={m.month} className={"pp-month-row" + (m.count === 0 ? " is-empty" : "")} data-month={m.month}>
                    <span>{formatMonthShort(m.month, lang)}</span>
                    <div className="pp-month-track">
                      <div style={{ width: `${share * 100}%`, background: m.buffer < 0 ? "#e11d48" : "#0f766e" }} />
                      {m.income > 0 && m.buffer >= 0 && <div style={{ width: `${(1 - share) * 100}%`, background: "#ca8a04" }} />}
                    </div>
                    <b className="is-gold">{money(m.income)}</b>
                    <b className={m.buffer < 0 ? "is-coral" : ""}>{money(m.buffer)}</b>
                  </li>
                );
              })}
            </ul>
            <p className="pp-hint">{t("annualHint")}</p>
          </div>
        )}
      </section>

      {/* earnings */}
      <section className="pp-card" id="earnings-card">
        <div className="pp-card-head">
          <h2>{t("earningsTitle")} <span className="pp-hint">{t("earningsCount", { n: periodEarnings.length })}</span></h2>
          <button type="button" className="pp-btn pp-btn-sm pp-btn-gold" id="btn-earning-add" onClick={() => openEarning()}>+ {t("addEarning")}</button>
        </div>
        {periodEarnings.length === 0 ? (
          <div className="pp-empty" id="earnings-empty"><p>{view === "monthly" ? t("earningsEmpty") : t("earningsEmptyAnnual")}</p></div>
        ) : (
          <ul className="pp-list" id="earnings-list">
            {periodEarnings.map((e) => {
              const cur = earningCurrency(e, plan?.currency ?? "USD");
              const other = cur !== normalizeCurrency(plan?.currency);
              return (
                <li key={e.id} className={"pp-earning" + (other ? " is-other" : "")} data-earning={e.id}>
                  <div className="pp-earning-main">
                    <b>{e.label || t(LABEL_DEFAULT_KEY[plan?.incomeMode ?? "irregular"])}</b>
                    <span>{formatDate(e.date, lang)}{other ? ` · ${cur}` : ""}</span>
                  </div>
                  <p className="pp-amount">{formatMoney(roundMoney(e.amount, cur), cur, lang)}</p>
                  <div className="pp-earning-actions">
                    <button type="button" className="pp-btn pp-btn-sm pp-btn-quiet" data-action="edit-earning" onClick={() => openEarning(e)}>{t("edit")}</button>
                    <button type="button" className="pp-btn pp-btn-sm pp-btn-danger" data-action="delete-earning" onClick={() => setConfirm({ kind: "deleteEarning", id: e.id })}>{t("delete")}</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* envelopes */}
      <section className="pp-card" id="envelopes-card">
        <div className="pp-card-head">
          <h2>{t("envelopesTitle")} <span className="pp-hint">{planEnvelopes.length}</span></h2>
          <button type="button" className="pp-btn pp-btn-sm pp-btn-primary" id="btn-envelope-add" onClick={() => openEnvelope()}>+ {t("addEnvelope")}</button>
        </div>
        <p className="pp-hint" id="unlimited-hint">{t("unlimitedHint")} {alloc.percentSum > 0 ? `· ${t("percentSum", { p: formatPercent(alloc.percentSum, lang) })}` : ""}</p>
        {planEnvelopes.length === 0 ? (
          <div className="pp-empty" id="envelopes-empty"><p>{t("envelopesEmpty")}</p></div>
        ) : (
          <ul className="pp-list" id="envelope-list">
            {alloc.rows.map((r, i) => (
              <li key={r.envelope.id} className="pp-envelope" data-envelope={r.envelope.id} data-kind={r.envelope.kind}>
                <div className="pp-env-main">
                  <p className="pp-env-name">{r.envelope.name}</p>
                  <p className="pp-env-meta">
                    <span className="pp-cat" style={{ background: CATEGORY_COLOR[r.envelope.category] }}>{t(CAT_KEY[r.envelope.category])}</span>
                    <span>{r.envelope.kind === "percent" ? t("ofIncome", { p: formatPercent(r.envelope.value, lang) }) : `${money(r.envelope.value)} · ${t("perMonthFixed")}`}</span>
                  </p>
                </div>
                <p className="pp-env-amount" data-resolved>{money(r.amount)}</p>
                <div className="pp-env-bar" aria-hidden="true"><i style={{ width: `${Math.min(r.share, 1) * 100}%` }} /></div>
                <div className="pp-env-actions">
                  <button type="button" className="pp-btn pp-btn-sm pp-btn-quiet" data-action="edit-envelope" onClick={() => openEnvelope(r.envelope)}>{t("edit")}</button>
                  <button type="button" className="pp-btn pp-btn-sm pp-btn-quiet" data-action="move-up" aria-label={t("moveUp")} disabled={i === 0} onClick={() => moveEnvelope(r.envelope.id, -1)}>↑</button>
                  <button type="button" className="pp-btn pp-btn-sm pp-btn-quiet" data-action="move-down" aria-label={t("moveDown")} disabled={i === alloc.rows.length - 1} onClick={() => moveEnvelope(r.envelope.id, 1)}>↓</button>
                  <button type="button" className="pp-btn pp-btn-sm pp-btn-danger" data-action="delete-envelope" onClick={() => setConfirm({ kind: "deleteEnvelope", id: r.envelope.id })}>{t("delete")}</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* backup */}
      <section className="pp-card" id="backup-card">
        <h2>{t("backupTitle")}</h2>
        <p className="pp-hint">{t("backupHint")}</p>
        <div className="pp-row wrap">
          <button type="button" className="pp-btn pp-btn-primary" id="btn-export" onClick={onExport}>{t("exportJson")}</button>
          <button type="button" className="pp-btn pp-btn-quiet" id="btn-import" onClick={() => fileRef.current?.click()}>{t("importJson")}</button>
          <input
            ref={fileRef}
            id="import-file"
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void onImportFile(f);
            }}
          />
        </div>
        <div className="pp-actions">
          <button type="button" className="pp-btn pp-btn-danger" id="btn-clear" onClick={() => setConfirm({ kind: "clearAll" })}>{t("clearAll")}</button>
        </div>
      </section>

      <section className="pp-card" id="promises" aria-label={t("promiseTitle")}>
        <div className="pp-promises">
          {CHIP_KEYS.map((k) => (
            <span key={k} className="pp-promise">{t(k)}</span>
          ))}
        </div>
      </section>

      <footer className="pp-footer">
        <a id="link-privacy" href={`https://try-dabble.com/${lang}/privacy`}>
          {t("privacy")}
        </a>
        <a id="link-terms" href={`https://try-dabble.com/${lang}/terms`}>
          {t("terms")}
        </a>
        <a id="link-guide" href={`https://try-dabble.com/${lang}/guides/paypad`} target="_blank" rel="noreferrer">
          {t("guide")}
        </a>
        <a id="link-hub" href={`https://try-dabble.com/${lang}`}>
          try-dabble.com
        </a>
      </footer>

      {/* plan name dialog */}
      <Dialog open={planDraft !== null} onOpenChange={(open) => { if (!open) setPlanDraft(null); }}>
        <DialogContent id="plan-dialog" showCloseButton={false}>
          <DialogTitle className="pp-sheet-title">{planDraft?.mode === "rename" ? t("planRenameTitle") : t("planNewTitle")}</DialogTitle>
          <DialogDescription className="sr-only">{t("planLabel")}</DialogDescription>
          {planDraft && (
            <form onSubmit={savePlanDraft} className="grid gap-3">
              <label className="pp-field">
                {t("fieldName")}
                <input id="f-plan-name" className="pp-input" value={planDraft.name} onChange={(e) => setPlanDraft({ ...planDraft, name: e.target.value })} placeholder={t("planNamePlaceholder")} maxLength={80} />
              </label>
              {draftError && <p className="pp-error" id="draft-error">{t(draftError)}</p>}
              <div className="pp-actions">
                <button type="button" className="pp-btn pp-btn-quiet" id="btn-plan-cancel" onClick={() => setPlanDraft(null)}>{t("cancel")}</button>
                <button type="submit" className="pp-btn pp-btn-primary" id="btn-plan-save">{t("save")}</button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* earning dialog */}
      <Dialog open={earningDraft !== null} onOpenChange={(open) => { if (!open) setEarningDraft(null); }}>
        <DialogContent id="earning-dialog" showCloseButton={false}>
          <DialogTitle className="pp-sheet-title">{earningDraft?.id ? t("editEarning") : t("addEarning")}</DialogTitle>
          <DialogDescription className="sr-only">{t("earningsTitle")}</DialogDescription>
          {earningDraft && (
            <form onSubmit={saveEarningDraft} className="grid gap-3">
              <div className="pp-grid">
                <label className="pp-field">
                  {t("fieldAmount")}
                  <input id="f-amount" className="pp-input" type="number" inputMode="decimal" step="any" min="0" value={earningDraft.amount} onChange={(e) => setEarningDraft({ ...earningDraft, amount: e.target.value })} />
                </label>
                <label className="pp-field">
                  {t("fieldCurrency")}
                  <select id="f-currency" className="pp-select-block" value={earningDraft.currency} onChange={(e) => setEarningDraft({ ...earningDraft, currency: e.target.value })}>
                    {[...new Set([plan?.currency ?? "USD", ...CURRENCIES])].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="pp-field">
                {t("fieldDate")}
                <input id="f-date" className="pp-input" type="date" value={earningDraft.date} onChange={(e) => setEarningDraft({ ...earningDraft, date: e.target.value })} />
              </label>
              <label className="pp-field">
                {t("fieldLabel")}
                <input id="f-label" className="pp-input" value={earningDraft.label} onChange={(e) => setEarningDraft({ ...earningDraft, label: e.target.value })} placeholder={t("labelPlaceholder")} maxLength={120} />
              </label>
              {draftError && <p className="pp-error" id="draft-error">{t(draftError)}</p>}
              <div className="pp-actions">
                <button type="button" className="pp-btn pp-btn-quiet" id="btn-earning-cancel" onClick={() => setEarningDraft(null)}>{t("cancel")}</button>
                <button type="submit" className="pp-btn pp-btn-gold" id="btn-earning-save">{t("save")}</button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* envelope dialog */}
      <Dialog open={envelopeDraft !== null} onOpenChange={(open) => { if (!open) setEnvelopeDraft(null); }}>
        <DialogContent id="envelope-dialog" showCloseButton={false}>
          <DialogTitle className="pp-sheet-title">{envelopeDraft?.id ? t("editEnvelope") : t("addEnvelope")}</DialogTitle>
          <DialogDescription className="pp-hint">{t("unlimitedHint")}</DialogDescription>
          {envelopeDraft && (
            <form onSubmit={saveEnvelopeDraft} className="grid gap-3">
              <label className="pp-field">
                {t("fieldName")}
                <input id="f-env-name" className="pp-input" value={envelopeDraft.name} onChange={(e) => setEnvelopeDraft({ ...envelopeDraft, name: e.target.value })} placeholder={t("envelopeNamePlaceholder")} maxLength={80} />
              </label>
              <div className="pp-field">
                {t("fieldKind")}
                <div className="pp-kind-toggle" role="radiogroup" aria-label={t("fieldKind")}>
                  <button type="button" role="radio" aria-checked={envelopeDraft.kind === "percent"} className={"pp-tab" + (envelopeDraft.kind === "percent" ? " is-on" : "")} id="f-kind-percent" onClick={() => setEnvelopeDraft({ ...envelopeDraft, kind: "percent" })}>{t("kindPercent")}</button>
                  <button type="button" role="radio" aria-checked={envelopeDraft.kind === "fixed"} className={"pp-tab" + (envelopeDraft.kind === "fixed" ? " is-on" : "")} id="f-kind-fixed" onClick={() => setEnvelopeDraft({ ...envelopeDraft, kind: "fixed" })}>{t("kindFixed")}</button>
                </div>
              </div>
              <div className="pp-grid">
                <label className="pp-field">
                  {envelopeDraft.kind === "percent" ? t("fieldPercent") : `${t("fieldFixed")} (${plan?.currency})`}
                  <input id="f-env-value" className="pp-input" type="number" inputMode="decimal" step="any" min="0" max={envelopeDraft.kind === "percent" ? 100 : undefined} value={envelopeDraft.value} onChange={(e) => setEnvelopeDraft({ ...envelopeDraft, value: e.target.value })} />
                </label>
                <label className="pp-field">
                  {t("fieldCategory")}
                  <select id="f-env-category" className="pp-select-block" value={envelopeDraft.category} onChange={(e) => setEnvelopeDraft({ ...envelopeDraft, category: e.target.value as EnvelopeCategory })}>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{t(CAT_KEY[c])}</option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="pp-hint">
                {envelopeDraft.kind === "percent"
                  ? `${t("ofIncome", { p: formatPercent(clampPercent(envelopeDraft.value), lang) })} = ${money((summary.total * clampPercent(envelopeDraft.value)) / 100)}`
                  : `${money(clampAmount(envelopeDraft.value))} · ${t("perMonthFixed")}`}
              </p>
              {draftError && <p className="pp-error" id="draft-error">{t(draftError)}</p>}
              <div className="pp-actions">
                <button type="button" className="pp-btn pp-btn-quiet" id="btn-envelope-cancel" onClick={() => setEnvelopeDraft(null)}>{t("cancel")}</button>
                <button type="submit" className="pp-btn pp-btn-primary" id="btn-envelope-save">{t("save")}</button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirm !== null}
        title={confirmTitle}
        body={confirmBody}
        confirmLabel={confirmLabel}
        cancelLabel={t("cancel")}
        destructive={confirm?.kind !== "import"}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
        onConfirm={() => {
          if (!confirm) return;
          if (confirm.kind === "import") applyImport(confirm.parsed);
          else if (confirm.kind === "deletePlan") doDeletePlan();
          else if (confirm.kind === "deleteEarning") {
            const id = confirm.id;
            setEarnings((list) => list.filter((x) => x.id !== id));
            showToast(t("earningDeleted"));
          } else if (confirm.kind === "deleteEnvelope") {
            const id = confirm.id;
            setEnvelopes((list) => list.filter((x) => x.id !== id));
            showToast(t("envelopeDeleted"));
          } else doClear();
        }}
      />

      <Toast message={toastMsg} visible={toastOn} />
    </div>
  );
}
