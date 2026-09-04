import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";

import { AddPersonForm } from "@/components/add-person-form";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { PersonCard, type PersonPatch } from "@/components/person-card";
import { PromiseChips } from "@/components/promise-chips";
import { SearchBox } from "@/components/search-box";
import { Toast } from "@/components/toast";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DATE_LOCALE,
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
  MAX_CONTEXT,
  MAX_NOTES,
  SORT_MODES,
  isOverdue,
  loadOpenId,
  loadPeople,
  loadSort,
  matchesQuery,
  newPerson,
  parseISO,
  savePeople,
  saveOpenId,
  saveSort,
  sortPeople,
  type Person,
  type SortMode,
} from "@/lib/people";
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

const SORT_LABEL: Record<SortMode, MsgKey> = {
  next: "sortNext",
  last: "sortLast",
  name: "sortName",
  added: "sortAdded",
};

const TOAST_MS = 2200;

function Home() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  const lang = useMemo(() => detectLang(search.lang ?? null), [search.lang]);
  const t = useCallback(
    (key: MsgKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );

  const [people, setPeople] = useState<Person[]>(() => loadPeople());
  const [sort, setSort] = useState<SortMode>(() => loadSort());
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(() => loadOpenId());
  const [pendingDelete, setPendingDelete] = useState<Person | null>(null);
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
    setMetaContent(
      'meta[name="application-name"], meta[name="apple-mobile-web-app-title"]',
      t("title"),
    );
    setMetaContent('meta[property="og:title"], meta[name="twitter:title"]', t("title"));
    setMetaContent('meta[property="og:image"], meta[name="twitter:image"]', OG_IMAGE[lang]);
  }, [lang, t]);

  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(DATE_LOCALE[lang], {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    [lang],
  );

  const dateLabel = useCallback(
    (iso: string) => {
      const d = parseISO(iso);
      return d ? dateFmt.format(d) : "";
    },
    [dateFmt],
  );

  /** Every change goes straight to storage. There is no Save button, and the
   *  notes on a card are written on the keystroke that typed them. */
  const commit = useCallback((next: Person[]) => {
    setPeople(next);
    savePeople(next);
  }, []);

  const ordered = useMemo(() => sortPeople(people, sort), [people, sort]);
  const visible = useMemo(
    () => ordered.filter((p) => matchesQuery(p, query)),
    [ordered, query],
  );
  const overdueCount = useMemo(() => people.filter((p) => isOverdue(p)).length, [people]);

  function handleLang(next: Lang) {
    rememberLang(next);
    navigate({ search: (prev) => ({ ...prev, lang: next }), replace: true });
  }

  function handleSort(next: SortMode) {
    setSort(next);
    saveSort(next);
  }

  function handleToggle(id: string) {
    const next = openId === id ? null : id;
    setOpenId(next);
    saveOpenId(next);
  }

  function handleAdd(name: string, context: string) {
    const person = newPerson(name, context);
    commit([person, ...people]);
    setQuery("");
    setOpenId(person.id);
    saveOpenId(person.id);
    showToast(t("personAdded", { name: person.name }));
  }

  function handlePatch(id: string, patch: PersonPatch) {
    commit(
      people.map((p) => {
        if (p.id !== id) return p;
        const next: Person = { ...p, updatedAt: Date.now() };
        if (patch.context !== undefined) next.context = patch.context.slice(0, MAX_CONTEXT);
        if (patch.notes !== undefined) next.notes = patch.notes.slice(0, MAX_NOTES);
        if (patch.lastContact !== undefined) next.lastContact = patch.lastContact;
        if (patch.nextContact !== undefined) next.nextContact = patch.nextContact;
        return next;
      }),
    );
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    commit(people.filter((p) => p.id !== id));
    setPendingDelete(null);
    if (openId === id) {
      setOpenId(null);
      saveOpenId(null);
    }
    showToast(t("personDeleted"));
  }

  const promises: MsgKey[] = [
    "promiseLogin",
    "promiseCard",
    "promiseContacts",
    "promiseNotes",
    "promiseSettings",
    "promiseUnlimited",
  ];

  return (
    <div className="kl-shell">
      <LocalOnlyBanner text={t("localOnly")} />

      <Masthead
        title={t("title")}
        tagline={t("tagline")}
        langLabel={t("langLabel")}
        lang={lang}
        onLangChange={handleLang}
      />

      <PromiseChips t={t} />

      <AddPersonForm t={t} onAdd={handleAdd} />

      {people.length === 0 ? <EmptyState t={t} /> : null}

      {people.length > 0 ? (
        <Card id="list-card">
          <CardHeader>
            <CardTitle id="list-title">{t("listTitle")}</CardTitle>
            <CardAction>
              <span className="kl-datemark" id="people-count">
                {t("peopleCount", { n: people.length })}
              </span>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-[0.45rem]">
              <SearchBox value={query} onChange={setQuery} t={t} />

              <div className="flex flex-wrap items-center gap-[0.4rem]">
                <label className="sr-only" htmlFor="sort-select">
                  {t("sortLabel")}
                </label>
                <select
                  id="sort-select"
                  className="kl-select max-w-full flex-1"
                  aria-label={t("sortLabel")}
                  value={sort}
                  onChange={(e) => handleSort(e.target.value as SortMode)}
                >
                  {SORT_MODES.map((mode) => (
                    <option key={mode} value={mode}>
                      {t(SORT_LABEL[mode])}
                    </option>
                  ))}
                </select>
                {overdueCount > 0 ? (
                  <span className="kl-stamp" data-tone="overdue" id="overdue-count">
                    {t("overdueCount", { n: overdueCount })}
                  </span>
                ) : null}
              </div>
            </div>

            {visible.length === 0 ? (
              <p className="mt-3 mb-0 text-[0.8rem] text-muted-ink" id="search-empty">
                {t("searchEmpty", { q: query })}
              </p>
            ) : (
              <div className="mt-[0.65rem] flex flex-col gap-[0.5rem]" id="person-list">
                {visible.map((person) => (
                  <PersonCard
                    key={person.id}
                    person={person}
                    t={t}
                    open={openId === person.id}
                    overdue={isOverdue(person)}
                    dateLabel={dateLabel}
                    onToggle={handleToggle}
                    onPatch={handlePatch}
                    onDelete={setPendingDelete}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card id="promise-card" className="bg-card-ivory-2/70">
        <CardHeader>
          <CardTitle id="promise-title">{t("promiseTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="m-0 flex list-none flex-col gap-[0.35rem] p-0">
            {promises.map((key) => (
              <li className="kl-promise" key={key}>
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card id="how-card">
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
        title={t("deleteConfirmTitle", { name: pendingDelete?.name ?? "" })}
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
