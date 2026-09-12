import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { Pencil, Play, Plus, Star, Tags, Trash2 } from "lucide-react";

import { AffirmationDialog, type AffirmationDraft } from "@/components/affirmation-dialog";
import { BackupCard } from "@/components/backup-card";
import { CategoryDialog } from "@/components/category-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { PracticeCard } from "@/components/practice-card";
import { Toast } from "@/components/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { backupFilename, buildBackup, download, parseBackup, toJSON } from "@/lib/backup";
import { HTML_LANG, OG_IMAGE, detectLang, isLang, rememberLang, translate, type Lang, type MsgKey } from "@/lib/i18n";
import { loadSession, neighbour, reset as resetSession, saveSession, select as selectSession, tap as tapSession, undo as undoSession, type Session } from "@/lib/practice";
import { FONT_SIZES, clampGoal, loadPrefs, savePrefs, todayStr, type FontSize, type Prefs } from "@/lib/prefs";
import { buzz, click } from "@/lib/sound";
import {
  applyFilter,
  bumpPracticeCount,
  clearStore,
  isFirstOpen,
  loadAffirmations,
  loadCategories,
  reconcile,
  removeAffirmation,
  removeCategory,
  saveAffirmations,
  saveCategories,
  seedData,
  toggleFavorite,
  upsertAffirmation,
  upsertCategory,
  type Affirmation,
  type Category,
  type Filter,
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

const CHIP_KEYS: MsgKey[] = ["chipNoTrap", "chipNoCancelWall", "chipCategoriesFree", "chipNoAdsPractice", "chipFree", "chipLocal", "chipLangs"];
const FONT_LABEL: Record<FontSize, MsgKey> = { md: "fontMd", lg: "fontLg", xl: "fontXl" };
const TOAST_MS = 2200;
const THEME_COLOR = { light: "#faf7f2", dark: "#1c1a2e" };

type Confirm =
  | { kind: "deleteAffirmation"; id: string }
  | { kind: "deleteCategory"; id: string }
  | { kind: "import"; parsed: ReturnType<typeof parseBackup> }
  | { kind: "clearAll" };

/** First open on this device: a few starter lines in the reader's language. */
function initialData(lang: Lang): { affirmations: Affirmation[]; categories: Category[] } {
  if (isFirstOpen()) {
    const seed = seedData(lang);
    saveCategories(seed.categories);
    saveAffirmations(seed.affirmations);
    return seed;
  }
  const categories = loadCategories();
  return { categories, affirmations: reconcile(loadAffirmations(), categories) };
}

function Home() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  const lang = useMemo(() => detectLang(search.lang ?? null), [search.lang]);
  const t = useCallback(
    (key: MsgKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );

  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs());
  const [data, setData] = useState(() => initialData(lang));
  const { affirmations, categories } = data;
  const [session, setSession] = useState<Session>(() => loadSession());
  const [filter, setFilter] = useState<Filter>("all");

  const [affDialog, setAffDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [goalText, setGoalText] = useState(String(prefs.dailyGoal));

  const [fullscreen, setFullscreen] = useState(false);
  const [immersive, setImmersive] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);

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
    document.querySelector('link[rel="manifest"]')?.setAttribute("href", `/manifest.webmanifest?lang=${lang}`);
  }, [lang, t]);

  // Dark mode lives on <html> so the body wash and dialogs follow too.
  useEffect(() => {
    document.documentElement.dataset.theme = prefs.darkMode ? "dark" : "light";
    setMetaContent('meta[name="theme-color"]', prefs.darkMode ? THEME_COLOR.dark : THEME_COLOR.light);
  }, [prefs.darkMode]);

  const commitPrefs = useCallback((next: Prefs) => {
    setPrefs(next);
    savePrefs(next);
  }, []);
  const commitData = useCallback((next: { affirmations: Affirmation[]; categories: Category[] }) => {
    setData(next);
    saveAffirmations(next.affirmations);
    saveCategories(next.categories);
  }, []);
  const commitSession = useCallback((next: Session) => {
    setSession(next);
    saveSession(next);
  }, []);

  // ---- derived -----------------------------------------------------------
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of affirmations) if (a.categoryId) m.set(a.categoryId, (m.get(a.categoryId) ?? 0) + 1);
    return m;
  }, [affirmations]);
  const shown = useMemo(() => applyFilter(affirmations, filter), [affirmations, filter]);
  const shownIds = useMemo(() => shown.map((a) => a.id), [shown]);
  const current = session.affirmationId ? (affirmations.find((a) => a.id === session.affirmationId) ?? null) : null;
  const currentCat = current?.categoryId ? (catById.get(current.categoryId) ?? null) : null;
  const favCount = affirmations.filter((a) => a.favorite).length;

  // A deleted or imported-away line must not stay "selected".
  useEffect(() => {
    if (session.affirmationId && !current) commitSession({ affirmationId: null, taps: 0 });
  }, [session.affirmationId, current, commitSession]);

  // A filter that no longer matches anything (e.g. its topic was deleted) falls back to All.
  useEffect(() => {
    if (typeof filter === "object" && !catById.has(filter.categoryId)) setFilter("all");
  }, [filter, catById]);

  // ---- practice ----------------------------------------------------------
  function feedback(kind: "tap" | "undo") {
    if (prefs.soundEnabled) click(kind);
    if (prefs.vibeEnabled) buzz(kind === "tap" ? 10 : 20);
  }

  function onTap() {
    if (!current) return;
    const next = tapSession(session);
    if (next.taps === session.taps) return;
    commitSession(next);
    const today = todayStr();
    const bumped = { affirmations: bumpPracticeCount(affirmations, current.id, 1), categories };
    commitData(bumped);
    if (prefs.lastPracticedDate !== today) commitPrefs({ ...prefs, lastPracticedDate: today });
    feedback("tap");
  }
  function onUndo() {
    if (!current || session.taps === 0) return;
    commitSession(undoSession(session));
    commitData({ affirmations: bumpPracticeCount(affirmations, current.id, -1), categories });
    feedback("undo");
  }
  function onReset() {
    commitSession(resetSession(session));
  }
  function practise(id: string) {
    commitSession(selectSession(session, id));
    stageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function step(dir: 1 | -1) {
    const ids = shownIds.length > 0 ? shownIds : affirmations.map((a) => a.id);
    const next = neighbour(ids, session.affirmationId, dir);
    if (next) commitSession(selectSession(session, next));
  }

  // ---- fullscreen ----------------------------------------------------------
  useEffect(() => {
    const sync = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  // Escape leaves the CSS fallback the way it leaves the real thing.
  useEffect(() => {
    if (!immersive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setImmersive(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [immersive]);
  useEffect(() => {
    document.documentElement.style.overflow = immersive ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [immersive]);

  async function toggleFullscreen() {
    if (fullscreen && document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        setFullscreen(false);
      }
      return;
    }
    if (immersive) {
      setImmersive(false);
      return;
    }
    const el = stageRef.current;
    if (el && typeof el.requestFullscreen === "function") {
      try {
        await el.requestFullscreen({ navigationUI: "hide" });
        return;
      } catch {
        /* denied (iframe, iOS Safari on phones): fall through to CSS */
      }
    }
    setImmersive(true);
  }

  // ---- affirmations ----------------------------------------------------------
  function saveAffirmation(draft: AffirmationDraft) {
    const { list, id } = upsertAffirmation(affirmations, { id: affDialog.id, text: draft.text, categoryId: draft.categoryId });
    commitData({ affirmations: list, categories });
    if (!current) commitSession(selectSession(session, id));
    showToast(t("affirmationSaved"));
  }
  function deleteAffirmation(id: string) {
    commitData({ affirmations: removeAffirmation(affirmations, id), categories });
    if (session.affirmationId === id) commitSession({ affirmationId: null, taps: 0 });
    showToast(t("affirmationDeleted"));
  }
  function star(id: string) {
    commitData({ affirmations: toggleFavorite(affirmations, id), categories });
  }

  // ---- categories --------------------------------------------------------
  function saveCategory(draft: { id: string | null; name: string }) {
    const { list } = upsertCategory(categories, draft);
    commitData({ affirmations, categories: list });
    showToast(t("categorySaved"));
  }
  function deleteCategory(id: string) {
    const next = removeCategory(categories, affirmations, id);
    commitData(next);
    showToast(t("categoryDeleted"));
  }

  // ---- settings ----------------------------------------------------------
  function commitGoal(raw: string) {
    const goal = clampGoal(raw === "" ? undefined : raw);
    setGoalText(String(goal));
    if (goal !== prefs.dailyGoal) commitPrefs({ ...prefs, dailyGoal: goal });
  }

  // ---- backup ------------------------------------------------------------
  function exportJson() {
    download(toJSON(buildBackup(affirmations, categories, prefs)), backupFilename(), "application/json");
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
    if (affirmations.length === 0 && categories.length === 0) applyImport(parsed);
    else setConfirm({ kind: "import", parsed });
  }
  function applyImport(parsed: ReturnType<typeof parseBackup>) {
    commitData({ affirmations: parsed.affirmations, categories: parsed.categories });
    if (parsed.prefs) {
      const next = { ...parsed.prefs, lastPracticedDate: prefs.lastPracticedDate };
      commitPrefs(next);
      setGoalText(String(next.dailyGoal));
    }
    setFilter("all");
    showToast(t("importOk", { a: parsed.affirmations.length, c: parsed.categories.length }));
  }
  function clearAll() {
    clearStore();
    setData({ affirmations: [], categories: [] });
    commitSession({ affirmationId: null, taps: 0 });
    setFilter("all");
    showToast(t("cleared"));
  }

  const editingAff = affDialog.id ? (affirmations.find((a) => a.id === affDialog.id) ?? null) : null;
  const hasData = affirmations.length > 0 || categories.length > 0;
  const defaultCategoryId = typeof filter === "object" ? filter.categoryId : "";

  const confirmText = (() => {
    if (!confirm) return { title: "", body: "", ok: "" };
    switch (confirm.kind) {
      case "deleteAffirmation":
        return { title: t("deleteAffirmationTitle"), body: t("deleteAffirmationBody"), ok: t("delete") };
      case "deleteCategory": {
        const c = catById.get(confirm.id);
        return { title: t("deleteCategoryTitle", { name: c?.name ?? "" }), body: t("deleteCategoryBody", { count: counts.get(confirm.id) ?? 0 }), ok: t("delete") };
      }
      case "import":
        return { title: t("importConfirmTitle"), body: t("importConfirmBody"), ok: t("importJson") };
      case "clearAll":
        return { title: t("clearAllTitle"), body: t("clearAllBody"), ok: t("delete") };
    }
  })();

  const emptyList = (() => {
    if (affirmations.length === 0) return { title: t("noAffirmationsTitle"), body: t("noAffirmationsBody") };
    if (filter === "fav") return { title: t("noFavoritesTitle"), body: t("noFavoritesBody") };
    return { title: t("noInCategory"), body: "" };
  })();

  return (
    <div className="ap-app" data-size={prefs.fontSize} data-dark={prefs.darkMode ? "true" : "false"}>
      <LocalOnlyBanner text={t("localOnly")} />
      <Masthead
        t={t}
        lang={lang}
        darkMode={prefs.darkMode}
        soundEnabled={prefs.soundEnabled}
        vibeEnabled={prefs.vibeEnabled}
        onLangChange={(nextLang) => {
          rememberLang(nextLang);
          navigate({ search: (prev) => ({ ...prev, lang: nextLang }), replace: true });
        }}
        onToggleDark={() => commitPrefs({ ...prefs, darkMode: !prefs.darkMode })}
        onToggleSound={() => {
          const next = !prefs.soundEnabled;
          commitPrefs({ ...prefs, soundEnabled: next });
          if (next) click("tap");
        }}
        onToggleVibe={() => {
          const next = !prefs.vibeEnabled;
          commitPrefs({ ...prefs, vibeEnabled: next });
          if (next) buzz(10);
        }}
      />

      <PracticeCard
        ref={stageRef}
        t={t}
        affirmation={current}
        category={currentCat}
        taps={session.taps}
        goal={prefs.dailyGoal}
        immersive={immersive}
        fullscreen={fullscreen}
        canNavigate={affirmations.length > 1}
        onTap={onTap}
        onUndo={onUndo}
        onReset={onReset}
        onPrev={() => step(-1)}
        onNext={() => step(1)}
        onToggleFullscreen={() => void toggleFullscreen()}
      />

      <Card id="affirmations" size="sm">
        <CardHeader className="grid-cols-[1fr_auto]">
          <CardTitle>{t("listTitle")}</CardTitle>
          <button type="button" className="ap-btn ap-btn-quiet" id="manage-categories" onClick={() => setCatDialogOpen(true)}>
            <Tags className="size-4" aria-hidden />
            {t("manageCategories")}
          </button>
        </CardHeader>
        <CardContent className="grid gap-2">
          <div className="ap-filters" id="filters" role="group" aria-label={t("categoriesTitle")}>
            <button type="button" className="ap-chip" id="filter-all" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
              {t("filterAll")} · {affirmations.length}
            </button>
            <button type="button" className="ap-chip" id="filter-fav" aria-pressed={filter === "fav"} onClick={() => setFilter("fav")}>
              <Star className="size-4" aria-hidden />
              {t("filterFavorites")} · {favCount}
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                className="ap-chip"
                data-role="filter-category"
                aria-pressed={typeof filter === "object" && filter.categoryId === c.id}
                style={{ ["--ap-cat-color" as string]: c.color ?? "#a78bfa" }}
                onClick={() => setFilter({ categoryId: c.id })}
              >
                <span className="ap-chip-dot" aria-hidden />
                {c.name} · {counts.get(c.id) ?? 0}
              </button>
            ))}
          </div>

          {shown.length === 0 ? (
            <div className="ap-empty" id="list-empty">
              <p className="ap-empty-title">{emptyList.title}</p>
              {emptyList.body && <p className="ap-hint">{emptyList.body}</p>}
            </div>
          ) : (
            <ul className="ap-list" id="affirmation-list">
              {shown.map((a) => {
                const c = a.categoryId ? catById.get(a.categoryId) : undefined;
                const active = a.id === session.affirmationId;
                return (
                  <li key={a.id} className="ap-row" data-active={active ? "true" : "false"} data-id={a.id} style={{ ["--ap-cat-color" as string]: c?.color ?? "var(--ap-line-2)" }}>
                    <button type="button" className="ap-star" data-role="favorite" aria-pressed={a.favorite} aria-label={a.favorite ? t("unfavorite") : t("favorite")} onClick={() => star(a.id)}>
                      <Star className="size-5" fill={a.favorite ? "currentColor" : "none"} aria-hidden />
                    </button>
                    <button type="button" className="ap-row-main" data-role="practice" aria-label={`${t("practiceThis")}: ${a.text}`} onClick={() => practise(a.id)}>
                      <p className="ap-row-text">{a.text}</p>
                      <span className="ap-row-meta">
                        {c && (
                          <span className="ap-badge">
                            <span className="ap-badge-dot" aria-hidden />
                            {c.name}
                          </span>
                        )}
                        {(a.practiceCount ?? 0) > 0 && <span>{t("practicedTimes", { n: a.practiceCount ?? 0 })}</span>}
                        {active && <Play className="size-3.5 text-lav-deep" aria-hidden />}
                      </span>
                    </button>
                    <span className="ap-row-actions">
                      <button type="button" className="ap-btn ap-btn-icon" data-role="edit" aria-label={`${t("edit")}: ${a.text}`} onClick={() => setAffDialog({ open: true, id: a.id })}>
                        <Pencil className="size-4" aria-hidden />
                      </button>
                      <button type="button" className="ap-btn ap-btn-icon" data-role="delete" aria-label={`${t("delete")}: ${a.text}`} onClick={() => setConfirm({ kind: "deleteAffirmation", id: a.id })}>
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <button type="button" className="ap-btn ap-btn-primary" id="add-affirmation" onClick={() => setAffDialog({ open: true, id: null })}>
            <Plus className="size-4" aria-hidden />
            {t("addAffirmation")}
          </button>
        </CardContent>
      </Card>

      <Card id="settings" size="sm">
        <CardHeader>
          <CardTitle>{t("settingsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="ap-setting-row">
            <div className="ap-toggle-text">
              <label className="ap-toggle-label" htmlFor="daily-goal">
                {t("dailyGoalLabel")}
              </label>
              <span className="ap-toggle-hint">{t("dailyGoalHint")}</span>
            </div>
            <input
              id="daily-goal"
              className="ap-input ap-goal-input"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              enterKeyHint="done"
              value={goalText}
              onChange={(e) => setGoalText(e.target.value.replace(/[^\d]/g, "").slice(0, 3))}
              onBlur={(e) => commitGoal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
            />
          </div>
          <div className="ap-setting-row">
            <span className="ap-toggle-label">{t("fontSize")}</span>
            <div className="ap-seg" role="group" aria-label={t("fontSize")} id="font-size">
              {FONT_SIZES.map((size) => (
                <button key={size} type="button" className="ap-seg-btn" aria-pressed={prefs.fontSize === size} onClick={() => commitPrefs({ ...prefs, fontSize: size })}>
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
          <span key={key} className="ap-promise">
            {t(key)}
          </span>
        ))}
      </div>

      <p className="ap-hint" id="about-text">
        {t("about")}
      </p>

      <footer className="ap-footer">
        <a id="link-privacy" href={`https://try-dabble.com/${lang}/privacy`}>
          {t("privacy")}
        </a>
        <a id="link-terms" href={`https://try-dabble.com/${lang}/terms`}>
          {t("terms")}
        </a>
        <a id="link-guide" href={`https://try-dabble.com/${lang}/guides/affirmpad`}>
          {t("guide")}
        </a>
        <a id="link-hub" href={`https://try-dabble.com/${lang}`}>
          try-dabble.com
        </a>
      </footer>

      <AffirmationDialog
        open={affDialog.open}
        affirmation={editingAff}
        categories={categories}
        defaultCategoryId={defaultCategoryId}
        t={t}
        onOpenChange={(open) => setAffDialog((d) => ({ ...d, open }))}
        onSave={saveAffirmation}
        onDelete={() => {
          if (!affDialog.id) return;
          setAffDialog({ open: false, id: null });
          setConfirm({ kind: "deleteAffirmation", id: affDialog.id });
        }}
      />
      <CategoryDialog
        open={catDialogOpen}
        categories={categories}
        counts={counts}
        t={t}
        onOpenChange={setCatDialogOpen}
        onSave={saveCategory}
        onDelete={(id) => {
          setCatDialogOpen(false);
          setConfirm({ kind: "deleteCategory", id });
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
            case "deleteAffirmation":
              deleteAffirmation(confirm.id);
              break;
            case "deleteCategory":
              deleteCategory(confirm.id);
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
