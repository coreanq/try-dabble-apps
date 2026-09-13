import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";

import { BackupCard } from "@/components/backup-card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DayStrip } from "@/components/day-strip";
import { FoodDialog, type FoodDraft } from "@/components/food-dialog";
import { FoodsCard } from "@/components/foods-card";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { MacrosCard, type MealDraft } from "@/components/macros-card";
import { Masthead } from "@/components/masthead";
import { RestTimer, type RestState } from "@/components/rest-timer";
import { RoutinesCard, type RoutineDraft } from "@/components/routines-card";
import { SettingsCard } from "@/components/settings-card";
import { StrengthCard } from "@/components/strength-card";
import { TargetsCard } from "@/components/targets-card";
import { Toast } from "@/components/toast";
import { WeighInCard, type WeighInDraft } from "@/components/weighin-card";
import { WorkoutCard } from "@/components/workout-card";
import { backupFilename, buildBackup, download, parseBackup, toJSON } from "@/lib/backup";
import { dayTotals, latestWeighIn } from "@/lib/calc";
import { todayStr } from "@/lib/dates";
import { HTML_LANG, OG_IMAGE, detectLang, isLang, rememberLang, translate, type Lang, type MsgKey } from "@/lib/i18n";
import {
  clearStore,
  countRows,
  emptyStore,
  ensureExercise,
  loadStore,
  newId,
  newItem,
  newWorkout,
  putRow,
  reconcile,
  removeById,
  saveStore,
  touch,
  type Food,
  type MealLog,
  type Profile,
  type Routine,
  type Store,
  type Targets,
  type WeighIn,
  type Workout,
} from "@/lib/model";
import { loadPrefs, savePrefs, type Prefs } from "@/lib/prefs";
import { endAtFor, formatSeconds, remainingSeconds } from "@/lib/timer";
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

const CHIP_KEYS: MsgKey[] = ["chipNoLogin", "chipNoLock", "chipHistoryFree", "chipBackup", "chipNoAds", "chipLocal", "chipLangs"];
const TOAST_MS = 2200;

type Confirm =
  | { kind: "deleteWorkout"; id: string }
  | { kind: "deleteExercise"; workoutId: string; itemId: string }
  | { kind: "deleteFood"; id: string }
  | { kind: "import"; parsed: ReturnType<typeof parseBackup> }
  | { kind: "clearAll" };

function Home() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  const lang = useMemo(() => detectLang(search.lang ?? null), [search.lang]);
  const t = useCallback((key: MsgKey, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);

  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs());
  const [store, setStore] = useState<Store>(() => loadStore());
  const { profile, weighins, exercises, workouts, foods, meals, routines } = store;
  const [selectedDate, setSelectedDate] = useState(() => todayStr());
  const [rest, setRest] = useState<RestState | null>(null);
  const [restTick, setRestTick] = useState(0);
  const [foodDialog, setFoodDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [confirm, setConfirm] = useState<Confirm | null>(null);

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
    if (search.lang !== lang) navigate({ search: (prev) => ({ ...prev, lang }), replace: true });
  }, [lang, search.lang, navigate]);

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[lang];
    document.title = t("title");
    setMetaContent('meta[name="description"]', t("metaDescription"));
    setMetaContent('meta[property="og:image"], meta[name="twitter:image"]', OG_IMAGE[lang]);
    document.querySelector('link[rel="manifest"]')?.setAttribute("href", `/manifest.webmanifest?lang=${lang}`);
  }, [lang, t]);

  // Masthead chip: re-render once a second while a rest is running.
  useEffect(() => {
    if (!rest) return;
    const id = window.setInterval(() => setRestTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [rest]);

  const commitPrefs = useCallback((next: Prefs) => {
    setPrefs(next);
    savePrefs(next);
  }, []);
  const commit = useCallback((next: Store) => {
    const clean = reconcile(next);
    setStore(clean);
    saveStore(clean);
  }, []);

  // ---- derived ------------------------------------------------------------
  const dayWorkouts = useMemo(() => workouts.filter((w) => w.date === selectedDate), [workouts, selectedDate]);
  const dayExerciseCount = dayWorkouts.reduce((n, w) => n + w.items.length, 0);
  const dayKcal = useMemo(() => dayTotals(meals, selectedDate).kcal, [meals, selectedDate]);
  const latest = useMemo(() => latestWeighIn(weighins), [weighins]);
  const hasData = countRows(store) > 0;
  const restLabel = rest ? formatSeconds(remainingSeconds(rest.endAt)) : null;
  void restTick;

  // ---- workouts ----------------------------------------------------------------
  function startWorkout(name: string, exerciseNames: string[] = []) {
    let catalog = exercises;
    const w = newWorkout(selectedDate, name || undefined);
    for (const n of exerciseNames) {
      const r = ensureExercise(catalog, n);
      catalog = r.list;
      w.items.push(newItem(r.def));
    }
    commit({ ...store, exercises: catalog, workouts: [w, ...workouts] });
    showToast(t("workoutStarted"));
  }
  function startFromRoutine(routineId: string) {
    const r = routines.find((x) => x.id === routineId);
    if (!r) return;
    startWorkout(r.name, r.exerciseNames);
  }
  function changeWorkout(next: Workout) {
    commit({ ...store, workouts: putRow(workouts, touch(next)) });
  }
  function deleteWorkout(id: string) {
    commit({ ...store, workouts: removeById(workouts, id) });
    showToast(t("workoutDeleted"));
  }
  function addExercise(workoutId: string, name: string) {
    const w = workouts.find((x) => x.id === workoutId);
    if (!w) return;
    const r = ensureExercise(exercises, name);
    const item = newItem(r.def);
    item.sets.push({ id: newId(), weightKg: 0, reps: 0 });
    commit({ ...store, exercises: r.list, workouts: putRow(workouts, touch({ ...w, items: [...w.items, item] })) });
    showToast(t("exerciseAdded"));
  }
  function deleteExercise(workoutId: string, itemId: string) {
    const w = workouts.find((x) => x.id === workoutId);
    if (!w) return;
    commit({ ...store, workouts: putRow(workouts, touch({ ...w, items: w.items.filter((i) => i.id !== itemId) })) });
    showToast(t("exerciseDeleted"));
  }

  // ---- rest timer ------------------------------------------------------------------
  function startRest(seconds: number) {
    setRest({ endAt: endAtFor(seconds), total: seconds });
  }
  function stopRest() {
    setRest(null);
  }
  function scrollToRest() {
    document.getElementById("rest-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // ---- macros / foods ---------------------------------------------------------------
  function logMeal(draft: MealDraft) {
    const row: MealLog = { id: newId(), date: selectedDate, createdAt: new Date().toISOString(), ...draft };
    commit({ ...store, meals: [row, ...meals] });
    showToast(t("mealLogged"));
  }
  function deleteMeal(id: string) {
    commit({ ...store, meals: removeById(meals, id) });
    showToast(t("mealDeleted"));
  }
  function saveFood(draft: FoodDraft) {
    const existing = foodDialog.id ? foods.find((f) => f.id === foodDialog.id) : undefined;
    const row: Food = existing ? { ...existing, ...draft, servingLabel: draft.servingLabel } : { id: newId(), createdAt: new Date().toISOString(), ...draft };
    commit({ ...store, foods: putRow(foods, row) });
    showToast(t("foodSaved"));
  }
  function deleteFood(id: string) {
    commit({ ...store, foods: removeById(foods, id) });
    showToast(t("foodDeleted"));
  }

  // ---- profile / targets ------------------------------------------------------------
  function changeProfile(next: Profile) {
    commit({ ...store, profile: { ...next, updatedAt: new Date().toISOString() } });
  }
  function changeTargets(next: Targets) {
    changeProfile({ ...profile, targets: next });
  }
  function useSuggested(next: Required<Targets>) {
    changeTargets(next);
    showToast(t("targetsSaved"));
  }

  // ---- weigh-ins -----------------------------------------------------------------------
  function addWeighIn(draft: WeighInDraft) {
    const row: WeighIn = { id: newId(), createdAt: new Date().toISOString(), ...draft };
    commit({ ...store, weighins: [row, ...weighins] });
    showToast(t("weighInSaved"));
  }
  function deleteWeighIn(id: string) {
    commit({ ...store, weighins: removeById(weighins, id) });
    showToast(t("weighInDeleted"));
  }

  // ---- routines ---------------------------------------------------------------------------
  function addRoutine(draft: RoutineDraft) {
    const row: Routine = { id: newId(), createdAt: new Date().toISOString(), ...draft };
    commit({ ...store, routines: [row, ...routines] });
    showToast(t("routineSaved"));
  }
  function deleteRoutine(id: string) {
    commit({ ...store, routines: removeById(routines, id) });
    showToast(t("routineDeleted"));
  }

  // ---- backup ----------------------------------------------------------------------------
  function exportJson() {
    download(toJSON(buildBackup(store, prefs)), backupFilename(), "application/json");
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
    if (!hasData) applyImport(parsed);
    else setConfirm({ kind: "import", parsed });
  }
  function applyImport(parsed: ReturnType<typeof parseBackup>) {
    commit(parsed.store);
    if (parsed.prefs) commitPrefs(parsed.prefs);
    showToast(t("importOk", { w: parsed.store.workouts.length, m: parsed.store.meals.length }));
  }
  function clearAll() {
    clearStore();
    setStore(emptyStore());
    showToast(t("cleared"));
  }

  const editingFood = foodDialog.id ? (foods.find((f) => f.id === foodDialog.id) ?? null) : null;

  const confirmText = (() => {
    if (!confirm) return { title: "", body: "", ok: "" };
    switch (confirm.kind) {
      case "deleteWorkout":
        return { title: t("deleteWorkoutTitle"), body: t("deleteWorkoutBody"), ok: t("delete") };
      case "deleteExercise":
        return { title: t("deleteExerciseTitle"), body: t("deleteExerciseBody"), ok: t("delete") };
      case "deleteFood":
        return { title: t("deleteFoodTitle"), body: t("deleteFoodBody"), ok: t("delete") };
      case "import":
        return { title: t("importConfirmTitle"), body: t("importConfirmBody"), ok: t("importJson") };
      case "clearAll":
        return { title: t("clearAllTitle"), body: t("clearAllBody"), ok: t("delete") };
    }
  })();

  return (
    <div className="gm-app" data-size={prefs.fontSize}>
      <LocalOnlyBanner text={t("localOnly")} />
      <Masthead
        t={t}
        lang={lang}
        restLabel={restLabel}
        onRestTap={scrollToRest}
        onLangChange={(nextLang) => {
          rememberLang(nextLang);
          navigate({ search: (prev) => ({ ...prev, lang: nextLang }), replace: true });
        }}
      />

      {/* 3. Today strip */}
      <DayStrip t={t} lang={lang} date={selectedDate} workoutCount={dayExerciseCount} kcal={dayKcal} onChange={setSelectedDate} />

      {/* 4. Workout */}
      <WorkoutCard
        t={t}
        unit={prefs.unitWeight}
        workouts={dayWorkouts}
        exercises={exercises}
        routines={routines}
        restSeconds={prefs.restSecondsDefault}
        onStart={(name) => startWorkout(name)}
        onStartRoutine={startFromRoutine}
        onChange={changeWorkout}
        onDeleteWorkout={(id) => setConfirm({ kind: "deleteWorkout", id })}
        onAddExercise={addExercise}
        onDeleteExercise={(workoutId, itemId) => setConfirm({ kind: "deleteExercise", workoutId, itemId })}
        onRest={() => {
          startRest(prefs.restSecondsDefault);
          scrollToRest();
        }}
      />

      {/* 8. Rest timer (foreground only) */}
      <RestTimer t={t} rest={rest} defaultSeconds={prefs.restSecondsDefault} onStart={startRest} onStop={stopRest} />

      {/* 5. Macros */}
      <MacrosCard t={t} date={selectedDate} meals={meals} foods={foods} targets={profile.targets ?? {}} onLog={logMeal} onDelete={deleteMeal} />

      {/* 6. Targets / Mifflin–St Jeor */}
      <TargetsCard
        t={t}
        unit={prefs.unitWeight}
        profile={profile}
        latestWeighInKg={latest?.weightKg ?? null}
        onProfileChange={changeProfile}
        onTargetsChange={changeTargets}
        onUseSuggested={useSuggested}
      />

      {/* 7. Weigh-ins */}
      <WeighInCard t={t} lang={lang} unit={prefs.unitWeight} weighins={weighins} onAdd={addWeighIn} onDelete={deleteWeighIn} />

      {/* 8. Strength / PRs */}
      <StrengthCard t={t} lang={lang} unit={prefs.unitWeight} workouts={workouts} />

      {/* 9. Foods catalog */}
      <FoodsCard t={t} foods={foods} onAdd={() => setFoodDialog({ open: true, id: null })} onEdit={(id) => setFoodDialog({ open: true, id })} />

      {/* 10. Routines */}
      <RoutinesCard
        t={t}
        routines={routines}
        onAdd={addRoutine}
        onDelete={deleteRoutine}
        onStart={(id) => {
          startFromRoutine(id);
          document.getElementById("workout-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />

      {/* Settings */}
      <SettingsCard t={t} prefs={prefs} onChange={commitPrefs} />

      {/* 12. Backup */}
      <BackupCard t={t} hasData={hasData} onExportJson={exportJson} onImportFile={importFile} onClearAll={() => setConfirm({ kind: "clearAll" })} />

      {/* 11. Fail-case chips */}
      <div className="flex flex-wrap gap-[0.3rem]" id="promise-chips">
        {CHIP_KEYS.map((key) => (
          <span key={key} className="gm-promise">
            {t(key)}
          </span>
        ))}
      </div>

      {/* 13. Footer */}
      <footer className="gm-footer">
        <a id="link-privacy" href={`https://try-dabble.com/${lang}/privacy`}>
          {t("privacy")}
        </a>
        <a id="link-terms" href={`https://try-dabble.com/${lang}/terms`}>
          {t("terms")}
        </a>
        <a id="link-guide" href={`https://try-dabble.com/${lang}/guides/gymac`}>
          {t("guide")}
        </a>
        <a id="link-hub" href={`https://try-dabble.com/${lang}`}>
          try-dabble.com
        </a>
      </footer>

      <FoodDialog
        open={foodDialog.open}
        food={editingFood}
        t={t}
        onOpenChange={(open) => setFoodDialog((d) => ({ ...d, open }))}
        onSave={saveFood}
        onDelete={() => {
          if (foodDialog.id) setConfirm({ kind: "deleteFood", id: foodDialog.id });
          setFoodDialog((d) => ({ ...d, open: false }));
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
            case "deleteWorkout":
              deleteWorkout(confirm.id);
              break;
            case "deleteExercise":
              deleteExercise(confirm.workoutId, confirm.itemId);
              break;
            case "deleteFood":
              deleteFood(confirm.id);
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
