import { useEffect, useRef, useState } from "react";
import { Camera, Link2, Loader2, Trash2 } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { extractFromUrl, fetchPhotoDataUrl, type ExtractFailReason } from "@/lib/extract";
import type { Translate } from "@/lib/i18n";
import { compressImage } from "@/lib/photo";
import {
  ingredientsToLines,
  linesToIngredients,
  linesToSteps,
  newId,
  normalizeTags,
  stepsToLines,
  type Recipe,
} from "@/lib/recipes";

interface Draft {
  title: string;
  photoDataUrl: string;
  prepMin: string;
  cookMin: string;
  totalMin: string;
  servingsBase: string;
  tags: string;
  notes: string;
  ingredients: string;
  steps: string;
  sourceUrl: string;
}

const EMPTY: Draft = {
  title: "",
  photoDataUrl: "",
  prepMin: "",
  cookMin: "",
  totalMin: "",
  servingsBase: "",
  tags: "",
  notes: "",
  ingredients: "",
  steps: "",
  sourceUrl: "",
};

function fromRecipe(r: Recipe | null): Draft {
  if (!r) return { ...EMPTY };
  return {
    title: r.title,
    photoDataUrl: r.photoDataUrl ?? "",
    prepMin: r.prepMin ? String(r.prepMin) : "",
    cookMin: r.cookMin ? String(r.cookMin) : "",
    totalMin: r.totalMin ? String(r.totalMin) : "",
    servingsBase: r.servingsBase ? String(r.servingsBase) : "",
    tags: r.tags.join(", "),
    notes: r.notes ?? "",
    ingredients: ingredientsToLines(r.ingredients),
    steps: stepsToLines(r.steps),
    sourceUrl: r.sourceUrl ?? "",
  };
}

function minutes(v: string): number | undefined {
  const n = Number(v.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : undefined;
}

const FAIL_KEY: Record<ExtractFailReason, "extractFailBlocked" | "extractFailNoRecipe" | "extractFailBadUrl" | "extractFailFetch"> = {
  blocked: "extractFailBlocked",
  "no-recipe": "extractFailNoRecipe",
  "bad-url": "extractFailBadUrl",
  "fetch-failed": "extractFailFetch",
};

type ExtractState =
  | { kind: "idle" }
  | { kind: "busy" }
  | { kind: "ok"; photo: boolean }
  | { kind: "fail"; reason: ExtractFailReason };

/**
 * One sheet for new and edit. Lines in, lines out: ingredients and steps are
 * plain textareas (one per line) so pasting from anywhere just works — that is
 * the fallback the URL panel points at when a site blocks extraction.
 */
export function RecipeForm({
  open,
  initial,
  urlFirst,
  t,
  onOpenChange,
  onSave,
  onToast,
}: {
  open: boolean;
  initial: Recipe | null;
  urlFirst: boolean;
  t: Translate;
  onOpenChange: (open: boolean) => void;
  onSave: (recipe: Recipe) => void;
  onToast: (msg: string) => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => fromRecipe(initial));
  const [showUrl, setShowUrl] = useState(urlFirst || !initial);
  const [url, setUrl] = useState("");
  const [extract, setExtract] = useState<ExtractState>({ kind: "idle" });
  const [titleError, setTitleError] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Reset whenever the sheet opens for a different recipe.
  useEffect(() => {
    if (!open) return;
    setDraft(fromRecipe(initial));
    setShowUrl(urlFirst || !initial);
    setUrl("");
    setExtract({ kind: "idle" });
    setTitleError(false);
    setPhotoBusy(false);
  }, [open, initial, urlFirst]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  async function onPickPhoto(file: File | undefined) {
    if (!file) return;
    setPhotoBusy(true);
    try {
      const dataUrl = await compressImage(file);
      set({ photoDataUrl: dataUrl });
    } catch {
      onToast(t("photoFailed"));
    } finally {
      setPhotoBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function runExtract() {
    const target = url.trim();
    if (!target) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setExtract({ kind: "busy" });
    const res = await extractFromUrl(target, ctrl.signal);
    if (ctrl.signal.aborted) return;
    if (!res.ok) {
      setExtract({ kind: "fail", reason: res.reason });
      return;
    }
    const r = res.recipe;
    set({
      title: r.title || draft.title,
      prepMin: r.prepMin ? String(r.prepMin) : "",
      cookMin: r.cookMin ? String(r.cookMin) : "",
      totalMin: r.totalMin ? String(r.totalMin) : "",
      servingsBase: r.servingsBase ? String(r.servingsBase) : "",
      ingredients: r.ingredients.join("\n"),
      steps: r.steps.join("\n"),
      sourceUrl: r.sourceUrl || target,
    });
    let gotPhoto = false;
    if (r.photoUrl) {
      const dataUrl = await fetchPhotoDataUrl(r.photoUrl, ctrl.signal);
      if (ctrl.signal.aborted) return;
      if (dataUrl) {
        set({ photoDataUrl: dataUrl });
        gotPhoto = true;
      }
    }
    setExtract({ kind: "ok", photo: gotPhoto || !r.photoUrl });
  }

  function save() {
    const title = draft.title.trim();
    if (!title) {
      setTitleError(true);
      return;
    }
    const now = new Date().toISOString();
    const recipe: Recipe = {
      id: initial?.id ?? newId(),
      title,
      tags: normalizeTags(draft.tags),
      ingredients: linesToIngredients(draft.ingredients),
      steps: linesToSteps(draft.steps),
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    };
    if (draft.photoDataUrl) recipe.photoDataUrl = draft.photoDataUrl;
    const prep = minutes(draft.prepMin);
    const cook = minutes(draft.cookMin);
    const total = minutes(draft.totalMin);
    const servings = minutes(draft.servingsBase);
    const notes = draft.notes.trim();
    const source = draft.sourceUrl.trim();
    if (prep) recipe.prepMin = prep;
    if (cook) recipe.cookMin = cook;
    if (total) recipe.totalMin = total;
    if (servings) recipe.servingsBase = servings;
    if (notes) recipe.notes = notes;
    if (/^https?:\/\//i.test(source)) recipe.sourceUrl = source;
    onSave(recipe);
  }

  const busy = extract.kind === "busy";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rl-sheet" id="recipe-form">
        <DialogTitle className="rl-sheet-title">{initial ? t("formEditTitle") : t("formNewTitle")}</DialogTitle>
        <DialogDescription className="sr-only">{t("tagline")}</DialogDescription>

        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          {/* URL extract: the optional shortcut, with the fallback spelled out. */}
          {showUrl ? (
            <div className="rl-url-panel" id="url-panel">
              <label className="rl-label" htmlFor="extract-url">
                {t("urlLabel")}
              </label>
              <div className="rl-url-row">
                <input
                  id="extract-url"
                  className="rl-input"
                  type="url"
                  inputMode="url"
                  autoComplete="off"
                  placeholder={t("urlPlaceholder")}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void runExtract();
                    }
                  }}
                />
                <button type="button" id="extract-run" className="rl-btn rl-btn-sm" disabled={busy || !url.trim()} onClick={() => void runExtract()}>
                  {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
                  {busy ? t("extracting") : t("extract")}
                </button>
              </div>
              {extract.kind === "ok" && (
                <p className="rl-hint rl-hint-ok" id="extract-ok" role="status">
                  {extract.photo ? t("extractOk") : t("extractOkNoPhoto")}
                </p>
              )}
              {extract.kind === "fail" && (
                <p className="rl-hint rl-hint-warn" id="extract-fail" role="alert" data-reason={extract.reason}>
                  {t(FAIL_KEY[extract.reason])}
                </p>
              )}
              <p className="rl-hint" id="extract-help">
                {t("extractHelp")}
              </p>
              <p className="rl-hint" id="no-social-import">
                {t("noSocialImport")}
              </p>
            </div>
          ) : (
            <button type="button" className="rl-btn rl-btn-quiet rl-btn-sm justify-self-start" id="show-url-panel" onClick={() => setShowUrl(true)}>
              <Link2 className="size-4" aria-hidden />
              {t("fromUrl")}
            </button>
          )}

          <div className="rl-field">
            <label className="rl-label" htmlFor="f-title">
              {t("fieldTitle")}
            </label>
            <input
              id="f-title"
              className="rl-input"
              type="text"
              autoComplete="off"
              placeholder={t("titlePlaceholder")}
              value={draft.title}
              aria-invalid={titleError || undefined}
              onChange={(e) => {
                set({ title: e.target.value });
                if (e.target.value.trim()) setTitleError(false);
              }}
            />
            {titleError && (
              <p className="rl-error" id="title-error" role="alert">
                {t("titleRequired")}
              </p>
            )}
          </div>

          <div className="rl-field rl-photo-pick">
            <span className="rl-label">{t("fieldPhoto")}</span>
            {draft.photoDataUrl && <img className="rl-photo-preview" id="photo-preview" src={draft.photoDataUrl} alt="" />}
            <div className="rl-photo-buttons">
              <input
                ref={fileRef}
                id="f-photo"
                className="rl-file"
                type="file"
                accept="image/*"
                onChange={(e) => void onPickPhoto(e.target.files?.[0])}
              />
              <button type="button" className="rl-btn rl-btn-sage rl-btn-sm" id="pick-photo" disabled={photoBusy} onClick={() => fileRef.current?.click()}>
                {photoBusy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Camera className="size-4" aria-hidden />}
                {draft.photoDataUrl ? t("changePhoto") : t("choosePhoto")}
              </button>
              {draft.photoDataUrl && (
                <button type="button" className="rl-btn rl-btn-quiet rl-btn-sm" id="remove-photo" onClick={() => set({ photoDataUrl: "" })}>
                  <Trash2 className="size-4" aria-hidden />
                  {t("removePhoto")}
                </button>
              )}
            </div>
            <p className="rl-hint" id="photo-note">
              {t("photoNote")}
            </p>
          </div>

          <div className="rl-times">
            <div className="rl-field">
              <label className="rl-label" htmlFor="f-prep">
                {t("fieldPrep")} ({t("minutesShort")})
              </label>
              <input id="f-prep" className="rl-input" type="text" inputMode="numeric" placeholder="10" value={draft.prepMin} onChange={(e) => set({ prepMin: e.target.value })} />
            </div>
            <div className="rl-field">
              <label className="rl-label" htmlFor="f-cook">
                {t("fieldCook")} ({t("minutesShort")})
              </label>
              <input id="f-cook" className="rl-input" type="text" inputMode="numeric" placeholder="20" value={draft.cookMin} onChange={(e) => set({ cookMin: e.target.value })} />
            </div>
            <div className="rl-field">
              <label className="rl-label" htmlFor="f-total">
                {t("fieldTotal")} ({t("minutesShort")})
              </label>
              <input id="f-total" className="rl-input" type="text" inputMode="numeric" placeholder="30" value={draft.totalMin} onChange={(e) => set({ totalMin: e.target.value })} />
            </div>
            <div className="rl-field">
              <label className="rl-label" htmlFor="f-servings">
                {t("fieldServings")}
              </label>
              <input id="f-servings" className="rl-input" type="text" inputMode="numeric" placeholder="2" value={draft.servingsBase} onChange={(e) => set({ servingsBase: e.target.value })} />
            </div>
          </div>

          <div className="rl-field">
            <label className="rl-label" htmlFor="f-tags">
              {t("fieldTags")}
            </label>
            <input id="f-tags" className="rl-input" type="text" autoComplete="off" placeholder={t("tagsPlaceholder")} value={draft.tags} onChange={(e) => set({ tags: e.target.value })} />
          </div>

          <div className="rl-field">
            <label className="rl-label" htmlFor="f-ingredients">
              {t("fieldIngredients")}
            </label>
            <textarea id="f-ingredients" className="rl-textarea" placeholder={t("ingredientsPlaceholder")} value={draft.ingredients} onChange={(e) => set({ ingredients: e.target.value })} />
          </div>

          <div className="rl-field">
            <label className="rl-label" htmlFor="f-steps">
              {t("fieldSteps")}
            </label>
            <textarea id="f-steps" className="rl-textarea" placeholder={t("stepsPlaceholder")} value={draft.steps} onChange={(e) => set({ steps: e.target.value })} />
          </div>

          <div className="rl-field">
            <label className="rl-label" htmlFor="f-notes">
              {t("fieldNotes")}
            </label>
            <textarea id="f-notes" className="rl-textarea min-h-[4.5rem]" placeholder={t("notesPlaceholder")} value={draft.notes} onChange={(e) => set({ notes: e.target.value })} />
          </div>

          <div className="rl-field">
            <label className="rl-label" htmlFor="f-source">
              {t("fieldSource")}
            </label>
            <input id="f-source" className="rl-input" type="url" inputMode="url" autoComplete="off" placeholder="https://…" value={draft.sourceUrl} onChange={(e) => set({ sourceUrl: e.target.value })} />
          </div>

          <div className="rl-detail-actions pt-1">
            <button type="button" className="rl-btn rl-btn-quiet" id="form-cancel" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </button>
            <button type="submit" className="rl-btn" id="form-save" disabled={photoBusy || busy}>
              {t("save")}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
