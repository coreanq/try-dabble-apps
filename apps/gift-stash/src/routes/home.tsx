import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";

import { AdSlot } from "@/components/ad-slot";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { IdeaDialog, type IdeaDraft } from "@/components/idea-dialog";
import { IdeaTag } from "@/components/idea-tag";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { PersonChip } from "@/components/person-chip";
import { PersonDialog, type PersonDraft } from "@/components/person-dialog";
import { Toast } from "@/components/toast";
import { ToolsCard } from "@/components/tools-card";
import { UpcomingDrawer } from "@/components/upcoming-drawer";
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
  DEFAULT_SETTINGS,
  STATUSES,
  UNASSIGNED_FILTER,
  WINDOW_DAYS,
  buildExport,
  clampRemindDays,
  deletePhoto,
  filterIdeas,
  filterPeople,
  isoDate,
  loadIdeas,
  loadNotified,
  loadPeople,
  loadSettings,
  parseImport,
  putPhotos,
  saveIdeas,
  saveNotified,
  savePeople,
  savePhoto,
  saveSettings,
  uid,
  upcomingList,
  type Idea,
  type Person,
  type Settings,
  type Status,
  type UpcomingEntry,
} from "@/lib/stash";
import { rootRoute } from "@/routes/root";

interface HomeSearch {
  lang?: Lang;
}

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
  validateSearch: (search: Record<string, unknown>): HomeSearch =>
    isLang(search.lang) ? { lang: search.lang } : {},
});

const STATUS_LABEL: Record<Status, MsgKey> = {
  idea: "statusIdea",
  bought: "statusBought",
  given: "statusGiven",
};

const TOAST_MS = 1800;

function setMetaContent(selector: string, value: string) {
  document.querySelectorAll<HTMLMetaElement>(selector).forEach((el) => {
    el.setAttribute("content", value);
  });
}

function Home() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  const lang = useMemo(() => detectLang(search.lang ?? null), [search.lang]);
  const t = useCallback(
    (key: MsgKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );

  const [people, setPeople] = useState<Person[]>(loadPeople);
  const [ideas, setIdeas] = useState<Idea[]>(loadIdeas);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [query, setQuery] = useState("");
  const [filterPerson, setFilterPerson] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [personOpen, setPersonOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [ideaOpen, setIdeaOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [incomingPhoto, setIncomingPhoto] = useState<Blob | null>(null);
  const [confirm, setConfirm] = useState<{ message: string; run: () => void } | null>(null);

  const [notifyPermission, setNotifyPermission] = useState<NotificationPermission | "unsupported">(
    () => (typeof Notification === "undefined" ? "unsupported" : Notification.permission),
  );

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
    setMetaContent(
      'meta[name="application-name"], meta[name="apple-mobile-web-app-title"]',
      t("title"),
    );
  }, [lang, t]);

  const patchPeople = useCallback((next: Person[]) => {
    setPeople(next);
    savePeople(next);
  }, []);

  const patchIdeas = useCallback((next: Idea[]) => {
    setIdeas(next);
    saveIdeas(next);
  }, []);

  const patchSettings = useCallback((changes: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...changes };
      saveSettings(next);
      return next;
    });
  }, []);

  const birthdayLabel = t("birthdayLabel");
  const anniversaryLabel = t("anniversary");
  const upcoming = useMemo(
    () => upcomingList(people, new Date(), WINDOW_DAYS, birthdayLabel, anniversaryLabel),
    [people, birthdayLabel, anniversaryLabel],
  );
  const soon = useMemo(
    () => upcoming.filter((entry) => entry.days <= settings.remindDays),
    [upcoming, settings.remindDays],
  );

  const whenLabel = useCallback(
    (days: number) => {
      if (days === 0) return t("today");
      if (days === 1) return t("tomorrow");
      return t("daysAway", { n: days });
    },
    [t],
  );

  const shownPeople = useMemo(() => filterPeople(people, query), [people, query]);
  const shownIdeas = useMemo(
    () => filterIdeas(ideas, people, { person: filterPerson, status: filterStatus, query }),
    [ideas, people, filterPerson, filterStatus, query],
  );

  const notificationsLive =
    notifyPermission === "granted" && settings.notifyEnabled && typeof Notification !== "undefined";

  // On-device reminders, checked whenever the app is open. One notification per
  // person per occasion per day, remembered in gift-stash:notified:v1.
  useEffect(() => {
    if (!notificationsLive || !soon.length) return;
    const map = loadNotified();
    const today = isoDate(new Date());
    let changed = false;
    for (const entry of soon) {
      const key = `${today}:${entry.person.id}:${entry.label}`;
      if (map[key]) continue;
      try {
        new Notification(translate(lang, "title"), {
          body: `${entry.person.name} — ${entry.label} · ${whenLabel(entry.days)}`,
          icon: "/icons/icon-192.png",
          tag: key,
        });
        map[key] = 1;
        changed = true;
      } catch {
        /* the browser refused it — the banner still shows the same dates */
      }
    }
    if (changed) saveNotified(map);
  }, [notificationsLive, soon, lang, whenLabel]);

  const notifyStatus = useMemo(() => {
    if (notifyPermission === "unsupported") return t("notifyOff");
    if (notifyPermission === "denied") return t("notifyDenied");
    if (notifyPermission === "granted" && settings.notifyEnabled) return t("notifyOn");
    return t("notifyOff");
  }, [notifyPermission, settings.notifyEnabled, t]);

  async function requestNotify() {
    if (typeof Notification === "undefined") return;
    try {
      const permission = await Notification.requestPermission();
      setNotifyPermission(permission);
      patchSettings({ notifyEnabled: permission === "granted" });
    } catch {
      patchSettings({ notifyEnabled: false });
    }
  }

  const anyDialogOpen = personOpen || ideaOpen || confirm !== null;

  const openNewIdea = useCallback((photo: Blob | null) => {
    setEditingIdea(null);
    setIncomingPhoto(photo);
    setIdeaOpen(true);
  }, []);

  function openEditIdea(idea: Idea) {
    setEditingIdea(idea);
    setIncomingPhoto(null);
    setIdeaOpen(true);
  }

  function openEditPerson(person: Person) {
    setEditingPerson(person);
    setPersonOpen(true);
  }

  // Paste anywhere: an image starts a new idea with that screenshot already in
  // it. An open dialog handles its own paste, so this only fires on the page.
  useEffect(() => {
    if (anyDialogOpen) return;
    function onPaste(e: ClipboardEvent) {
      for (const item of e.clipboardData?.items ?? []) {
        if (!item.type.startsWith("image/")) continue;
        const file = item.getAsFile();
        if (!file) continue;
        e.preventDefault();
        openNewIdea(file);
        return;
      }
    }
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [anyDialogOpen, openNewIdea]);

  function handleLang(next: Lang) {
    rememberLang(next);
    navigate({ search: (prev) => ({ ...prev, lang: next }), replace: true });
  }

  function handlePersonSubmit(draft: PersonDraft): boolean {
    if (!draft.name) {
      showToast(t("needName"));
      return false;
    }
    const existing = draft.id ? (people.find((p) => p.id === draft.id) ?? null) : null;
    const photoId = draft.faceBlob ? uid() : (existing?.photoId ?? null);
    const record: Person = {
      id: existing?.id ?? uid(),
      name: draft.name,
      birthday: draft.birthday,
      notes: draft.notes,
      photoId,
      occasions: draft.occasions,
      createdAt: existing?.createdAt ?? Date.now(),
    };
    patchPeople(
      existing ? people.map((p) => (p.id === record.id ? record : p)) : [...people, record],
    );
    void (async () => {
      if (draft.faceBlob && photoId) await savePhoto(photoId, draft.faceBlob);
      if (existing?.photoId && existing.photoId !== photoId) await deletePhoto(existing.photoId);
    })();
    showToast(t("saved"));
    return true;
  }

  function handlePersonDelete(person: Person) {
    setConfirm({
      message: t("deletePersonConfirm", { name: person.name }),
      run: () => {
        patchPeople(people.filter((p) => p.id !== person.id));
        patchIdeas(ideas.map((i) => (i.personId === person.id ? { ...i, personId: "" } : i)));
        void deletePhoto(person.photoId);
        if (filterPerson === person.id) setFilterPerson("");
        setPersonOpen(false);
        showToast(t("deleted"));
      },
    });
  }

  function handleIdeaSubmit(draft: IdeaDraft): boolean {
    const existing = draft.id ? (ideas.find((i) => i.id === draft.id) ?? null) : null;
    const keptPhotoId = draft.photoCleared ? null : (existing?.photoId ?? null);
    const photoId = draft.photoBlob ? uid() : keptPhotoId;
    const record: Idea = {
      id: existing?.id ?? uid(),
      personId: draft.personId,
      title: draft.title,
      url: draft.url,
      price: draft.price,
      note: draft.note,
      status: draft.status,
      photoId,
      createdAt: existing?.createdAt ?? Date.now(),
    };
    patchIdeas(existing ? ideas.map((i) => (i.id === record.id ? record : i)) : [...ideas, record]);
    void (async () => {
      if (draft.photoBlob && photoId) await savePhoto(photoId, draft.photoBlob);
      if (existing?.photoId && existing.photoId !== photoId) await deletePhoto(existing.photoId);
    })();
    showToast(t("saved"));
    return true;
  }

  function handleIdeaDelete(idea: Idea) {
    setConfirm({
      message: t("deleteIdeaConfirm"),
      run: () => {
        patchIdeas(ideas.filter((i) => i.id !== idea.id));
        void deletePhoto(idea.photoId);
        setIdeaOpen(false);
        showToast(t("deleted"));
      },
    });
  }

  async function handleExport() {
    const payload = await buildExport(people, ideas, settings);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gift-stash-${isoDate(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(payload.photoSkipped ? t("photoSkipped") : t("exported"));
  }

  async function handleImport(file: File) {
    try {
      const parsed = parseImport(JSON.parse(await file.text()));
      if (!parsed) throw new Error("unrecognised file");
      patchPeople(parsed.people);
      patchIdeas(parsed.ideas);
      if (parsed.settings) patchSettings(parsed.settings);
      await putPhotos(parsed.photos);
      showToast(t("imported"));
    } catch {
      showToast(t("importFail"));
    }
  }

  function openPersonFromDrawer(personId: string) {
    setFilterPerson(personId);
  }

  const bannerList = soon
    .map((entry: UpcomingEntry) => `${entry.person.name} (${whenLabel(entry.days)})`)
    .join(" · ");

  return (
    <div className="gs-shell">
      <LocalOnlyBanner text={t("localOnly")} />
      <Masthead
        title={t("title")}
        tagline={t("tagline")}
        langLabel={t("langLabel")}
        lang={lang}
        onLangChange={handleLang}
      />

      <Card size="sm" className="about">
        <CardContent className="pt-0.5 text-[0.78rem] leading-relaxed text-muted-ink">
          <p id="about-text" className="m-0">
            {t("about")}
          </p>
        </CardContent>
      </Card>

      {soon.length ? (
        <div id="remind-banner" className="gs-banner">
          {t("bannerSoon", { list: bannerList })}
          {notificationsLive ? null : (
            <div className="mt-1.5">
              <Button type="button" id="banner-notify" variant="outline" size="xs" onClick={requestNotify}>
                {t("bannerNotify")}
              </Button>
            </div>
          )}
        </div>
      ) : null}

      <label className="block">
        <span className="sr-only" id="search-label">
          {t("search")}
        </span>
        <input
          id="search"
          className="gs-search"
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          aria-label={t("search")}
          placeholder={t("search")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      <Card size="sm" id="upcoming-section">
        <CardHeader>
          <CardTitle id="upcoming-title">{t("upcoming")}</CardTitle>
          <CardAction>
            <span id="upcoming-count" className="gs-count">
              {upcoming.length}
            </span>
          </CardAction>
        </CardHeader>
        <CardContent>
          {upcoming.length ? (
            <div id="upcoming-strip" className="gs-strip" aria-live="polite">
              {upcoming.map((entry) => (
                <UpcomingDrawer
                  key={entry.key}
                  entry={entry}
                  soon={entry.days <= settings.remindDays}
                  whenLabel={whenLabel(entry.days)}
                  t={t}
                  onOpen={openPersonFromDrawer}
                />
              ))}
            </div>
          ) : (
            <p id="upcoming-empty" className="gs-empty m-0">
              {t("upcomingEmpty")}
            </p>
          )}
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle id="people-title">{t("people")}</CardTitle>
          <CardAction>
            <Button
              type="button"
              id="add-person-btn"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingPerson(null);
                setPersonOpen(true);
              }}
            >
              {t("addPerson")}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div id="people-strip" className="gs-strip" aria-live="polite">
            <button
              type="button"
              className="gs-person"
              aria-pressed={filterPerson === ""}
              data-filter-person=""
              onClick={() => setFilterPerson("")}
            >
              <span className="gs-face">✻</span>
              <span>{t("everyone")}</span>
            </button>
            <button
              type="button"
              className="gs-person"
              aria-pressed={filterPerson === UNASSIGNED_FILTER}
              data-filter-person={UNASSIGNED_FILTER}
              onClick={() => setFilterPerson(UNASSIGNED_FILTER)}
            >
              <span className="gs-face">–</span>
              <span>{t("unassigned")}</span>
            </button>
            {shownPeople.map((person) => (
              <PersonChip
                key={person.id}
                person={person}
                active={filterPerson === person.id}
                t={t}
                onSelect={setFilterPerson}
                onEdit={openEditPerson}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle id="ideas-title">{t("ideas")}</CardTitle>
          <CardAction>
            <Button type="button" id="add-idea-btn" size="sm" onClick={() => openNewIdea(null)}>
              {t("addIdea")}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-2.5">
          <div id="status-filters" className="gs-strip">
            <button
              type="button"
              className="gs-chip"
              aria-pressed={filterStatus === ""}
              data-status=""
              onClick={() => setFilterStatus("")}
            >
              {t("statusAll")}
            </button>
            {STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                className="gs-chip"
                aria-pressed={filterStatus === status}
                data-status={status}
                onClick={() => setFilterStatus(status)}
              >
                {t(STATUS_LABEL[status])}
              </button>
            ))}
          </div>
          {shownIdeas.length ? (
            <div
              id="idea-grid"
              className="grid grid-cols-2 gap-2.5 sm:grid-cols-3"
              aria-live="polite"
            >
              {shownIdeas.map((idea) => (
                <IdeaTag
                  key={idea.id}
                  idea={idea}
                  person={people.find((p) => p.id === idea.personId)}
                  t={t}
                  onEdit={openEditIdea}
                />
              ))}
            </div>
          ) : (
            <p id="ideas-empty" className="gs-empty m-0">
              {t("emptyIdeas")}
            </p>
          )}
        </CardContent>
      </Card>

      <AdSlot />

      <ToolsCard
        remindDays={settings.remindDays}
        notifyStatus={notifyStatus}
        t={t}
        onRemindDaysChange={(days) =>
          patchSettings({
            remindDays: clampRemindDays(Number.isFinite(days) ? days : DEFAULT_SETTINGS.remindDays),
          })
        }
        onRequestNotify={requestNotify}
        onExport={handleExport}
        onImport={handleImport}
      />

      <footer className="gs-footer">
        <a id="link-privacy" href="/privacy.html">
          {t("privacy")}
        </a>
        <a id="link-terms" href="/terms.html">
          {t("terms")}
        </a>
        <span>try-dabble.com</span>
      </footer>

      <PersonDialog
        open={personOpen}
        person={editingPerson}
        t={t}
        onOpenChange={setPersonOpen}
        onSubmit={handlePersonSubmit}
        onDelete={handlePersonDelete}
      />

      <IdeaDialog
        open={ideaOpen}
        idea={editingIdea}
        incomingPhoto={incomingPhoto}
        people={people}
        defaultPersonId={filterPerson && filterPerson !== UNASSIGNED_FILTER ? filterPerson : ""}
        t={t}
        onOpenChange={setIdeaOpen}
        onSubmit={handleIdeaSubmit}
        onDelete={handleIdeaDelete}
      />

      <ConfirmDialog
        open={confirm !== null}
        message={confirm?.message ?? ""}
        cancelLabel={t("cancel")}
        confirmLabel={t("delete")}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
        onConfirm={() => {
          confirm?.run();
          setConfirm(null);
        }}
      />

      <Toast message={toastMsg} visible={toastOn} />
    </div>
  );
}
