import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { BackupCard } from "@/components/backup-card";
import { CategoryCard } from "@/components/category-card";
import { CategoryDialog, type CategoryDraft } from "@/components/category-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ExpenseDialog, type ExpenseDraft } from "@/components/expense-dialog";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { Toast } from "@/components/toast";
import { WeekNav } from "@/components/week-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { backupFilename, buildBackup, download, parseBackup, toCSV, toJSON } from "@/lib/backup";
import { CURRENCIES, currencyInfo, formatMoney, parseAmount } from "@/lib/currency";
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
import { FONT_SIZES, loadPrefs, savePrefs, type FontSize, type Prefs } from "@/lib/prefs";
import {
  clearStore,
  loadCategories,
  loadExpenses,
  newId,
  nextColor,
  saveCategories,
  saveExpenses,
  summarize,
  totals,
  weekExpenses,
  type Category,
  type Expense,
} from "@/lib/store";
import { addWeeks, clampToWeek, parseDate, todayStr, weekOf, weekStartOf, type WeekStartsOn } from "@/lib/week";
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

const CHIP_KEYS: MsgKey[] = ["chipNoAds", "chipNoIap", "chipBackup", "chipNoLogin", "chipFree", "chipLocal", "chipLangs"];
const FONT_LABEL: Record<FontSize, MsgKey> = { md: "fontMd", lg: "fontLg", xl: "fontXl" };
const TOAST_MS = 2200;
const WEEK_CHECK_MS = 60_000;

type Confirm =
  | { kind: "deleteCategory"; id: string }
  | { kind: "deleteExpense"; id: string }
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

  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs(lang));
  const [categories, setCategories] = useState<Category[]>(() => loadCategories());
  const [expenses, setExpenses] = useState<Expense[]>(() => loadExpenses());

  // The calendar week that is "now", re-read on a timer and when the tab
  // comes back, so a pad left open over Sunday night rolls into Monday.
  const [today, setToday] = useState<string>(() => todayStr());
  const currentWeek = weekStartOf(today, prefs.weekStartsOn);
  const [weekStart, setWeekStart] = useState<string>(currentWeek);
  const followingCurrent = useRef(true);

  const [catDialog, setCatDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [expDialog, setExpDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState<string>(() => todayStr());
  const [formError, setFormError] = useState("");

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

  const commitPrefs = useCallback((next: Prefs) => {
    setPrefs(next);
    savePrefs(next);
  }, []);
  const commitCategories = useCallback((next: Category[]) => {
    setCategories(next);
    saveCategories(next);
  }, []);
  const commitExpenses = useCallback((next: Expense[]) => {
    setExpenses(next);
    saveExpenses(next);
  }, []);

  /**
   * Week boundary. On open and whenever the clock ticks past midnight, the
   * calendar week is re-read. If it moved on since the pad last saw it, the
   * view jumps to the new week (provided the reader was on "this week") and
   * the last-seen key is stored so the next open can tell the difference.
   */
  useEffect(() => {
    const check = () => setToday(todayStr());
    const timer = window.setInterval(check, WEEK_CHECK_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", check);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", check);
    };
  }, []);

  useEffect(() => {
    if (prefs.lastSeenWeek !== currentWeek) {
      const wasSeen = prefs.lastSeenWeek !== undefined;
      commitPrefs({ ...prefs, lastSeenWeek: currentWeek });
      if (followingCurrent.current) setWeekStart(currentWeek);
      if (wasSeen) showToast(translate(lang, "newWeekToast"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeek]);

  // Changing the week start day re-anchors the selected week to the same date.
  useEffect(() => {
    setWeekStart((w) => weekStartOf(w, prefs.weekStartsOn));
  }, [prefs.weekStartsOn]);

  const week = useMemo(() => weekOf(weekStart, prefs.weekStartsOn), [weekStart, prefs.weekStartsOn]);
  const isCurrent = weekStart === currentWeek;

  // The quick-add date follows the viewed week: today when this week is
  // open, otherwise the nearest day inside the week on screen.
  useEffect(() => {
    setDate(clampToWeek(today, weekStart));
  }, [today, weekStart]);

  const money = useCallback(
    (n: number) => formatMoney(n, prefs.currency, locale, prefs.currencySymbol),
    [prefs.currency, prefs.currencySymbol, locale],
  );
  const symbol = prefs.currencySymbol?.trim() || currencyInfo(prefs.currency).symbol;

  const live = useMemo(() => categories.filter((c) => !c.archived), [categories]);
  const archived = useMemo(() => categories.filter((c) => c.archived), [categories]);
  const shown = showArchived ? [...live, ...archived] : live;
  const summaries = useMemo(
    () => new Map(shown.map((c) => [c.id, summarize(c, expenses, weekStart, prefs.weekStartsOn)])),
    [shown, expenses, weekStart, prefs.weekStartsOn],
  );
  const sortedShown = useMemo(() => {
    // Planned-this-week first, then the rest, each in creation order.
    return [...shown].sort((a, b) => {
      const pa = summaries.get(a.id)?.plannedThisWeek ? 0 : 1;
      const pb = summaries.get(b.id)?.plannedThisWeek ? 0 : 1;
      return pa - pb;
    });
  }, [shown, summaries]);
  const total = useMemo(() => totals(categories, expenses, weekStart, prefs.weekStartsOn), [categories, expenses, weekStart, prefs.weekStartsOn]);
  const list = useMemo(() => weekExpenses(expenses, weekStart, prefs.weekStartsOn), [expenses, weekStart, prefs.weekStartsOn]);
  const daysWithExpenses = useMemo(() => new Set(list.map((e) => e.date)), [list]);
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // Keep the quick-add category pointing at a live category.
  useEffect(() => {
    if (!live.some((c) => c.id === categoryId)) setCategoryId(live[0]?.id ?? "");
  }, [live, categoryId]);

  const dayNameFmt = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }), [locale]);

  // ---- categories --------------------------------------------------------

  function saveCategory(draft: CategoryDraft) {
    if (catDialog.id) {
      commitCategories(
        categories.map((c) =>
          c.id === catDialog.id
            ? { ...c, name: draft.name, plannedWeekly: draft.plannedWeekly, recurring: draft.recurring, archived: draft.archived || undefined }
            : c,
        ),
      );
    } else {
      const cat: Category = {
        id: newId(),
        name: draft.name,
        plannedWeekly: draft.plannedWeekly,
        color: nextColor(categories),
        recurring: draft.recurring,
        createdAt: new Date().toISOString(),
      };
      commitCategories([...categories, cat]);
      if (!categoryId) setCategoryId(cat.id);
    }
    showToast(t("categorySaved"));
  }

  function deleteCategory(id: string) {
    commitCategories(categories.filter((c) => c.id !== id));
    commitExpenses(expenses.filter((e) => e.categoryId !== id));
    showToast(t("categoryDeleted"));
  }

  // ---- expenses ----------------------------------------------------------

  function addExpense() {
    const n = parseAmount(amount);
    if (live.length === 0) {
      setFormError(t("needCategory"));
      return;
    }
    if (Number.isNaN(n)) {
      setFormError(t("invalidAmount"));
      return;
    }
    const cat = live.some((c) => c.id === categoryId) ? categoryId : live[0].id;
    const when = parseDate(date) === null ? clampToWeek(today, weekStart) : date;
    const exp: Expense = {
      id: newId(),
      categoryId: cat,
      amount: Math.round(n * 100) / 100,
      date: when,
      createdAt: new Date().toISOString(),
    };
    if (note.trim()) exp.note = note.trim().slice(0, 140);
    commitExpenses([...expenses, exp]);
    setAmount("");
    setNote("");
    setFormError("");
    // An expense dated outside the viewed week lands in its own week.
    const target = weekStartOf(when, prefs.weekStartsOn);
    if (target !== weekStart) {
      followingCurrent.current = target === currentWeek;
      setWeekStart(target);
    }
    showToast(t("expenseAdded"));
  }

  function saveExpense(draft: ExpenseDraft) {
    if (!expDialog.id) return;
    commitExpenses(
      expenses.map((e) =>
        e.id === expDialog.id
          ? { ...e, amount: Math.round(draft.amount * 100) / 100, categoryId: draft.categoryId, note: draft.note ? draft.note.slice(0, 140) : undefined, date: draft.date }
          : e,
      ),
    );
    showToast(t("expenseSaved"));
  }

  function deleteExpense(id: string) {
    commitExpenses(expenses.filter((e) => e.id !== id));
    showToast(t("expenseDeleted"));
  }

  // ---- backup ------------------------------------------------------------

  function exportJson() {
    download(toJSON(buildBackup(categories, expenses, prefs)), backupFilename("backup", "json"), "application/json");
    showToast(t("exported"));
  }

  function exportCsv() {
    if (expenses.length === 0) {
      showToast(t("nothingToExport"));
      return;
    }
    download(toCSV(expenses, categories, prefs.currency), backupFilename("expenses", "csv"), "text/csv");
    showToast(t("exported"));
  }

  async function importFile(file: File) {
    let parsed: ReturnType<typeof parseBackup>;
    try {
      parsed = parseBackup(await file.text(), lang);
    } catch {
      showToast(t("importBad"));
      return;
    }
    if (categories.length === 0 && expenses.length === 0) applyImport(parsed);
    else setConfirm({ kind: "import", parsed });
  }

  function applyImport(parsed: ReturnType<typeof parseBackup>) {
    commitCategories(parsed.categories);
    commitExpenses(parsed.expenses);
    if (parsed.prefs) commitPrefs({ ...parsed.prefs, lastSeenWeek: prefs.lastSeenWeek });
    showToast(t("importOk", { c: parsed.categories.length, e: parsed.expenses.length }));
  }

  function clearAll() {
    clearStore();
    setCategories([]);
    setExpenses([]);
    showToast(t("cleared"));
  }

  // ---- week nav ----------------------------------------------------------

  function goWeek(n: number) {
    const next = addWeeks(weekStart, n);
    followingCurrent.current = next === currentWeek;
    setWeekStart(next);
  }
  function goToday() {
    followingCurrent.current = true;
    setWeekStart(currentWeek);
  }

  const editingCat = catDialog.id ? (catById.get(catDialog.id) ?? null) : null;
  const editingExp = expDialog.id ? (expenses.find((e) => e.id === expDialog.id) ?? null) : null;
  const hasData = categories.length > 0 || expenses.length > 0;

  const confirmText = (() => {
    if (!confirm) return { title: "", body: "", ok: "" };
    switch (confirm.kind) {
      case "deleteCategory": {
        const c = catById.get(confirm.id);
        const count = expenses.filter((e) => e.categoryId === confirm.id).length;
        return { title: t("deleteCategoryTitle"), body: t("deleteCategoryBody", { name: c?.name ?? "", count }), ok: t("delete") };
      }
      case "deleteExpense":
        return { title: t("deleteExpense"), body: t("expensesTitle"), ok: t("delete") };
      case "import":
        return { title: t("importConfirmTitle"), body: t("importConfirmBody"), ok: t("importJson") };
      case "clearAll":
        return { title: t("clearAllTitle"), body: t("clearAllBody"), ok: t("delete") };
    }
  })();

  return (
    <div className="wp-app" data-size={prefs.fontSize} data-week={weekStart} data-current-week={currentWeek}>
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

      <WeekNav
        week={week}
        today={today}
        isCurrent={isCurrent}
        daysWithExpenses={daysWithExpenses}
        locale={locale}
        t={t}
        onPrev={() => goWeek(-1)}
        onNext={() => goWeek(1)}
        onToday={goToday}
      />

      <Card id="week-totals" size="sm">
        <CardContent className="grid gap-2">
          <div className="wp-totals">
            <div className="wp-total">
              <span className="wp-total-label">{t("totalPlanned")}</span>
              <span className="wp-total-value" id="total-planned">
                {money(total.planned)}
              </span>
            </div>
            <div className="wp-total">
              <span className="wp-total-label">{t("totalSpent")}</span>
              <span className="wp-total-value" id="total-spent">
                {money(total.spent)}
              </span>
            </div>
            <div className={"wp-total " + (total.over ? "wp-total-over" : "")}>
              <span className="wp-total-label">{total.over ? t("totalOver") : t("totalRemaining")}</span>
              <span className="wp-total-value" id="total-remaining">
                {money(Math.abs(total.remaining))}
              </span>
            </div>
          </div>
          <div className="wp-rail" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(total.ratio * 100)} aria-label={t("totalSpent")}>
            <div className="wp-rail-fill" data-over={total.over ? "true" : "false"} style={{ width: `${Math.round(total.ratio * 100)}%` }} />
          </div>
        </CardContent>
      </Card>

      <Card id="categories" size="sm">
        <CardHeader className="grid-cols-[1fr_auto]">
          <CardTitle>{t("categoriesTitle")}</CardTitle>
          <button type="button" className="wp-btn wp-btn-quiet" id="add-category" onClick={() => setCatDialog({ open: true, id: null })}>
            <Plus className="size-4" aria-hidden />
            {t("addCategory")}
          </button>
        </CardHeader>
        <CardContent className="grid gap-2">
          {sortedShown.length === 0 ? (
            <div className="wp-empty" id="categories-empty">
              <p className="wp-empty-title">{t("noCategoriesTitle")}</p>
              <p className="wp-hint">{t("noCategoriesBody")}</p>
            </div>
          ) : (
            <div className="grid gap-2" id="category-list">
              {sortedShown.map((c) => (
                <CategoryCard key={c.id} cat={c} sum={summaries.get(c.id)!} money={money} t={t} onEdit={() => setCatDialog({ open: true, id: c.id })} />
              ))}
            </div>
          )}
          {archived.length > 0 && (
            <button type="button" className="wp-btn wp-btn-quiet" id="toggle-archived" onClick={() => setShowArchived((v) => !v)}>
              {showArchived ? t("hideArchived") : t("showArchived", { n: archived.length })}
            </button>
          )}
        </CardContent>
      </Card>

      <Card id="quick-expense" size="sm">
        <CardHeader>
          <CardTitle>{t("quickExpense")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              addExpense();
            }}
          >
            <div>
              <label className="wp-field-label" htmlFor="amount">
                {t("amountLabel")}
              </label>
              <div className="wp-amount-wrap">
                <span className="wp-amount-sym" aria-hidden>
                  {symbol}
                </span>
                <input
                  id="amount"
                  className="wp-input wp-amount"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  enterKeyHint="done"
                  placeholder={t("amountPlaceholder")}
                  aria-label={t("amountLabel")}
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (formError) setFormError("");
                  }}
                />
              </div>
            </div>
            <div>
              <label className="wp-field-label" htmlFor="category">
                {t("categoryLabel")}
              </label>
              <select id="category" className="wp-select-block" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} disabled={live.length === 0}>
                {live.length === 0 && <option value="">{t("needCategory")}</option>}
                {live.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="wp-two">
              <div>
                <label className="wp-field-label" htmlFor="note">
                  {t("noteLabel")}
                </label>
                <input
                  id="note"
                  className="wp-input"
                  type="text"
                  autoComplete="off"
                  maxLength={140}
                  placeholder={t("notePlaceholder")}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              <div>
                <label className="wp-field-label" htmlFor="date">
                  {t("dateLabel")}
                </label>
                <input id="date" className="wp-input" type="date" min={week.start} max={week.end} value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>
            {formError && (
              <p className="wp-error" role="alert" id="form-error">
                {formError}
              </p>
            )}
            <button type="submit" className="wp-btn wp-btn-primary" id="add-expense">
              <Plus className="size-5" aria-hidden />
              {t("addExpense")}
            </button>
          </form>
        </CardContent>
      </Card>

      <Card id="expenses" size="sm">
        <CardHeader>
          <CardTitle>{t("expensesTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="wp-hint" id="expenses-empty">
              {t("noExpenses")}
            </p>
          ) : (
            <ul className="wp-exp-list" id="expense-list">
              {list.map((e) => {
                const c = catById.get(e.categoryId);
                const ms = parseDate(e.date);
                return (
                  <li key={e.id}>
                    <button
                      type="button"
                      className="wp-exp"
                      data-expense={e.id}
                      aria-label={`${t("editExpense")}: ${money(e.amount)} ${c?.name ?? ""}`}
                      style={{ "--wp-cat-color": c?.color ?? "#0d9488" } as React.CSSProperties}
                      onClick={() => setExpDialog({ open: true, id: e.id })}
                    >
                      <span className="wp-exp-date" aria-hidden>
                        <span className="wp-exp-date-name">{ms === null ? "" : dayNameFmt.format(new Date(ms))}</span>
                        <span className="wp-exp-date-num">{Number(e.date.slice(-2))}</span>
                      </span>
                      <span className="wp-exp-main">
                        <span className="wp-exp-cat">
                          <span className="wp-exp-swatch" aria-hidden />
                          {c?.name ?? t("unknownCategory")}
                        </span>
                        {e.note && <span className="wp-exp-note">{e.note}</span>}
                      </span>
                      <span className="wp-exp-amount">{money(e.amount)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card id="settings" size="sm">
        <CardHeader>
          <CardTitle>{t("settingsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div>
            <label className="wp-field-label" htmlFor="currency">
              {t("currencyLabel")}
            </label>
            <select
              id="currency"
              className="wp-select-block"
              value={prefs.currency}
              onChange={(e) => commitPrefs({ ...prefs, currency: e.target.value, currencySymbol: undefined })}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol} {c.code}
                </option>
              ))}
            </select>
            <p className="wp-hint mt-1">{t("currencyHint")}</p>
          </div>
          <div className="wp-setting-row">
            <span className="wp-field-label m-0" id="week-start-label">
              {t("weekStartLabel")}
            </span>
            <div className="wp-seg" role="group" aria-labelledby="week-start-label" id="week-start">
              {([1, 0] as WeekStartsOn[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  className="wp-seg-btn"
                  id={`week-start-${d}`}
                  aria-pressed={prefs.weekStartsOn === d}
                  onClick={() => commitPrefs({ ...prefs, weekStartsOn: d, lastSeenWeek: weekStartOf(today, d) })}
                >
                  {d === 1 ? t("weekStartMon") : t("weekStartSun")}
                </button>
              ))}
            </div>
          </div>
          <div className="wp-setting-row">
            <span className="wp-field-label m-0" id="font-size-label">
              {t("fontSizeLabel")}
            </span>
            <div className="wp-seg" role="group" aria-labelledby="font-size-label" id="font-sizes">
              {FONT_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  className="wp-seg-btn"
                  id={`font-${size}`}
                  aria-pressed={prefs.fontSize === size}
                  onClick={() => commitPrefs({ ...prefs, fontSize: size })}
                >
                  {t(FONT_LABEL[size])}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <BackupCard
        t={t}
        hasData={hasData}
        onExportJson={exportJson}
        onExportCsv={exportCsv}
        onImportFile={(f) => void importFile(f)}
        onClearAll={() => setConfirm({ kind: "clearAll" })}
      />

      <div className="flex flex-wrap gap-[0.3rem]" id="promise-chips">
        {CHIP_KEYS.map((key) => (
          <span key={key} className="wp-promise">
            {t(key)}
          </span>
        ))}
      </div>

      <p className="wp-hint" id="about-text">
        {t("about")}
      </p>

      <footer className="flex flex-wrap justify-center gap-3 px-0 pt-1 pb-2 text-[0.8em] text-ink-muted">
        <a id="link-privacy" href={`https://try-dabble.com/${lang}/privacy`}>
          {t("privacy")}
        </a>
        <a id="link-terms" href={`https://try-dabble.com/${lang}/terms`}>
          {t("terms")}
        </a>
        <a id="link-guide" href={`https://try-dabble.com/${lang}/guides/weekpad`}>
          {t("guide")}
        </a>
        <a id="link-hub" href={`https://try-dabble.com/${lang}`}>
          try-dabble.com
        </a>
      </footer>

      <Toast message={toastMsg} visible={toastOn} />

      <CategoryDialog
        open={catDialog.open}
        category={editingCat}
        expenseCount={editingCat ? expenses.filter((e) => e.categoryId === editingCat.id).length : 0}
        currencySymbol={symbol}
        t={t}
        onOpenChange={(open) => setCatDialog((d) => ({ ...d, open }))}
        onSave={saveCategory}
        onDelete={() => {
          if (!catDialog.id) return;
          setCatDialog({ open: false, id: catDialog.id });
          setConfirm({ kind: "deleteCategory", id: catDialog.id });
        }}
      />

      <ExpenseDialog
        open={expDialog.open}
        expense={editingExp}
        categories={categories}
        currencySymbol={symbol}
        t={t}
        onOpenChange={(open) => setExpDialog((d) => ({ ...d, open }))}
        onSave={saveExpense}
        onDelete={() => {
          if (!expDialog.id) return;
          setExpDialog({ open: false, id: expDialog.id });
          setConfirm({ kind: "deleteExpense", id: expDialog.id });
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
            case "deleteCategory":
              deleteCategory(confirm.id);
              break;
            case "deleteExpense":
              deleteExpense(confirm.id);
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
