import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { Clock, CookingPot, LayoutGrid, Link2, Plus, Rows3, Search } from "lucide-react";

import { BackupCard } from "@/components/backup-card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { RecipeDetail } from "@/components/recipe-detail";
import { RecipeForm } from "@/components/recipe-form";
import { ShoppingCard } from "@/components/shopping-card";
import { Toast } from "@/components/toast";
import { Card, CardContent } from "@/components/ui/card";
import { download } from "@/lib/download";
import { HTML_LANG, OG_IMAGE, detectLang, isLang, rememberLang, translate, type Lang, type MsgKey } from "@/lib/i18n";
import { clearPhotos, deletePhoto, loadAllPhotos, putPhoto } from "@/lib/photo-store";
import { FONT_SIZES, loadPrefs, savePrefs, type FontSize, type Prefs } from "@/lib/prefs";
import {
  backupFilename,
  exportPayload,
  loadRecipes,
  mergeRecipes,
  parseImport,
  removeRecipe,
  saveRecipes,
  searchRecipes,
  sortRecipes,
  totalMinutes,
  upsertRecipe,
  type Recipe,
  type ShoppingList,
} from "@/lib/recipes";
import { addShoppingItems, loadShopping, removeChecked, saveShopping, shoppingAsText, toggleShoppingItem } from "@/lib/shopping";
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

const CHIP_KEYS: MsgKey[] = ["chipNoWipe", "chipNoCatalog", "chipNoAds", "chipManual", "chipFree", "chipLocal", "chipLangs"];
const FONT_LABEL: Record<FontSize, MsgKey> = { md: "fontMd", lg: "fontLg", xl: "fontXl" };
const TOAST_MS = 2400;

type Confirm = { kind: "delete"; recipe: Recipe } | { kind: "clear" } | null;

function Home() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  const lang = useMemo(() => detectLang(search.lang ?? null), [search.lang]);
  const t = useCallback(
    (key: MsgKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );

  const [recipes, setRecipes] = useState<Recipe[]>(() => loadRecipes());
  const [shopping, setShopping] = useState<ShoppingList>(() => loadShopping());
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs());
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<{ open: boolean; recipe: Recipe | null; urlFirst: boolean }>({ open: false, recipe: null, urlFirst: false });
  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const toastTimer = useRef<number | undefined>(undefined);
  const photosInLocal = useRef(false);

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
    document.querySelector('link[rel="manifest"]')?.setAttribute("href", `/manifest.webmanifest?lang=${lang}`);
  }, [lang, t]);

  // Photos live in IndexedDB beside the list; attach them once on mount.
  useEffect(() => {
    let cancelled = false;
    void loadAllPhotos().then((photos) => {
      if (cancelled || photos.size === 0) return;
      setRecipes((cur) => cur.map((r) => (photos.has(r.id) && !r.photoDataUrl ? { ...r, photoDataUrl: photos.get(r.id) } : r)));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const commitPrefs = useCallback((next: Prefs) => {
    setPrefs(next);
    savePrefs(next);
  }, []);

  const commitShopping = useCallback((next: ShoppingList) => {
    setShopping(next);
    saveShopping(next);
  }, []);

  /**
   * Persist the list (photos stripped) plus each changed photo. If IndexedDB
   * refuses, keep the photos inside the list in localStorage instead.
   */
  const persist = useCallback(async (next: Recipe[], changed: Recipe[], removedIds: string[] = []) => {
    setRecipes(next);
    saveRecipes(next, photosInLocal.current);
    for (const id of removedIds) void deletePhoto(id);
    for (const r of changed) {
      if (r.photoDataUrl) {
        const ok = await putPhoto(r.id, r.photoDataUrl);
        if (!ok && !photosInLocal.current) {
          photosInLocal.current = true;
          saveRecipes(next, true);
        }
      } else {
        void deletePhoto(r.id);
      }
    }
  }, []);

  function handleSave(recipe: Recipe) {
    void persist(sortRecipes(upsertRecipe(recipes, recipe)), [recipe]);
    setForm({ open: false, recipe: null, urlFirst: false });
    setDetailId(recipe.id);
    showToast(t("saved"));
  }

  function handleDelete(recipe: Recipe) {
    void persist(removeRecipe(recipes, recipe.id), [], [recipe.id]);
    setDetailId(null);
    showToast(t("deleted"));
  }

  function handleClearAll() {
    void clearPhotos();
    void persist([], [], []);
    commitShopping({ items: [] });
    setDetailId(null);
    showToast(t("cleared"));
  }

  function handleExport() {
    if (recipes.length === 0) {
      showToast(t("exportEmpty"));
      return;
    }
    download(`${JSON.stringify(exportPayload(recipes, shopping), null, 2)}\n`, backupFilename(), "application/json");
    showToast(t("exportDone"));
  }

  async function handleImport(file: File) {
    try {
      const text = await file.text();
      const { recipes: incoming, shopping: incomingShop } = parseImport(text);
      await persist(mergeRecipes(recipes, incoming), incoming);
      if (incomingShop.items.length > 0) {
        commitShopping(addShoppingItems(shopping, incomingShop.items.map((i) => i.text)).list);
      }
      showToast(t("importDone", { n: incoming.length }));
    } catch {
      showToast(t("importFail"));
    }
  }

  function handleAddShopping(recipe: Recipe, lines: string[]) {
    const { list, added } = addShoppingItems(shopping, lines, recipe.id);
    commitShopping(list);
    showToast(t("shoppingAdded", { n: added }));
  }

  async function handleCopyShopping() {
    try {
      await navigator.clipboard.writeText(shoppingAsText(shopping));
      showToast(t("shoppingCopied"));
    } catch {
      /* clipboard blocked: nothing to say */
    }
  }

  const visible = useMemo(() => searchRecipes(recipes, query), [recipes, query]);
  const detail = detailId ? recipes.find((r) => r.id === detailId) ?? null : null;

  return (
    <div className="rl-app" data-size={prefs.fontSize}>
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

      <div className="rl-toolbar" id="toolbar">
        <div className="rl-search-wrap">
          <Search aria-hidden />
          <label className="sr-only" htmlFor="search">
            {t("searchLabel")}
          </label>
          <input
            id="search"
            className="rl-search"
            type="search"
            autoComplete="off"
            enterKeyHint="search"
            placeholder={t("searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="rl-actions">
          <button type="button" className="rl-btn" id="add-recipe" onClick={() => setForm({ open: true, recipe: null, urlFirst: false })}>
            <Plus className="size-5" aria-hidden />
            {t("addRecipe")}
          </button>
          <button type="button" className="rl-btn rl-btn-sage" id="from-url" onClick={() => setForm({ open: true, recipe: null, urlFirst: true })}>
            <Link2 className="size-5" aria-hidden />
            {t("fromUrl")}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[0.8em] font-bold text-ink-muted" id="recipe-count">
          {t("recipesCount", { n: visible.length })}
        </span>
        <div className="rl-sizes" role="group" id="view-toggle">
          <button type="button" className="rl-size" id="view-grid" aria-pressed={prefs.view === "grid"} aria-label="grid" onClick={() => commitPrefs({ ...prefs, view: "grid" })}>
            <LayoutGrid className="size-4" aria-hidden />
          </button>
          <button type="button" className="rl-size" id="view-list" aria-pressed={prefs.view === "list"} aria-label="list" onClick={() => commitPrefs({ ...prefs, view: "list" })}>
            <Rows3 className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      {recipes.length === 0 ? (
        <Card id="empty-state">
          <CardContent className="rl-empty">
            <CookingPot aria-hidden />
            <p className="rl-empty-title">{t("emptyTitle")}</p>
            <p className="rl-empty-body">{t("emptyBody")}</p>
          </CardContent>
        </Card>
      ) : visible.length === 0 ? (
        <Card id="no-match">
          <CardContent className="rl-empty">
            <p className="rl-empty-body">{t("searchNoMatch")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rl-grid" id="recipe-grid" data-view={prefs.view}>
          {visible.map((r) => {
            const total = totalMinutes(r);
            return (
              <button type="button" key={r.id} className="rl-recipe" data-recipe-id={r.id} onClick={() => setDetailId(r.id)}>
                {r.photoDataUrl ? (
                  <img className="rl-photo" src={r.photoDataUrl} alt="" loading="lazy" />
                ) : (
                  <span className="rl-photo rl-photo-empty" aria-hidden>
                    <CookingPot />
                  </span>
                )}
                <span className="rl-recipe-body">
                  <span className="rl-recipe-title">{r.title}</span>
                  {(total !== undefined || r.servingsBase) && (
                    <span className="rl-meta">
                      {total !== undefined && (
                        <span className="rl-time">
                          <Clock aria-hidden />
                          {t("totalShort", { n: total })}
                        </span>
                      )}
                      {r.servingsBase !== undefined && <span>{t("servingsValue", { n: r.servingsBase })}</span>}
                    </span>
                  )}
                  {r.tags.length > 0 && (
                    <span className="rl-tags">
                      {r.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="rl-tag">
                          {tag}
                        </span>
                      ))}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <ShoppingCard
        list={shopping}
        t={t}
        onToggle={(i) => commitShopping(toggleShoppingItem(shopping, i))}
        onAdd={(text) => commitShopping(addShoppingItems(shopping, [text]).list)}
        onRemoveChecked={() => commitShopping(removeChecked(shopping))}
        onClearAll={() => commitShopping({ items: [] })}
        onCopy={() => void handleCopyShopping()}
      />

      <BackupCard t={t} count={recipes.length} onExport={handleExport} onImportFile={(f) => void handleImport(f)} onClearAll={() => setConfirm({ kind: "clear" })} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rl-label m-0" id="font-size-label">
          {t("fontSizeLabel")}
        </span>
        <div className="rl-sizes" role="group" aria-labelledby="font-size-label" id="font-sizes">
          {FONT_SIZES.map((size) => (
            <button key={size} type="button" className="rl-size" id={`font-${size}`} aria-pressed={prefs.fontSize === size} onClick={() => commitPrefs({ ...prefs, fontSize: size })}>
              {t(FONT_LABEL[size])}
            </button>
          ))}
        </div>
      </div>

      <p className="m-0 text-[0.78em] leading-5 text-ink-muted" id="about-text">
        {t("about")}
      </p>

      <div className="flex flex-wrap gap-[0.3rem]" id="promise-chips">
        {CHIP_KEYS.map((key) => (
          <span key={key} className="rl-promise">
            {t(key)}
          </span>
        ))}
      </div>

      <footer className="flex flex-wrap justify-center gap-3 px-0 pt-1 pb-2 text-[0.8em] text-ink-muted">
        <a id="link-privacy" href={`https://try-dabble.com/${lang}/privacy`}>
          {t("privacy")}
        </a>
        <a id="link-terms" href={`https://try-dabble.com/${lang}/terms`}>
          {t("terms")}
        </a>
        <a id="link-guide" href={`https://try-dabble.com/${lang}/guides/recipelog`}>
          {t("guide")}
        </a>
        <a id="link-hub" href={`https://try-dabble.com/${lang}`}>
          try-dabble.com
        </a>
      </footer>

      <Toast message={toastMsg} visible={toastOn} />

      <RecipeForm
        open={form.open}
        initial={form.recipe}
        urlFirst={form.urlFirst}
        t={t}
        onOpenChange={(open) => {
          if (!open) setForm((f) => ({ ...f, open: false }));
        }}
        onSave={handleSave}
        onToast={showToast}
      />

      <RecipeDetail
        recipe={detail}
        open={detail !== null && !form.open}
        t={t}
        timerSec={prefs.cookTimerSec}
        onTimerSecChange={(sec) => commitPrefs({ ...prefs, cookTimerSec: sec })}
        onOpenChange={(open) => {
          if (!open) setDetailId(null);
        }}
        onEdit={(r) => setForm({ open: true, recipe: r, urlFirst: false })}
        onDelete={(r) => setConfirm({ kind: "delete", recipe: r })}
        onAddShopping={handleAddShopping}
      />

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.kind === "clear" ? t("clearConfirmTitle") : t("deleteConfirmTitle")}
        body={confirm?.kind === "clear" ? t("clearConfirmBody") : t("deleteConfirmBody")}
        confirmLabel={confirm?.kind === "clear" ? t("clearAll") : t("delete")}
        cancelLabel={t("cancel")}
        onConfirm={() => {
          if (confirm?.kind === "delete") handleDelete(confirm.recipe);
          else if (confirm?.kind === "clear") handleClearAll();
        }}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
      />
    </div>
  );
}
