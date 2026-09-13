import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { SubTile } from "@/components/sub-tile";
import { Toast } from "@/components/toast";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { detectLang, HTML_LANG, isLang, LOCALE, OG_IMAGE, rememberLang, translate, type Lang, type MsgKey } from "@/lib/i18n";
import { icsFilename, icsForSubscriptions } from "@/lib/ics";
import {
  clampPrice,
  CURRENCIES,
  CYCLES,
  daysUntil,
  formatDate,
  formatMoney,
  isDateKey,
  monthlyEquivalent,
  roundMoney,
  STATUSES,
  toDateKey,
  totalsByCurrency,
  yearlyEquivalent,
  type Cycle,
  type SubStatus,
} from "@/lib/money";
import {
  backupFilename,
  buildBackup,
  clearAll,
  download,
  loadCategories,
  loadPayments,
  loadPrefs,
  loadSubscriptions,
  newId,
  parseBackup,
  saveCategories,
  savePayments,
  savePrefs,
  saveSubscriptions,
  settleRenewal,
  toJSON,
  type Backup,
  type CustomCategory,
  type Payment,
  type Prefs,
  type SortKey,
  type Subscription,
  type Window,
} from "@/lib/store";
import { CATEGORIES, CATEGORY_MAP, searchTemplates, STARTER_TEMPLATE_IDS, TEMPLATE_MAP, templateName, type Template } from "@/lib/templates";
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

const CHIP_KEYS: MsgKey[] = ["chipNoAds", "chipUnlimited", "chipNoBank", "chipNoLoginWipe", "chipBackup", "chipCalendar", "chipFree", "chipLocal", "chipLangs"];
const TOAST_MS = 2200;
type Tab = "list" | "history" | "backup";

const CYCLE_KEY: Record<Cycle, MsgKey> = { weekly: "cycleWeekly", monthly: "cycleMonthly", quarterly: "cycleQuarterly", yearly: "cycleYearly" };
const PER_KEY: Record<Cycle, MsgKey> = { weekly: "perWeek", monthly: "perMonth", quarterly: "perQuarter", yearly: "perYear" };
const STATUS_KEY: Record<SubStatus, MsgKey> = { active: "statusActive", paused: "statusPaused", cancelled: "statusCancelled" };

interface Draft {
  id?: string;
  name: string;
  price: string;
  currency: string;
  nextRenewal: string;
  cycle: Cycle;
  categoryId: string;
  status: SubStatus;
  notes: string;
  website: string;
  iconKey?: string;
  newCategory: string;
}

function blankDraft(currency: string): Draft {
  return {
    name: "",
    price: "",
    currency,
    nextRenewal: toDateKey(new Date()),
    cycle: "monthly",
    categoryId: "",
    status: "active",
    notes: "",
    website: "",
    newCategory: "",
  };
}

function draftFromTemplate(tpl: Template, lang: Lang, currency: string): Draft {
  return {
    ...blankDraft(currency),
    name: templateName(tpl, lang),
    cycle: tpl.cycle,
    categoryId: tpl.categoryId,
    website: tpl.website ?? "",
    iconKey: tpl.id,
  };
}

function draftFromSub(s: Subscription): Draft {
  return {
    id: s.id,
    name: s.name,
    price: String(s.price),
    currency: s.currency,
    nextRenewal: s.nextRenewal,
    cycle: s.cycle,
    categoryId: s.categoryId ?? "",
    status: s.status,
    notes: s.notes ?? "",
    website: s.website ?? "",
    iconKey: s.iconKey,
    newCategory: "",
  };
}

function Home() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  const lang = useMemo(() => detectLang(search.lang ?? null), [search.lang]);
  const t = useCallback((key: MsgKey, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);
  const locale = LOCALE[lang];

  const [categories, setCategories] = useState<CustomCategory[]>(() => loadCategories());
  const [subs, setSubs] = useState<Subscription[]>(() => loadSubscriptions(loadCategories()));
  const [payments, setPayments] = useState<Payment[]>(() => loadPayments());
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs());
  const [tab, setTab] = useState<Tab>("list");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [draftError, setDraftError] = useState<MsgKey | null>(null);
  const [picker, setPicker] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerCat, setPickerCat] = useState("");
  const [confirm, setConfirm] = useState<null | { kind: "import"; parsed: Backup } | { kind: "clearAll" } | { kind: "deleteSub"; id: string }>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const toastTimer = useRef<number | undefined>(undefined);
  const fileRef = useRef<HTMLInputElement>(null);
  const today = useMemo(() => new Date(), []);

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

  useEffect(() => saveSubscriptions(subs), [subs]);
  useEffect(() => savePayments(payments), [payments]);
  useEffect(() => saveCategories(categories), [categories]);
  useEffect(() => savePrefs(prefs), [prefs]);

  const onLangChange = (next: Lang) => {
    rememberLang(next);
    navigate({ search: (prev) => ({ ...prev, lang: next }) });
  };

  const patchPrefs = (partial: Partial<Prefs>) => setPrefs((p) => ({ ...p, ...partial }));

  const categoryName = (id?: string): string => {
    if (!id) return "";
    const builtin = CATEGORY_MAP[id];
    if (builtin) return builtin.names[lang] || builtin.names.en;
    return categories.find((c) => c.id === id)?.name ?? "";
  };
  const categoryColor = (id?: string): string => {
    if (!id) return CATEGORY_MAP.other.color;
    return CATEGORY_MAP[id]?.color ?? categories.find((c) => c.id === id)?.color ?? CATEGORY_MAP.other.color;
  };

  /* ---------- derived ---------- */
  const active = useMemo(() => subs.filter((s) => s.status === "active"), [subs]);
  const totals = useMemo(() => totalsByCurrency(subs), [subs]);
  const upcoming = useMemo(() => active.filter((s) => { const d = daysUntil(s.nextRenewal, today); return d >= 0 && d <= 7; }).length, [active, today]);
  const overdue = useMemo(() => active.filter((s) => daysUntil(s.nextRenewal, today) < 0).length, [active, today]);
  const currenciesInUse = useMemo(() => [...new Set(subs.map((s) => s.currency))].sort(), [subs]);

  const visible = useMemo(() => {
    const q = prefs.search.trim().toLowerCase();
    const rows = subs.filter((s) => {
      if (prefs.hideCancelled && s.status === "cancelled") return false;
      if (prefs.filterCategory && s.categoryId !== prefs.filterCategory) return false;
      if (prefs.filterCurrency && s.currency !== prefs.filterCurrency) return false;
      if (prefs.filterCycle && s.cycle !== prefs.filterCycle) return false;
      const d = daysUntil(s.nextRenewal, today);
      if (prefs.window === "7" && (d < 0 || d > 7)) return false;
      if (prefs.window === "30" && (d < 0 || d > 30)) return false;
      if (prefs.window === "overdue" && d >= 0) return false;
      if (q) {
        const hay = `${s.name} ${s.notes ?? ""} ${categoryName(s.categoryId)} ${s.currency}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const order: Record<SubStatus, number> = { active: 0, paused: 1, cancelled: 2 };
    rows.sort((a, b) => {
      if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
      if (prefs.sort === "name") return a.name.localeCompare(b.name, locale);
      if (prefs.sort === "price") return monthlyEquivalent(b.price, b.cycle) - monthlyEquivalent(a.price, a.cycle);
      return a.nextRenewal.localeCompare(b.nextRenewal);
    });
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subs, prefs, today, lang, categories]);

  /* ---------- actions ---------- */
  const openBlank = () => {
    setDraftError(null);
    setDraft(blankDraft(prefs.defaultCurrency));
  };
  const openTemplate = (tpl: Template) => {
    setPicker(false);
    setDraftError(null);
    setDraft(draftFromTemplate(tpl, lang, prefs.defaultCurrency));
  };
  const openEdit = (s: Subscription) => {
    setDraftError(null);
    setDraft(draftFromSub(s));
  };

  const saveDraft = () => {
    if (!draft) return;
    const name = draft.name.trim();
    if (!name) return setDraftError("needName");
    const priceNum = draft.price.trim() === "" ? NaN : Number(draft.price.replace(/,/g, ""));
    if (!Number.isFinite(priceNum) || priceNum < 0) return setDraftError("needPrice");
    if (!isDateKey(draft.nextRenewal)) return setDraftError("needDate");
    let categoryId = draft.categoryId || undefined;
    const newCat = draft.newCategory.trim();
    if (newCat) {
      const existing = categories.find((c) => c.name.toLowerCase() === newCat.toLowerCase());
      if (existing) categoryId = existing.id;
      else {
        const created: CustomCategory = { id: newId("c"), name: newCat.slice(0, 40), color: "#64748b" };
        setCategories((cs) => [...cs, created]);
        categoryId = created.id;
      }
    }
    const nowIso = new Date().toISOString();
    const base = draft.id ? subs.find((s) => s.id === draft.id) : undefined;
    const next: Subscription = {
      id: base?.id ?? newId("s"),
      name: name.slice(0, 80),
      price: clampPrice(priceNum),
      currency: draft.currency.trim().toUpperCase().slice(0, 3) || prefs.defaultCurrency,
      nextRenewal: draft.nextRenewal,
      cycle: draft.cycle,
      categoryId,
      notes: draft.notes.trim().slice(0, 400) || undefined,
      website: draft.website.trim().slice(0, 200) || undefined,
      iconKey: draft.iconKey,
      status: draft.status,
      createdAt: base?.createdAt ?? nowIso,
      updatedAt: nowIso,
    };
    setSubs((list) => (base ? list.map((s) => (s.id === base.id ? next : s)) : [...list, next]));
    patchPrefs({ defaultCurrency: next.currency });
    setDraft(null);
    showToast(t("savedToast"));
  };

  const settle = (s: Subscription, status: "paid" | "skipped") => {
    const r = settleRenewal(s, status);
    setSubs((list) => list.map((x) => (x.id === s.id ? r.subscription : x)));
    setPayments((p) => [r.payment, ...p]);
    showToast(t(status === "paid" ? "paidToast" : "skippedToast"));
  };

  const deleteSub = (id: string) => {
    setSubs((list) => list.filter((s) => s.id !== id));
    setPayments((p) => p.filter((x) => x.subscriptionId !== id));
    showToast(t("deletedToast"));
  };

  const onExport = () => {
    download(backupFilename(), toJSON(buildBackup(subs, payments, categories, prefs)));
    showToast(t("exported"));
  };

  const onExportIcs = (only?: Subscription) => {
    const rows = only ? [only] : active;
    if (rows.length === 0) return showToast(t("icsEmpty"));
    download(icsFilename(only ?? null), icsForSubscriptions(rows, { locale }), "text/calendar");
    showToast(t("exported"));
  };

  const onImportFile = async (file: File) => {
    try {
      const parsed = parseBackup(JSON.parse(await file.text()));
      if (!parsed) return showToast(t("importBad"));
      setConfirm({ kind: "import", parsed });
    } catch {
      showToast(t("importBad"));
    }
  };

  const applyImport = (b: Backup) => {
    setCategories(b.categories);
    setSubs(b.subscriptions);
    setPayments(b.payments);
    showToast(t("importOk", { n: b.subscriptions.length }));
  };

  const doClear = () => {
    clearAll();
    setSubs([]);
    setPayments([]);
    setCategories([]);
    showToast(t("cleared"));
  };

  const dueLabel = (s: Subscription): { text: string; tone: "" | "is-soon" | "is-overdue" } => {
    const d = daysUntil(s.nextRenewal, today);
    if (d < 0) return { text: t("overdueBy", { n: -d }), tone: "is-overdue" };
    if (d === 0) return { text: t("dueToday"), tone: "is-soon" };
    if (d === 1) return { text: t("dueTomorrow"), tone: "is-soon" };
    return { text: t("dueIn", { n: d }), tone: d <= 7 ? "is-soon" : "" };
  };

  const pickerRows = useMemo(() => searchTemplates(pickerQuery, lang, pickerCat || undefined), [pickerQuery, lang, pickerCat]);
  const subById = useMemo(() => new Map(subs.map((s) => [s.id, s])), [subs]);

  /* ---------- render ---------- */
  return (
    <div className="sb-app" id="app">
      <LocalOnlyBanner text={t("localOnly")} />
      <Masthead t={t} lang={lang} onLangChange={onLangChange} />

      <section className="sb-summary" id="summary" aria-label={t("summaryMonthly")}>
        <div className={"sb-stat" + (upcoming + overdue > 0 ? " is-coral" : "")}>
          <p className="sb-stat-label">{t("summaryUpcoming")}</p>
          <p className={"sb-stat-value" + (upcoming + overdue > 0 ? " is-coral" : "")} id="stat-upcoming">{upcoming}</p>
          <p className="sb-stat-sub">{t("summaryUpcomingHint", { overdue })}</p>
        </div>
        <div className="sb-stat">
          <p className="sb-stat-label">{t("listTitle")}</p>
          <p className="sb-stat-value" id="stat-active">{active.length}</p>
          <p className="sb-stat-sub">{t("summaryActive", { n: active.length })}</p>
        </div>
        <div className="sb-stat sb-totals" id="totals">
          {totals.length === 0 ? (
            <p className="sb-hint">{t("noTotalsYet")}</p>
          ) : (
            totals.map((row) => (
              <div className="sb-total-row" key={row.currency} data-currency={row.currency}>
                <span className="sb-total-cur">{row.currency}</span>
                <div className="sb-total-cell">
                  <b className="sb-total-monthly">{formatMoney(roundMoney(row.monthly, row.currency), row.currency, locale)}</b>
                  <span>{t("summaryMonthly")}</span>
                </div>
                <div className="sb-total-cell">
                  <b className="sb-total-yearly">{formatMoney(roundMoney(row.yearly, row.currency), row.currency, locale)}</b>
                  <span>{t("summaryYearly")}</span>
                </div>
              </div>
            ))
          )}
          <p className="sb-hint" id="no-fx-note">{t("noFxNote")}</p>
        </div>
      </section>

      <nav className="sb-tabs" aria-label="tabs">
        {(["list", "history", "backup"] as Tab[]).map((k) => (
          <button key={k} type="button" id={`tab-${k}`} className={"sb-tab" + (tab === k ? " is-on" : "")} aria-pressed={tab === k} onClick={() => setTab(k)}>
            {t(k === "list" ? "tabList" : k === "history" ? "tabHistory" : "tabBackup")}
          </button>
        ))}
      </nav>

      {tab === "list" && (
        <section className="sb-card" id="list-card">
          <div className="sb-card-head">
            <h2>
              {t("listTitle")} <span className="sb-hint">{t("listCount", { n: visible.length })}</span>
            </h2>
            <div className="sb-row">
              <button type="button" className="sb-btn sb-btn-sm sb-btn-quiet" id="btn-add-template" onClick={() => { setPickerQuery(""); setPickerCat(""); setPicker(true); }}>
                {t("addFromTemplate")}
              </button>
              <button type="button" className="sb-btn sb-btn-sm sb-btn-primary" id="btn-add" onClick={openBlank}>
                + {t("addSub")}
              </button>
            </div>
          </div>

          <input
            id="sub-search"
            className="sb-input"
            type="search"
            placeholder={t("searchPlaceholder")}
            value={prefs.search}
            onChange={(e) => patchPrefs({ search: e.target.value })}
            aria-label={t("searchPlaceholder")}
          />
          <div className="sb-grid">
            <label className="sb-field">
              {t("filterCategory")}
              <select id="filter-category" className="sb-select-block" value={prefs.filterCategory} onChange={(e) => patchPrefs({ filterCategory: e.target.value })}>
                <option value="">{t("allCategories")}</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.names[lang]}</option>
                ))}
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
            <label className="sb-field">
              {t("filterCurrency")}
              <select id="filter-currency" className="sb-select-block" value={prefs.filterCurrency} onChange={(e) => patchPrefs({ filterCurrency: e.target.value })}>
                <option value="">{t("allCurrencies")}</option>
                {currenciesInUse.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="sb-field">
              {t("filterCycle")}
              <select id="filter-cycle" className="sb-select-block" value={prefs.filterCycle} onChange={(e) => patchPrefs({ filterCycle: e.target.value })}>
                <option value="">{t("allCycles")}</option>
                {CYCLES.map((c) => (
                  <option key={c} value={c}>{t(CYCLE_KEY[c])}</option>
                ))}
              </select>
            </label>
            <label className="sb-field">
              {t("filterWindow")}
              <select id="filter-window" className="sb-select-block" value={prefs.window} onChange={(e) => patchPrefs({ window: e.target.value as Window })}>
                <option value="all">{t("windowAll")}</option>
                <option value="7">{t("window7")}</option>
                <option value="30">{t("window30")}</option>
                <option value="overdue">{t("windowOverdue")}</option>
              </select>
            </label>
          </div>
          <div className="sb-row wrap">
            <label className="sb-field" style={{ flex: 1 }}>
              {t("sortLabel")}
              <select id="sort" className="sb-select-block" value={prefs.sort} onChange={(e) => patchPrefs({ sort: e.target.value as SortKey })}>
                <option value="renewal">{t("sortRenewal")}</option>
                <option value="name">{t("sortName")}</option>
                <option value="price">{t("sortPrice")}</option>
              </select>
            </label>
            <label className="sb-check">
              <input type="checkbox" id="show-cancelled" checked={!prefs.hideCancelled} onChange={(e) => patchPrefs({ hideCancelled: !e.target.checked })} />
              {t("showCancelled")}
            </label>
          </div>

          {subs.length === 0 ? (
            <div className="sb-empty" id="empty-state">
              <h3>{t("emptyTitle")}</h3>
              <p className="sb-hint">{t("emptyBody")}</p>
              <p className="sb-hint"><b>{t("emptyStarter")}</b></p>
              <div className="sb-chips" id="starter-chips">
                {STARTER_TEMPLATE_IDS.map((id) => TEMPLATE_MAP[id]).filter(Boolean).map((tpl) => (
                  <button key={tpl.id} type="button" className="sb-chip" data-template={tpl.id} onClick={() => openTemplate(tpl)}>
                    <SubTile name={templateName(tpl, lang)} iconKey={tpl.id} small />
                    {templateName(tpl, lang)}
                  </button>
                ))}
              </div>
            </div>
          ) : visible.length === 0 ? (
            <p className="sb-hint" id="no-match">{t("noMatch")}</p>
          ) : (
            <ul className="sb-list" id="sub-list">
              {visible.map((s) => {
                const due = dueLabel(s);
                const inactive = s.status !== "active";
                return (
                  <li key={s.id} className={"sb-sub" + (inactive ? " is-inactive" : due.tone === "is-overdue" ? " is-overdue" : due.tone === "is-soon" ? " is-soon" : "")} data-id={s.id}>
                    <SubTile name={s.name} iconKey={s.iconKey} categoryId={s.categoryId} color={s.color} />
                    <div className="sb-sub-main">
                      <p className="sb-sub-name">{s.name}</p>
                      <p className="sb-sub-meta">
                        {s.categoryId && <span className="sb-cat" style={{ background: categoryColor(s.categoryId) }}>{categoryName(s.categoryId)}</span>}
                        <span>{t(CYCLE_KEY[s.cycle])}</span>
                        <span>{t("nextOn", { date: formatDate(s.nextRenewal, locale) })}</span>
                        {inactive && <span>· {t(STATUS_KEY[s.status])}</span>}
                      </p>
                    </div>
                    <div className="sb-sub-side">
                      <p className="sb-price">
                        {formatMoney(s.price, s.currency, locale)} <small>{t(PER_KEY[s.cycle])}</small>
                      </p>
                      {!inactive && <p className={"sb-due " + due.tone}>{due.text}</p>}
                    </div>
                    <div className="sb-sub-actions">
                      {!inactive && (
                        <>
                          <button type="button" className="sb-btn sb-btn-sm sb-btn-primary" data-action="paid" onClick={() => settle(s, "paid")}>{t("markPaid")}</button>
                          <button type="button" className="sb-btn sb-btn-sm sb-btn-quiet" data-action="skip" onClick={() => settle(s, "skipped")}>{t("skip")}</button>
                        </>
                      )}
                      <button type="button" className="sb-btn sb-btn-sm" data-action="edit" onClick={() => openEdit(s)}>{t("edit")}</button>
                      <button type="button" className="sb-btn sb-btn-sm" data-action="ics" onClick={() => onExportIcs(s)}>{t("exportIcsOne")}</button>
                      <button type="button" className="sb-btn sb-btn-sm sb-btn-danger" data-action="delete" onClick={() => setConfirm({ kind: "deleteSub", id: s.id })}>{t("delete")}</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {tab === "history" && (
        <section className="sb-card" id="history-card">
          <h2>{t("historyTitle")}</h2>
          {payments.length === 0 ? (
            <p className="sb-hint" id="history-empty">{t("historyEmpty")}</p>
          ) : (
            <ul className="sb-history" id="history-list">
              {payments.map((p) => {
                const s = subById.get(p.subscriptionId);
                return (
                  <li key={p.id} className="sb-pay" data-status={p.status}>
                    {s ? <SubTile name={s.name} iconKey={s.iconKey} categoryId={s.categoryId} color={s.color} small /> : <span className="sb-tile is-sm" style={{ background: "#94a3b8" }} aria-hidden="true">?</span>}
                    <div className="sb-pay-main">
                      <b>{s?.name ?? t("historyUnknownSub")}</b>
                      <span>{formatDate(p.dueDate, locale)}</span>
                    </div>
                    <div className="sb-pay-side">
                      <span className={"sb-badge" + (p.status === "skipped" ? " is-skip" : "")}>{p.status === "paid" ? t("historyPaid") : t("historySkipped")}</span>
                      {p.status === "paid" && p.amount !== undefined && <span className="sb-price">{formatMoney(p.amount, p.currency ?? s?.currency ?? "USD", locale)}</span>}
                      <button type="button" className="sb-btn sb-btn-sm sb-btn-quiet" data-action="remove-payment" onClick={() => setPayments((list) => list.filter((x) => x.id !== p.id))}>{t("removePayment")}</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {tab === "backup" && (
        <section className="sb-card" id="backup-card">
          <h2>{t("backupTitle")}</h2>
          <p className="sb-hint">{t("backupHint")}</p>
          <div className="sb-row wrap">
            <button type="button" className="sb-btn sb-btn-primary" id="btn-export" onClick={onExport}>{t("exportJson")}</button>
            <button type="button" className="sb-btn sb-btn-quiet" id="btn-import" onClick={() => fileRef.current?.click()}>{t("importJson")}</button>
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
          <p className="sb-hint">{t("icsHint")}</p>
          <div className="sb-row wrap">
            <button type="button" className="sb-btn sb-btn-accent" id="btn-export-ics" onClick={() => onExportIcs()}>{t("exportIcs")}</button>
          </div>
          <label className="sb-field">
            {t("defaultCurrency")}
            <select id="default-currency" className="sb-select-block" value={prefs.defaultCurrency} onChange={(e) => patchPrefs({ defaultCurrency: e.target.value })}>
              {[...new Set([...CURRENCIES, ...currenciesInUse])].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <div className="sb-actions">
            <button type="button" className="sb-btn sb-btn-danger" id="btn-clear" onClick={() => setConfirm({ kind: "clearAll" })}>{t("clearAll")}</button>
          </div>
        </section>
      )}

      <section className="sb-card" id="promises" aria-label={t("promiseTitle")}>
        <div className="sb-promises">
          {CHIP_KEYS.map((k) => (
            <span key={k} className="sb-promise">{t(k)}</span>
          ))}
        </div>
      </section>

      <footer className="sb-footer">
        <a id="link-privacy" href={`https://try-dabble.com/${lang}/privacy`}>
          {t("privacy")}
        </a>
        <a id="link-terms" href={`https://try-dabble.com/${lang}/terms`}>
          {t("terms")}
        </a>
        <a id="link-guide" href={`https://try-dabble.com/${lang}/guides/subpad`} target="_blank" rel="noreferrer">
          {t("guide")}
        </a>
        <a id="link-hub" href={`https://try-dabble.com/${lang}`}>
          try-dabble.com
        </a>
      </footer>

      {/* template picker */}
      <Dialog open={picker} onOpenChange={setPicker}>
        <DialogContent id="template-dialog" showCloseButton={false}>
          <DialogTitle className="sb-sheet-title">{t("templateTitle")}</DialogTitle>
          <DialogDescription className="sb-hint">{t("templateHint")}</DialogDescription>
          <input id="template-search" className="sb-input" type="search" placeholder={t("templateSearch")} value={pickerQuery} onChange={(e) => setPickerQuery(e.target.value)} aria-label={t("templateSearch")} />
          <select id="template-category" className="sb-select-block" value={pickerCat} onChange={(e) => setPickerCat(e.target.value)} aria-label={t("filterCategory")}>
            <option value="">{t("allCategories")}</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.names[lang]}</option>
            ))}
          </select>
          {pickerRows.length === 0 ? (
            <p className="sb-hint">{t("templateNone")}</p>
          ) : (
            <ul className="sb-templates" id="template-list">
              {pickerRows.map((tpl) => (
                <li key={tpl.id}>
                  <button type="button" className="sb-template" data-template={tpl.id} onClick={() => openTemplate(tpl)}>
                    <SubTile name={templateName(tpl, lang)} iconKey={tpl.id} small />
                    <span>{templateName(tpl, lang)}</span>
                    <small>{CATEGORY_MAP[tpl.categoryId]?.names[lang]} · {t(CYCLE_KEY[tpl.cycle])}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="sb-actions">
            <button type="button" className="sb-btn sb-btn-quiet" onClick={() => setPicker(false)}>{t("close")}</button>
            <button type="button" className="sb-btn sb-btn-primary" onClick={() => { setPicker(false); openBlank(); }}>{t("addBlank")}</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* add / edit */}
      <Dialog open={draft !== null} onOpenChange={(o) => { if (!o) setDraft(null); }}>
        <DialogContent id="sub-dialog" showCloseButton={false}>
          <DialogTitle className="sb-sheet-title">{draft?.id ? t("editSub") : t("addSub")}</DialogTitle>
          <DialogDescription className="sr-only">{t("tagline")}</DialogDescription>
          {draft && (
            <form
              id="sub-form"
              className="grid gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                saveDraft();
              }}
            >
              <div className="sb-row">
                <SubTile name={draft.name || "?"} iconKey={draft.iconKey} categoryId={draft.categoryId || undefined} />
                <label className="sb-field" style={{ flex: 1 }}>
                  {t("fieldName")}
                  <input id="f-name" className="sb-input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} maxLength={80} />
                </label>
              </div>
              <div className="sb-grid">
                <label className="sb-field">
                  {t("fieldPrice")}
                  <input id="f-price" className="sb-input" inputMode="decimal" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} placeholder="0" />
                </label>
                <label className="sb-field">
                  {t("fieldCurrency")}
                  <select id="f-currency" className="sb-select-block" value={draft.currency} onChange={(e) => setDraft({ ...draft, currency: e.target.value })}>
                    {[...new Set([...CURRENCIES, ...currenciesInUse, draft.currency])].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label className="sb-field">
                  {t("fieldNext")}
                  <input id="f-next" className="sb-input" type="date" value={draft.nextRenewal} onChange={(e) => setDraft({ ...draft, nextRenewal: e.target.value })} />
                </label>
                <label className="sb-field">
                  {t("fieldCycle")}
                  <select id="f-cycle" className="sb-select-block" value={draft.cycle} onChange={(e) => setDraft({ ...draft, cycle: e.target.value as Cycle })}>
                    {CYCLES.map((c) => (
                      <option key={c} value={c}>{t(CYCLE_KEY[c])}</option>
                    ))}
                  </select>
                </label>
                <label className="sb-field">
                  {t("fieldCategory")}
                  <select id="f-category" className="sb-select-block" value={draft.categoryId} onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}>
                    <option value="">—</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.names[lang]}</option>
                    ))}
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </label>
                <label className="sb-field">
                  {t("fieldStatus")}
                  <select id="f-status" className="sb-select-block" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as SubStatus })}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{t(STATUS_KEY[s])}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="sb-field">
                {t("newCategory")}
                <input id="f-new-category" className="sb-input" value={draft.newCategory} onChange={(e) => setDraft({ ...draft, newCategory: e.target.value })} placeholder={t("newCategoryPlaceholder")} maxLength={40} />
              </label>
              <label className="sb-field">
                {t("fieldWebsite")}
                <input id="f-website" className="sb-input" type="url" value={draft.website} onChange={(e) => setDraft({ ...draft, website: e.target.value })} placeholder="https://" />
              </label>
              <label className="sb-field">
                {t("fieldNotes")}
                <textarea id="f-notes" className="sb-textarea" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} maxLength={400} />
              </label>
              {draftError && <p className="sb-error" id="draft-error">{t(draftError)}</p>}
              <p className="sb-hint">
                {t("summaryMonthly")}: {formatMoney(roundMoney(monthlyEquivalent(Number(draft.price) || 0, draft.cycle), draft.currency), draft.currency, locale)} · {t("summaryYearly")}: {formatMoney(roundMoney(yearlyEquivalent(Number(draft.price) || 0, draft.cycle), draft.currency), draft.currency, locale)}
              </p>
              <div className="sb-actions">
                <button type="button" className="sb-btn sb-btn-quiet" id="btn-draft-cancel" onClick={() => setDraft(null)}>{t("cancel")}</button>
                <button type="submit" className="sb-btn sb-btn-primary" id="btn-draft-save">{t("save")}</button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.kind === "import" ? t("importConfirmTitle") : confirm?.kind === "deleteSub" ? t("deleteSubTitle") : t("clearAllTitle")}
        body={confirm?.kind === "import" ? t("importConfirmBody") : confirm?.kind === "deleteSub" ? t("deleteSubBody") : t("clearAllBody")}
        confirmLabel={confirm?.kind === "import" ? t("importJson") : confirm?.kind === "deleteSub" ? t("delete") : t("clearAll")}
        cancelLabel={t("cancel")}
        destructive={confirm?.kind !== "import"}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
        onConfirm={() => {
          if (!confirm) return;
          if (confirm.kind === "import") applyImport(confirm.parsed);
          else if (confirm.kind === "deleteSub") deleteSub(confirm.id);
          else doClear();
        }}
      />

      <Toast message={toastMsg} visible={toastOn} />
    </div>
  );
}
