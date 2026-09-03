import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { CheckCheck, Download, Upload } from "lucide-react";

import { AddItemDialog } from "@/components/add-item-dialog";
import { CheckRow } from "@/components/check-row";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EditItemDialog } from "@/components/edit-item-dialog";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { Toast } from "@/components/toast";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { downloadBackup, parseBackup } from "@/lib/backup-json";
import { localDayKey, msUntilMidnight, rollover, type DayState } from "@/lib/day";
import {
  HTML_LANG,
  OG_IMAGE,
  TIME_LOCALE,
  detectLang,
  isLang,
  rememberLang,
  translate,
  type Lang,
  type MsgKey,
} from "@/lib/i18n";
import {
  loadDayState,
  loadItems,
  moveItem,
  pruneChecks,
  saveDayState,
  saveItems,
  uid,
  type Item,
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

const DEFAULT_LABEL_KEY: Record<string, MsgKey> = {
  door: "defaultDoor",
  gas: "defaultGas",
  garage: "defaultGarage",
};

const CHIP_KEYS: MsgKey[] = [
  "chipNoLogin",
  "chipNoAds",
  "chipNoIap",
  "chipOneTap",
  "chipMidnight",
  "chipVibrate",
  "chipDefaults",
  "chipLocal",
];

const TOAST_MS = 2200;

/** Short pulse on check. Missing API, throw, or a denied call: silent no-op. */
function buzz() {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(25);
    }
  } catch {
    /* nothing to do */
  }
}

function Home() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  const lang = useMemo(() => detectLang(search.lang ?? null), [search.lang]);
  const t = useCallback(
    (key: MsgKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );

  const [items, setItems] = useState<Item[]>(() => loadItems());
  const [day, setDay] = useState<DayState>(() => loadDayState());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const toastTimer = useRef<number | undefined>(undefined);
  const jsonInput = useRef<HTMLInputElement>(null);

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

  /**
   * Midnight. Three triggers all run the same rollover: a timer aimed at the
   * next local 00:00:01, the tab coming back into view, and the window
   * regaining focus. A tab left open overnight clears without a reload.
   */
  const rollIfStale = useCallback(() => {
    const today = localDayKey();
    setDay((prev) => {
      const next = rollover(prev, today);
      if (next !== prev) {
        saveDayState(next);
        showToast(translate(lang, "toastNewDay"));
      }
      return next;
    });
  }, [lang, showToast]);

  useEffect(() => {
    let timer = window.setTimeout(function tick() {
      rollIfStale();
      timer = window.setTimeout(tick, msUntilMidnight());
    }, msUntilMidnight());
    const onVisible = () => {
      if (document.visibilityState === "visible") rollIfStale();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", rollIfStale);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", rollIfStale);
    };
  }, [rollIfStale]);

  const timeFmt = useMemo(
    () => new Intl.DateTimeFormat(TIME_LOCALE[lang], { hour: "numeric", minute: "2-digit" }),
    [lang],
  );

  const labelOf = useCallback(
    (item: Item): string => {
      if (item.label) return item.label;
      const key = DEFAULT_LABEL_KEY[item.id];
      return key ? t(key) : item.id;
    },
    [t],
  );

  const formatWhen = useCallback(
    (iso: string | undefined): string | null => {
      if (!iso) return null;
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return null;
      return timeFmt.format(d);
    },
    [timeFmt],
  );

  const commitItems = useCallback(
    (next: Item[]) => {
      setItems(next);
      saveItems(next);
      // Checks for rows that no longer exist must not linger in storage.
      setDay((prev) => {
        const pruned = pruneChecks(prev.checks, next.map((it) => it.id));
        if (Object.keys(pruned).length === Object.keys(prev.checks).length) return prev;
        const state = { day: prev.day, checks: pruned };
        saveDayState(state);
        return state;
      });
    },
    [],
  );

  function handleToggle(id: string) {
    const today = localDayKey();
    const base = rollover(day, today);
    const checks = { ...base.checks };
    const wasOn = Boolean(checks[id]);
    if (wasOn) {
      delete checks[id];
    } else {
      checks[id] = new Date().toISOString();
      buzz();
    }
    const next: DayState = { day: today, checks };
    setDay(next);
    saveDayState(next);
  }

  function handleAdd(label: string) {
    commitItems([...items, { id: uid(), label }]);
    showToast(t("toastAdded"));
  }

  function handleRename(id: string, label: string) {
    commitItems(items.map((it) => (it.id === id ? { ...it, label } : it)));
    showToast(t("toastRenamed"));
  }

  function handleMove(id: string, delta: number) {
    commitItems(moveItem(items, id, delta));
  }

  function handleExportJson() {
    downloadBackup(day.day, items, day.checks);
    showToast(t("toastExported"));
  }

  /**
   * A backup from another day brings its items back but not its checks: a
   * check only ever counts for the local day it was made on.
   */
  async function handleImportJson(file: File | null) {
    if (!file) return;
    let parsed: ReturnType<typeof parseBackup> = null;
    try {
      parsed = parseBackup(await file.text());
    } catch {
      parsed = null;
    }
    if (!parsed) {
      showToast(t("toastImportBad"));
      return;
    }
    const nextItems: Item[] = parsed.items.map((it) => ({ id: it.id, label: it.label }));
    const nextDay = rollover({ day: parsed.day, checks: parsed.checks }, localDayKey());
    setItems(nextItems);
    saveItems(nextItems);
    setDay(nextDay);
    saveDayState(nextDay);
    setEditingId(null);
    setPendingRemove(null);
    showToast(t("toastImported"));
  }

  function confirmRemove() {
    const id = pendingRemove;
    if (!id) return;
    commitItems(items.filter((it) => it.id !== id));
    setPendingRemove(null);
    setEditingId(null);
    showToast(t("toastRemoved"));
  }

  const doneCount = items.filter((it) => Boolean(day.checks[it.id])).length;
  // Most recent check of the day: the same text the inline script in
  // index.html painted into #checked-at before React mounted.
  const latestCheck = items.reduce<string | null>((best, it) => {
    const at = day.checks[it.id];
    if (!at || Number.isNaN(new Date(at).getTime())) return best;
    return !best || new Date(at) > new Date(best) ? at : best;
  }, null);
  const latestWhen = formatWhen(latestCheck ?? undefined);
  const allClear = items.length > 0 && doneCount === items.length;
  const editing = editingId ? items.find((it) => it.id === editingId) ?? null : null;
  const editingIndex = editing ? items.indexOf(editing) : -1;

  return (
    <div className="oc-hall">
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

      {allClear && (
        <div className="oc-clear" id="all-clear" role="status">
          <CheckCheck className="size-7 shrink-0" aria-hidden />
          <div className="min-w-0">
            <p className="oc-clear-title">{t("allClearTitle")}</p>
            <p className="oc-clear-sub">{t("allClearSub")}</p>
          </div>
        </div>
      )}

      <Card id="today">
        <CardHeader>
          <CardTitle>{t("todayTitle")}</CardTitle>
          <span className="oc-progress" id="progress">
            {t("progress", { done: doneCount, total: items.length })}
          </span>
          <CardAction>
            <span className="oc-reset" id="resets-at-midnight">
              {t("resetsAtMidnight")}
            </span>
          </CardAction>
          <p className="oc-when oc-when-summary col-span-full" id="checked-at">
            {latestWhen ? t("checkedAt", { time: latestWhen }) : ""}
          </p>
        </CardHeader>

        <CardContent className="grid gap-[0.55rem]">
          {items.length === 0 ? (
            <div
              id="list-empty"
              className="rounded-[14px] border border-dashed border-line-2 bg-dawn/60 px-[0.8rem] py-[0.9rem]"
            >
              <p className="font-heading m-0 text-[1rem] font-bold text-ink">{t("emptyTitle")}</p>
              <p className="m-0 mt-[0.35rem] text-[0.84rem] leading-6 text-ink-muted">
                {t("emptyHint")}
              </p>
            </div>
          ) : (
            <ul className="m-0 grid list-none gap-[0.5rem] p-0" id="check-list">
              {items.map((item) => (
                <CheckRow
                  key={item.id}
                  id={item.id}
                  label={labelOf(item)}
                  checkedAt={formatWhen(day.checks[item.id])}
                  checkedIso={day.checks[item.id] ?? null}
                  t={t}
                  onToggle={handleToggle}
                  onEdit={setEditingId}
                />
              ))}
            </ul>
          )}

          <AddItemDialog t={t} onAdd={handleAdd} />

          <div className="oc-file-row" id="backup-row">
            <button type="button" id="export-json" className="oc-file-btn" onClick={handleExportJson}>
              <Download className="size-4" aria-hidden />
              {t("exportJson")}
            </button>
            <button
              type="button"
              id="import-json"
              className="oc-file-btn"
              onClick={() => jsonInput.current?.click()}
            >
              <Upload className="size-4" aria-hidden />
              {t("importJson")}
            </button>
            <input
              ref={jsonInput}
              id="json-input"
              className="sr-only"
              type="file"
              accept="application/json,.json"
              style={{ fontSize: "1rem" }}
              onChange={(e) => {
                void handleImportJson(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
          </div>

          <p className="m-0 text-[0.76rem] leading-5 text-ink-muted" id="about-text">
            {t("about")}
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-[0.3rem]" id="promise-chips">
        {CHIP_KEYS.map((key) => (
          <span key={key} className="oc-chip">
            {t(key)}
          </span>
        ))}
      </div>

      <footer className="flex flex-wrap justify-center gap-3 px-0 pt-1 pb-2 text-[0.78rem] text-ink-muted">
        <a id="link-privacy" href="/privacy.html">
          {t("privacy")}
        </a>
        <a id="link-terms" href="/terms.html">
          {t("terms")}
        </a>
        <span>try-dabble.com</span>
      </footer>

      <Toast message={toastMsg} visible={toastOn} />

      <EditItemDialog
        open={editing !== null}
        label={editing ? labelOf(editing) : ""}
        canMoveUp={editingIndex > 0}
        canMoveDown={editingIndex >= 0 && editingIndex < items.length - 1}
        t={t}
        onOpenChange={(open) => {
          if (!open) setEditingId(null);
        }}
        onRename={(label) => {
          if (editing) handleRename(editing.id, label);
        }}
        onMove={(delta) => {
          if (editing) handleMove(editing.id, delta);
        }}
        onRemove={() => {
          if (editing) setPendingRemove(editing.id);
        }}
      />

      <ConfirmDialog
        open={pendingRemove !== null}
        message={t("removeConfirm")}
        cancelLabel={t("cancel")}
        confirmLabel={t("remove")}
        onOpenChange={(open) => {
          if (!open) setPendingRemove(null);
        }}
        onConfirm={confirmRemove}
      />
    </div>
  );
}

