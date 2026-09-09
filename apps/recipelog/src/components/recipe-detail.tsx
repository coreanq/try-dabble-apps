import { useEffect, useRef, useState } from "react";
import { ChefHat, Clock, ExternalLink, Minus, Pencil, Plus, ShoppingBasket, Trash2 } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { Translate } from "@/lib/i18n";
import { parseLeadingQty, scaleFactor, scaleIngredientText, totalMinutes, type Recipe } from "@/lib/recipes";

function mmss(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** Cook mode: one step at a time, big type, and a plain countdown. */
function CookMode({
  recipe,
  t,
  timerSec,
  onTimerSecChange,
  onExit,
}: {
  recipe: Recipe;
  t: Translate;
  timerSec: number;
  onTimerSecChange: (sec: number) => void;
  onExit: () => void;
}) {
  const steps = recipe.steps;
  const [idx, setIdx] = useState(0);
  const [minutesText, setMinutesText] = useState(String(Math.max(1, Math.round(timerSec / 60))));
  const [remaining, setRemaining] = useState(timerSec);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const endAt = useRef<number>(0);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const left = Math.max(0, (endAt.current - Date.now()) / 1000);
      setRemaining(left);
      if (left <= 0) {
        setRunning(false);
        setDone(true);
        try {
          navigator.vibrate?.([200, 100, 200]);
        } catch {
          /* no vibration */
        }
      }
    };
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [running]);

  function start() {
    const mins = Math.max(1, Math.min(1440, Math.round(Number(minutesText) || 0)));
    const total = done || remaining <= 0 ? mins * 60 : remaining;
    if (!running && (done || remaining === timerSec)) onTimerSecChange(mins * 60);
    endAt.current = Date.now() + total * 1000;
    setRemaining(total);
    setDone(false);
    setRunning(true);
  }

  function reset() {
    const mins = Math.max(1, Math.min(1440, Math.round(Number(minutesText) || 0)));
    setRunning(false);
    setDone(false);
    setRemaining(mins * 60);
    onTimerSecChange(mins * 60);
  }

  const total = steps.length;
  const step = steps[idx];

  return (
    <div className="rl-cook" id="cook-mode">
      <div className="rl-cook-step" aria-live="polite">
        <span className="rl-cook-counter" id="cook-counter">
          {total > 0 ? t("cookStep", { n: idx + 1, total }) : t("stepsHeading")}
        </span>
        <span id="cook-text">{step ? step.text : "—"}</span>
      </div>
      <div className="rl-cook-nav">
        <button type="button" className="rl-btn rl-btn-quiet" id="cook-prev" disabled={idx === 0} onClick={() => setIdx((i) => Math.max(0, i - 1))}>
          {t("prev")}
        </button>
        {idx + 1 < total ? (
          <button type="button" className="rl-btn" id="cook-next" onClick={() => setIdx((i) => Math.min(total - 1, i + 1))}>
            {t("next")}
          </button>
        ) : (
          <button type="button" className="rl-btn rl-btn-sage" id="cook-finish" onClick={onExit}>
            {t("finish")}
          </button>
        )}
      </div>

      <div className="rl-timer" id="cook-timer">
        <span className="rl-label">{t("timer")}</span>
        <div className="rl-timer-row">
          <span className="rl-timer-display" id="timer-display" data-done={done ? "true" : "false"} role="timer" aria-live={done ? "assertive" : "off"}>
            {done ? t("timerDone") : mmss(remaining)}
          </span>
          <label className="sr-only" htmlFor="timer-minutes">
            {t("timerMinutes")}
          </label>
          <input
            id="timer-minutes"
            className="rl-input rl-timer-min"
            type="text"
            inputMode="numeric"
            value={minutesText}
            disabled={running}
            onChange={(e) => setMinutesText(e.target.value)}
            onBlur={reset}
          />
          <span className="text-[0.85rem] font-bold text-ink-muted">{t("timerMinutes")}</span>
        </div>
        <div className="rl-timer-row">
          {running ? (
            <button type="button" className="rl-btn rl-btn-quiet rl-btn-sm" id="timer-pause" onClick={() => setRunning(false)}>
              {t("timerPause")}
            </button>
          ) : (
            <button type="button" className="rl-btn rl-btn-sage rl-btn-sm" id="timer-start" onClick={start}>
              {t("timerStart")}
            </button>
          )}
          <button type="button" className="rl-btn rl-btn-quiet rl-btn-sm" id="timer-reset" onClick={reset}>
            {t("timerReset")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function RecipeDetail({
  recipe,
  open,
  t,
  timerSec,
  onTimerSecChange,
  onOpenChange,
  onEdit,
  onDelete,
  onAddShopping,
}: {
  recipe: Recipe | null;
  open: boolean;
  t: Translate;
  timerSec: number;
  onTimerSecChange: (sec: number) => void;
  onOpenChange: (open: boolean) => void;
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipe: Recipe) => void;
  onAddShopping: (recipe: Recipe, lines: string[]) => void;
}) {
  const base = recipe?.servingsBase && recipe.servingsBase > 0 ? recipe.servingsBase : 1;
  const [servings, setServings] = useState(base);
  const [cooking, setCooking] = useState(false);

  useEffect(() => {
    setServings(base);
    setCooking(false);
  }, [recipe?.id, base, open]);

  if (!recipe) return null;
  const factor = scaleFactor(recipe.servingsBase, servings);
  const scaledLines = recipe.ingredients.map((i) => scaleIngredientText(i.text, factor));
  const total = totalMinutes(recipe);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rl-sheet" id="recipe-detail" data-recipe-id={recipe.id}>
        <DialogTitle className="rl-sheet-title" id="detail-title">
          {recipe.title}
        </DialogTitle>
        <DialogDescription className="sr-only">{recipe.title}</DialogDescription>

        {cooking ? (
          <CookMode recipe={recipe} t={t} timerSec={timerSec} onTimerSecChange={onTimerSecChange} onExit={() => setCooking(false)} />
        ) : (
          <div className="grid gap-3">
            {recipe.photoDataUrl && <img className="rl-detail-photo" id="detail-photo" src={recipe.photoDataUrl} alt="" />}

            <div className="rl-meta text-[0.86rem]" id="detail-meta">
              {total !== undefined && (
                <span className="rl-time">
                  <Clock aria-hidden />
                  {t("totalShort", { n: total })}
                </span>
              )}
              {recipe.prepMin !== undefined && <span>{t("prepShort", { n: recipe.prepMin })}</span>}
              {recipe.cookMin !== undefined && <span>{t("cookShort", { n: recipe.cookMin })}</span>}
            </div>
            {recipe.tags.length > 0 && (
              <div className="rl-tags" id="detail-tags">
                {recipe.tags.map((tag) => (
                  <span key={tag} className="rl-tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {recipe.ingredients.length > 0 && (
              <section className="grid gap-2" aria-labelledby="ingredients-heading">
                <h3 className="rl-section-title" id="ingredients-heading">
                  <span>{t("ingredientsHeading")}</span>
                  <span className="rl-servings" id="servings-control">
                    <button type="button" id="servings-minus" aria-label="−" disabled={servings <= 1} onClick={() => setServings((s) => Math.max(1, s - 1))}>
                      <Minus className="size-4" aria-hidden />
                    </button>
                    <span className="rl-servings-value" id="servings-value">
                      {t("servingsValue", { n: servings })}
                    </span>
                    <button type="button" id="servings-plus" aria-label="+" disabled={servings >= 99} onClick={() => setServings((s) => Math.min(99, s + 1))}>
                      <Plus className="size-4" aria-hidden />
                    </button>
                  </span>
                </h3>
                <ul className="rl-ingredients" id="ingredient-list">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} data-scaled={factor !== 1 && parseLeadingQty(ing.text) !== null ? "true" : "false"}>
                      <span>{scaledLines[i]}</span>
                    </li>
                  ))}
                </ul>
                <p className="rl-hint" id="scale-note">
                  {t("scaleNote")}
                </p>
              </section>
            )}

            {recipe.steps.length > 0 && (
              <section className="grid gap-2" aria-labelledby="steps-heading">
                <h3 className="rl-section-title" id="steps-heading">
                  {t("stepsHeading")}
                </h3>
                <ol className="rl-steps" id="step-list">
                  {recipe.steps.map((s, i) => (
                    <li key={i}>
                      <span className="rl-step-n">{i + 1}</span>
                      <span>{s.text}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {recipe.notes && (
              <section className="grid gap-2" aria-labelledby="notes-heading">
                <h3 className="rl-section-title" id="notes-heading">
                  {t("notesHeading")}
                </h3>
                <p className="rl-notes" id="detail-notes">
                  {recipe.notes}
                </p>
              </section>
            )}

            {recipe.sourceUrl && (
              <a className="inline-flex items-center gap-1 text-[0.9rem] font-bold" id="detail-source" href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" aria-hidden />
                {t("openSource")}
              </a>
            )}

            <div className="rl-detail-actions pt-1">
              {recipe.steps.length > 0 && (
                <button type="button" className="rl-btn col-span-2" id="start-cook" onClick={() => setCooking(true)}>
                  <ChefHat className="size-5" aria-hidden />
                  {t("cookMode")}
                </button>
              )}
              {recipe.ingredients.length > 0 && (
                <button type="button" className="rl-btn rl-btn-sage col-span-2" id="add-shopping" onClick={() => onAddShopping(recipe, scaledLines)}>
                  <ShoppingBasket className="size-5" aria-hidden />
                  {t("shoppingAdd")}
                </button>
              )}
              <button type="button" className="rl-btn rl-btn-quiet" id="edit-recipe" onClick={() => onEdit(recipe)}>
                <Pencil className="size-4" aria-hidden />
                {t("edit")}
              </button>
              <button type="button" className="rl-btn rl-btn-danger" id="delete-recipe" onClick={() => onDelete(recipe)}>
                <Trash2 className="size-4" aria-hidden />
                {t("delete")}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
