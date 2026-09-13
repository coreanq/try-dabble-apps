import { useState } from "react";
import { Dumbbell, Plus, Timer, Trash2, X } from "lucide-react";

import { NumField } from "@/components/num-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";
import { fmt, kgToLb, lbToKg, round1, workoutSummary } from "@/lib/calc";
import type { Translate } from "@/lib/i18n";
import { NAME_MAX, NOTES_MAX, newSet, type ExerciseDef, type Routine, type WeightUnit, type Workout, type WorkoutItem, type WorkoutSet } from "@/lib/model";

/**
 * Sessions on the selected day. Everything edits in place: session name and
 * notes, each set's weight and reps, delete a set / exercise / session. Add
 * exercise takes a free name with the catalog as suggestions. Every count is
 * unlimited; "Rest" starts the foreground timer with the default seconds.
 */
export function WorkoutCard({
  t,
  unit,
  workouts,
  exercises,
  routines,
  restSeconds,
  onStart,
  onStartRoutine,
  onChange,
  onDeleteWorkout,
  onAddExercise,
  onDeleteExercise,
  onRest,
}: {
  t: Translate;
  unit: WeightUnit;
  workouts: Workout[];
  exercises: ExerciseDef[];
  routines: Routine[];
  restSeconds: number;
  onStart: (name: string) => void;
  onStartRoutine: (routineId: string) => void;
  onChange: (next: Workout) => void;
  onDeleteWorkout: (id: string) => void;
  onAddExercise: (workoutId: string, name: string) => void;
  onDeleteExercise: (workoutId: string, itemId: string) => void;
  onRest: () => void;
}) {
  const [newName, setNewName] = useState("");
  const [routineId, setRoutineId] = useState("");
  const [exerciseText, setExerciseText] = useState<Record<string, string>>({});
  const [showStart, setShowStart] = useState(false);

  const toDisplay = (kg: number) => round1(unit === "lb" ? kgToLb(kg) : kg);
  const toKg = (n: number) => round1(unit === "lb" ? lbToKg(n) : n);

  function updateSet(w: Workout, item: WorkoutItem, set: WorkoutSet, patch: Partial<WorkoutSet>) {
    onChange({
      ...w,
      items: w.items.map((i) => (i.id === item.id ? { ...i, sets: i.sets.map((s) => (s.id === set.id ? { ...s, ...patch } : s)) } : i)),
    });
  }
  function addSet(w: Workout, item: WorkoutItem) {
    const last = item.sets[item.sets.length - 1];
    const s = last ? newSet(last.weightKg, last.reps) : newSet(0, 0);
    onChange({ ...w, items: w.items.map((i) => (i.id === item.id ? { ...i, sets: [...i.sets, s] } : i)) });
  }
  function deleteSet(w: Workout, item: WorkoutItem, setId: string) {
    onChange({ ...w, items: w.items.map((i) => (i.id === item.id ? { ...i, sets: i.sets.filter((s) => s.id !== setId) } : i)) });
  }
  function submitExercise(w: Workout) {
    const name = (exerciseText[w.id] ?? "").trim();
    if (!name) return;
    onAddExercise(w.id, name.slice(0, NAME_MAX));
    setExerciseText((m) => ({ ...m, [w.id]: "" }));
  }

  const startBlock = (
    <div className="grid gap-2" id="start-block">
      <div className="gm-set-tools">
        <Input id="workout-name" maxLength={NAME_MAX} autoComplete="off" placeholder={t("workoutNamePlaceholder")} value={newName} onChange={(e) => setNewName(e.target.value)} />
        <button
          type="button"
          className="gm-btn gm-btn-primary w-auto"
          id="start-workout"
          onClick={() => {
            onStart(newName.trim());
            setNewName("");
            setShowStart(false);
          }}
        >
          <Dumbbell className="size-4" aria-hidden />
          {t("startWorkout")}
        </button>
      </div>
      {routines.length > 0 && (
        <div className="gm-set-tools">
          <Select id="start-routine-select" value={routineId} onChange={(e) => setRoutineId(e.target.value)} aria-label={t("fromRoutine")}>
            <SelectOption value="">{t("fromRoutine")}</SelectOption>
            {routines.map((r) => (
              <SelectOption key={r.id} value={r.id}>
                {r.name}
              </SelectOption>
            ))}
          </Select>
          <button
            type="button"
            className="gm-btn gm-btn-teal"
            id="start-routine"
            disabled={!routineId}
            onClick={() => {
              onStartRoutine(routineId);
              setRoutineId("");
              setShowStart(false);
            }}
          >
            {t("startRoutine")}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <Card id="workout-card" size="sm">
      <CardHeader className="grid-cols-[auto_1fr] items-center gap-2">
        <Dumbbell className="size-4 text-coral-deep" aria-hidden />
        <CardTitle>{t("workoutTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <datalist id="exercise-options">
          {exercises.map((e) => (
            <option key={e.id} value={e.name} />
          ))}
        </datalist>

        {workouts.length === 0 && (
          <div className="gm-empty" id="workout-empty">
            <p className="gm-empty-title">{t("noWorkoutYet")}</p>
            <p className="gm-hint">{t("noWorkoutHint")}</p>
          </div>
        )}
        {workouts.length === 0 ? startBlock : null}

        {workouts.map((w) => {
          const sum = workoutSummary(w);
          return (
            <section key={w.id} className="gm-session" data-workout-id={w.id} aria-label={w.name || t("workoutTitle")}>
              <div className="gm-session-head">
                <Input
                  aria-label={t("workoutNamePlaceholder")}
                  maxLength={NAME_MAX}
                  autoComplete="off"
                  placeholder={t("workoutNamePlaceholder")}
                  value={w.name ?? ""}
                  onChange={(e) => onChange({ ...w, name: e.target.value.slice(0, NAME_MAX) || undefined })}
                />
                <button type="button" className="gm-btn gm-btn-icon" aria-label={t("deleteWorkout")} onClick={() => onDeleteWorkout(w.id)}>
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
              <div className="gm-row-meta">
                <span>{t("exercisesCount", { n: sum.exercises })}</span>
                <span>·</span>
                <span>{t("setsCount", { n: sum.sets })}</span>
                <span>·</span>
                <span>{t("volumeLabel", { v: fmt(toDisplay(sum.volumeKg), 0), u: unit })}</span>
              </div>

              {w.items.map((item) => (
                <div key={item.id} className="gm-exercise" data-item-id={item.id}>
                  <div className="gm-exercise-head">
                    <p className="gm-exercise-name">{item.exerciseName}</p>
                    <button type="button" className="gm-btn gm-btn-icon" aria-label={t("deleteExercise")} onClick={() => onDeleteExercise(w.id, item.id)}>
                      <X className="size-4" aria-hidden />
                    </button>
                  </div>
                  {item.sets.length === 0 ? (
                    <p className="gm-hint">{t("noSetsHint")}</p>
                  ) : (
                    <>
                      <div className="gm-set-head" aria-hidden>
                        <span>{t("setLabel")}</span>
                        <span>
                          {t("weightLabel")} ({unit})
                        </span>
                        <span>{t("repsLabel")}</span>
                        <span />
                      </div>
                      {item.sets.map((s, idx) => (
                        <div key={s.id} className="gm-set" data-set-id={s.id}>
                          <span className="gm-set-no">{idx + 1}</span>
                          <NumField
                            ariaLabel={`${t("weightLabel")} ${idx + 1}`}
                            className="gm-set-input"
                            value={toDisplay(s.weightKg)}
                            placeholder="0"
                            onCommit={(n) => updateSet(w, item, s, { weightKg: n === undefined ? 0 : toKg(n) })}
                          />
                          <NumField
                            ariaLabel={`${t("repsLabel")} ${idx + 1}`}
                            className="gm-set-input"
                            integer
                            value={s.reps}
                            placeholder="0"
                            onCommit={(n) => updateSet(w, item, s, { reps: n ?? 0 })}
                          />
                          <button type="button" className="gm-btn gm-btn-icon" aria-label={t("deleteSet")} onClick={() => deleteSet(w, item, s.id)}>
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                  <div className="gm-actions">
                    <button type="button" className="gm-btn gm-btn-sm gm-btn-quiet" onClick={() => addSet(w, item)}>
                      <Plus className="size-4" aria-hidden />
                      {t("addSet")}
                    </button>
                    <button type="button" className="gm-btn gm-btn-sm gm-btn-teal" onClick={onRest}>
                      <Timer className="size-4" aria-hidden />
                      {t("restBtn")} {restSeconds}
                      {t("secondsUnit")}
                    </button>
                  </div>
                </div>
              ))}

              <form
                className="gm-set-tools"
                onSubmit={(e) => {
                  e.preventDefault();
                  submitExercise(w);
                }}
              >
                <Input
                  id={`exercise-name-${w.id}`}
                  list="exercise-options"
                  maxLength={NAME_MAX}
                  autoComplete="off"
                  enterKeyHint="done"
                  placeholder={t("exerciseNamePlaceholder")}
                  value={exerciseText[w.id] ?? ""}
                  onChange={(e) => setExerciseText((m) => ({ ...m, [w.id]: e.target.value }))}
                />
                <button type="submit" className="gm-btn gm-btn-primary w-auto" disabled={!(exerciseText[w.id] ?? "").trim()}>
                  <Plus className="size-4" aria-hidden />
                  {t("addExercise")}
                </button>
              </form>

              <div>
                <label className="gm-field-label" htmlFor={`notes-${w.id}`}>
                  {t("notesLabel")}
                </label>
                <textarea
                  id={`notes-${w.id}`}
                  className="gm-textarea"
                  rows={2}
                  maxLength={NOTES_MAX}
                  placeholder={t("notesPlaceholder")}
                  value={w.notes ?? ""}
                  onChange={(e) => onChange({ ...w, notes: e.target.value.slice(0, NOTES_MAX) || undefined })}
                />
              </div>
            </section>
          );
        })}

        {workouts.length > 0 &&
          (showStart ? (
            startBlock
          ) : (
            <button type="button" className="gm-btn gm-btn-sm gm-btn-quiet" id="start-another" onClick={() => setShowStart(true)}>
              <Plus className="size-4" aria-hidden />
              {t("startWorkout")}
            </button>
          ))}
      </CardContent>
    </Card>
  );
}
