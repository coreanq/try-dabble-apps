import { useEffect, useMemo, useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Lang, MsgKey, Translate } from "@/lib/i18n";
import { CATEGORIES, POSES, filterPoses, type CategoryFilter, type Gender, type Pose } from "@/lib/poses";
import type { GenderFilter } from "@/lib/prefs";

const CAT_KEY: Record<CategoryFilter, MsgKey> = {
  all: "catAll",
  solo: "catSolo",
  couple: "catCouple",
  travel: "catTravel",
  grad: "catGrad",
  casual: "catCasual",
  formal: "catFormal",
  adaptive: "catAdaptive",
};
const CAT_FILTERS: CategoryFilter[] = ["all", ...CATEGORIES, "adaptive"];
const GENDER_FILTERS: GenderFilter[] = ["all", "female", "male"];
const GENDER_KEY: Record<GenderFilter, MsgKey> = { all: "genderAll", female: "genderFemale", male: "genderMale" };
const TAG_KEY: Record<Gender, MsgKey> = { female: "tagFemale", male: "tagMale", any: "tagAny" };
const DIFF_KEY: Record<Pose["difficulty"], MsgKey> = { easy: "diffEasy", medium: "diffMedium", hard: "diffHard" };

/** Tiny stick figure for a library card. */
function PoseThumb({ pose }: { pose: Pose }) {
  const pt = (n: string) => pose.keypoints.find((k) => k.name === n)!;
  const bones: [string, string][] = [
    ["left_shoulder", "right_shoulder"],
    ["left_shoulder", "left_elbow"],
    ["left_elbow", "left_wrist"],
    ["right_shoulder", "right_elbow"],
    ["right_elbow", "right_wrist"],
    ["left_shoulder", "left_hip"],
    ["right_shoulder", "right_hip"],
    ["left_hip", "right_hip"],
    ["left_hip", "left_knee"],
    ["left_knee", "left_ankle"],
    ["right_hip", "right_knee"],
    ["right_knee", "right_ankle"],
  ];
  const nose = pt("nose");
  return (
    <svg viewBox="0 0 100 133" className="pg-thumb" aria-hidden="true" focusable="false">
      <circle cx={nose.x * 100} cy={nose.y * 133 - 3} r="7" fill="#e11d48" />
      {bones.map(([a, b]) => (
        <line
          key={`${a}${b}`}
          x1={pt(a).x * 100}
          y1={pt(a).y * 133}
          x2={pt(b).x * 100}
          y2={pt(b).y * 133}
          stroke="#e11d48"
          strokeWidth="5"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

/**
 * The pose library sheet: category chips, Everyone / Female / Male, a search
 * box (never auto-focused: the keyboard would hide the grid) and a grid of
 * cards. No lock icons exist because nothing is locked.
 */
export function PoseLibrary({
  open,
  lang,
  t,
  category,
  gender,
  selectedId,
  onCategory,
  onGender,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  lang: Lang;
  t: Translate;
  category: string;
  gender: GenderFilter;
  selectedId: string;
  onCategory: (c: CategoryFilter) => void;
  onGender: (g: GenderFilter) => void;
  onOpenChange: (open: boolean) => void;
  onPick: (pose: Pose) => void;
}) {
  const [query, setQuery] = useState("");
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const cat = (CAT_FILTERS as string[]).includes(category) ? (category as CategoryFilter) : "all";
  const shown = useMemo(() => filterPoses(POSES, { category: cat, gender, query, lang }), [cat, gender, query, lang]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent id="pose-library" className="gap-3">
        <DialogHeader>
          <DialogTitle className="pr-8">{t("libraryTitle")}</DialogTitle>
          <DialogDescription id="library-count">{t("posesCount", { n: POSES.length })} · {t("libraryHint")}</DialogDescription>
        </DialogHeader>

        <div className="pg-chip-row" role="group" aria-label={t("catAll")} id="category-filters">
          {CAT_FILTERS.map((c) => (
            <button
              key={c}
              type="button"
              className="pg-filter"
              data-cat={c}
              aria-pressed={cat === c}
              onClick={() => onCategory(c)}
            >
              {t(CAT_KEY[c])}
            </button>
          ))}
        </div>
        <div className="pg-chip-row" role="group" aria-label={t("genderAll")} id="gender-filters">
          {GENDER_FILTERS.map((g) => (
            <button
              key={g}
              type="button"
              className="pg-filter pg-filter-gender"
              data-gender={g}
              aria-pressed={gender === g}
              onClick={() => onGender(g)}
            >
              {t(GENDER_KEY[g])}
            </button>
          ))}
        </div>

        <input
          id="pose-search"
          className="pg-search"
          type="search"
          inputMode="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {shown.length === 0 ? (
          <p className="pg-hint" id="pose-no-match">
            {t("noMatch")}
          </p>
        ) : (
          <ul className="pg-grid" role="listbox" aria-label={t("libraryTitle")} id="pose-grid">
            {shown.map((p) => (
              <li key={p.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={p.id === selectedId}
                  className="pg-card"
                  data-pose={p.id}
                  data-gender={p.gender}
                  onClick={() => {
                    onPick(p);
                    onOpenChange(false);
                  }}
                >
                  <PoseThumb pose={p} />
                  <span className="pg-card-name">{p.name[lang]}</span>
                  <span className="pg-card-tags">
                    <span className="pg-tag" data-tag={p.gender}>{t(TAG_KEY[p.gender])}</span>
                    {(p.seated || p.adaptive) && <span className="pg-tag pg-tag-seated">{t("tagSeated")}</span>}
                    <span className="pg-tag pg-tag-diff">{t(DIFF_KEY[p.difficulty])}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
