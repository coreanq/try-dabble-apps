import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";

import { AdSlot } from "@/components/ad-slot";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { NoteSheet } from "@/components/note-sheet";
import { TimerPresets } from "@/components/timer-presets";
import { Toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  HTML_LANG,
  OG_IMAGE,
  detectLang,
  isLang,
  rememberLang,
  translate,
  type Lang,
  type MsgKey,
} from "@/lib/i18n";
import {
  blankNote,
  hasText,
  isExpired,
  isTtl,
  loadDefaultTtl,
  loadNotes,
  saveDefaultTtl,
  saveNotes,
  sortNotes,
  type Note,
  type TtlMs,
} from "@/lib/notes";
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

const TOAST_MS = 2200;
const TICK_MS = 1000;

function Home() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  const lang = useMemo(() => detectLang(search.lang ?? null), [search.lang]);
  const t = useCallback(
    (key: MsgKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );

  const [defaultTtl, setDefaultTtl] = useState<TtlMs>(() => loadDefaultTtl());
  // A blank sheet is always on the pad at first load, so the very first
  // keystroke is the whole interaction. Nothing to press, nothing to save.
  const [notes, setNotes] = useState<Note[]>(() => {
    const stored = sortNotes(loadNotes());
    return stored.length > 0 ? stored : [blankNote(loadDefaultTtl())];
  });
  const [now, setNow] = useState(() => Date.now());
  const [pendingDelete, setPendingDelete] = useState<Note | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const toastTimer = useRef<number | undefined>(undefined);

  const written = useMemo(() => notes.filter(hasText), [notes]);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastOn(true);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastOn(false), TOAST_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  // Countdown clock. It also drives the sweep below, so an app left open all
  // night still empties itself without a reload.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), TICK_MS);
    const wake = () => setNow(Date.now());
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("focus", wake);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("focus", wake);
    };
  }, []);

  // Expired notes are deleted, never archived. A blank sheet is exempt: it has
  // nothing to lose and is the place the cursor lives.
  useEffect(() => {
    const dead = notes.filter((n) => hasText(n) && isExpired(n, now));
    if (dead.length === 0) return;
    const kept = notes.filter((n) => !(hasText(n) && isExpired(n, now)));
    setNotes(kept.length > 0 ? kept : [blankNote(defaultTtl)]);
    saveNotes(kept);
    showToast(dead.length === 1 ? t("sweptOne") : t("sweptN", { n: dead.length }));
  }, [now, notes, defaultTtl, showToast, t]);

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
    setMetaContent(
      'meta[name="application-name"], meta[name="apple-mobile-web-app-title"]',
      t("title"),
    );
    setMetaContent('meta[property="og:title"], meta[name="twitter:title"]', t("title"));
    setMetaContent('meta[property="og:image"], meta[name="twitter:image"]', OG_IMAGE[lang]);
  }, [lang, t]);

  const commit = useCallback((next: Note[]) => {
    setNotes(next);
    saveNotes(next);
  }, []);

  function focusDraft(id: string) {
    window.requestAnimationFrame(() => {
      document
        .querySelector<HTMLTextAreaElement>(`textarea[data-note-input="${id}"]`)
        ?.focus();
    });
  }

  function handleLang(next: Lang) {
    rememberLang(next);
    navigate({ search: (prev) => ({ ...prev, lang: next }), replace: true });
  }

  function handleDefaultTtl(ttlMs: number) {
    if (!isTtl(ttlMs)) return;
    setDefaultTtl(ttlMs);
    saveDefaultTtl(ttlMs);
    // A sheet still blank belongs to the new default too.
    commit(notes.map((n) => (hasText(n) ? n : { ...n, ttlMs })));
  }

  /** The only write path there is. Every keystroke saves and, because the
   *  clock runs from the last edit, restarts that note's countdown. */
  function handleText(id: string, text: string) {
    commit(
      notes.map((n) => (n.id === id ? { ...n, text, updatedAt: Date.now() } : n)),
    );
  }

  function handleTtl(id: string, ttlMs: number) {
    if (!isTtl(ttlMs)) return;
    commit(notes.map((n) => (n.id === id ? { ...n, ttlMs } : n)));
  }

  function handleReset(id: string) {
    commit(notes.map((n) => (n.id === id ? { ...n, updatedAt: Date.now() } : n)));
    showToast(t("resetDone"));
  }

  function handleNewNote() {
    const blank = notes.find((n) => !hasText(n));
    if (blank) {
      focusDraft(blank.id);
      return;
    }
    const fresh = blankNote(defaultTtl);
    setNotes([fresh, ...notes]);
    focusDraft(fresh.id);
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    const rest = notes.filter((n) => n.id !== pendingDelete.id);
    commit(rest.length > 0 ? rest : [blankNote(defaultTtl)]);
    setPendingDelete(null);
  }

  return (
    <div className="tp-shell">
      <LocalOnlyBanner text={t("localOnly")} />

      <Masthead
        title={t("title")}
        tagline={t("tagline")}
        langLabel={t("langLabel")}
        lang={lang}
        onLangChange={handleLang}
      />

      <Card id="timer-card">
        <CardHeader>
          <CardTitle>{t("defaultTimerLabel")}</CardTitle>
          <CardAction>
            <span
              id="pad-count"
              className="rounded-[2px] border-[1.5px] border-graphite bg-pad px-[0.45rem] py-[0.12rem] font-mono text-[0.7rem] font-bold text-ink"
            >
              {t("padCount", { n: written.length })}
            </span>
          </CardAction>
        </CardHeader>
        <CardContent>
          <TimerPresets
            id="default-timer"
            label={t("defaultTimerLabel")}
            hint={t("defaultTimerHint")}
            value={defaultTtl}
            onChange={handleDefaultTtl}
            t={t}
          />
        </CardContent>
      </Card>

      {written.length === 0 ? (
        <EmptyState t={t} onStart={handleNewNote} />
      ) : null}

      <div id="pad" className="flex flex-col gap-[0.9rem]">
        {notes.map((note) => (
          <NoteSheet
            key={note.id}
            note={note}
            now={now}
            t={t}
            onText={handleText}
            onTtl={handleTtl}
            onReset={handleReset}
            onDelete={setPendingDelete}
          />
        ))}
      </div>

      <div>
        <Button id="new-note" variant="secondary" size="sm" onClick={handleNewNote}>
          {t("newNote")}
        </Button>
      </div>

      <Card id="how-card" className="bg-desk-2">
        <CardHeader>
          <CardTitle id="how-title">{t("howTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="m-0 text-[0.8rem] leading-6 text-muted-ink" id="how-body">
            {t("howBody")}
          </p>
          <p className="mt-2 mb-0 text-[0.8rem] leading-6 text-muted-ink" id="about-text">
            {t("about")}
          </p>
        </CardContent>
      </Card>

      <AdSlot />

      <footer className="flex flex-wrap justify-center gap-3 px-0 pt-1 pb-2 text-[0.78rem] text-muted-ink">
        <a id="link-privacy" href="/privacy.html">
          {t("privacy")}
        </a>
        <a id="link-terms" href="/terms.html">
          {t("terms")}
        </a>
        <span>try-dabble.com</span>
      </footer>

      <Toast message={toastMsg} visible={toastOn} />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t("deleteConfirmTitle")}
        body={t("deleteConfirmBody")}
        cancelLabel={t("cancel")}
        confirmLabel={t("delete")}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
