import { useState } from "react";
import { ListChecks, Play, Plus, Trash2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Translate } from "@/lib/i18n";
import { NAME_MAX, type Routine } from "@/lib/model";

export interface RoutineDraft {
  name: string;
  exerciseNames: string[];
}

/** Unlimited named exercise lists. "Start" seeds a session on the selected day; nothing is locked. */
export function RoutinesCard({
  t,
  routines,
  onAdd,
  onDelete,
  onStart,
}: {
  t: Translate;
  routines: Routine[];
  onAdd: (draft: RoutineDraft) => void;
  onDelete: (id: string) => void;
  onStart: (id: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [lines, setLines] = useState("");
  const [error, setError] = useState("");

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return setError(t("needName"));
    const names = lines
      .split(/\r?\n/)
      .map((s) => s.trim().slice(0, NAME_MAX))
      .filter(Boolean);
    if (names.length === 0) return setError(t("needExercises"));
    onAdd({ name: trimmed.slice(0, NAME_MAX), exerciseNames: names });
    setName("");
    setLines("");
    setError("");
    setAdding(false);
  }

  return (
    <Card id="routines-card" size="sm">
      <CardHeader className="grid-cols-[auto_1fr_auto] items-center gap-2">
        <ListChecks className="size-4 text-coral-deep" aria-hidden />
        <CardTitle>{t("routinesTitle")}</CardTitle>
        <button type="button" className="gm-btn gm-btn-sm gm-btn-quiet" id="add-routine" aria-expanded={adding} onClick={() => setAdding((v) => !v)}>
          <Plus className="size-4" aria-hidden />
          {t("addRoutine")}
        </button>
      </CardHeader>
      <CardContent className="grid gap-2">
        {adding && (
          <form
            className="grid gap-2 gm-session"
            id="routine-form"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <div>
              <label className="gm-field-label" htmlFor="routine-name">
                {t("routineName")}
              </label>
              <Input id="routine-name" maxLength={NAME_MAX} autoComplete="off" value={name} onChange={(e) => { setName(e.target.value); if (error) setError(""); }} />
            </div>
            <div>
              <label className="gm-field-label" htmlFor="routine-lines">
                {t("routineExercises")}
              </label>
              <textarea id="routine-lines" className="gm-textarea" rows={3} placeholder={t("routineExercisesPlaceholder")} value={lines} onChange={(e) => { setLines(e.target.value); if (error) setError(""); }} />
            </div>
            {error && (
              <p className="gm-error" role="alert" id="routine-error">
                {error}
              </p>
            )}
            <div className="gm-actions">
              <button type="button" className="gm-btn gm-btn-quiet" id="routine-cancel" onClick={() => setAdding(false)}>
                {t("cancel")}
              </button>
              <button type="submit" className="gm-btn gm-btn-primary" id="routine-save">
                {t("save")}
              </button>
            </div>
          </form>
        )}
        {routines.length === 0 ? (
          <div className="gm-empty" id="routines-empty">
            <p className="gm-hint">{t("noRoutines")}</p>
          </div>
        ) : (
          <ul className="gm-list" id="routines-list">
            {routines.map((r) => (
              <li key={r.id} className="gm-row" data-routine-id={r.id}>
                <div className="gm-row-main">
                  <p className="gm-row-text">{r.name}</p>
                  <div className="gm-row-meta">
                    <span>{t("exercisesCount", { n: r.exerciseNames.length })}</span>
                    <span className="truncate">{r.exerciseNames.join(" · ")}</span>
                  </div>
                </div>
                <div className="gm-row-actions">
                  <button type="button" className="gm-btn gm-btn-icon text-teal-deep" aria-label={t("startRoutine")} onClick={() => onStart(r.id)}>
                    <Play className="size-4" aria-hidden />
                  </button>
                  <button type="button" className="gm-btn gm-btn-icon" aria-label={t("deleteRoutine")} onClick={() => onDelete(r.id)}>
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="gm-hint">{t("routineHint")}</p>
      </CardContent>
    </Card>
  );
}
