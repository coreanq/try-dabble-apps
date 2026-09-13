import { useState } from "react";
import { ChevronDown, ChevronUp, Trophy } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { exerciseHistory, fmt, kgToLb, personalRecords } from "@/lib/calc";
import { formatRelativeDay } from "@/lib/format";
import type { Lang, Translate } from "@/lib/i18n";
import type { WeightUnit, Workout } from "@/lib/model";

/** Per exercise: heaviest set and best Epley e1RM, derived from every workout. Tap to unfold the full history. */
export function StrengthCard({ t, lang, unit, workouts }: { t: Translate; lang: Lang; unit: WeightUnit; workouts: Workout[] }) {
  const [openName, setOpenName] = useState<string | null>(null);
  const prs = personalRecords(workouts);
  const show = (kg: number) => fmt(unit === "lb" ? kgToLb(kg) : kg);

  return (
    <Card id="strength-card" size="sm" data-tone="teal">
      <CardHeader className="grid-cols-[auto_1fr] items-center gap-2">
        <Trophy className="size-4 text-teal-deep" aria-hidden />
        <CardTitle>{t("strengthTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        {prs.length === 0 ? (
          <div className="gm-empty" id="prs-empty">
            <p className="gm-empty-title">{t("noPRs")}</p>
            <p className="gm-hint">{t("noPRsHint")}</p>
          </div>
        ) : (
          <ul className="gm-list" id="prs-list">
            {prs.map((pr) => {
              const open = openName === pr.name;
              const history = open ? exerciseHistory(workouts, pr.name) : [];
              return (
                <li key={pr.name} className="gm-pr" data-exercise={pr.name}>
                  <div className="gm-pr-head">
                    <div className="gm-row-main">
                      <p className="gm-exercise-name">{pr.name}</p>
                      <div className="gm-row-meta">
                        <span>{t("sessionsCount", { n: pr.sessions })}</span>
                        <span>·</span>
                        <span>{t("setsCount", { n: pr.sets })}</span>
                        <span>·</span>
                        <span>{formatRelativeDay(lang, pr.lastDate)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="gm-btn gm-btn-icon"
                      aria-expanded={open}
                      aria-label={open ? t("hideHistory") : t("showHistory")}
                      onClick={() => setOpenName(open ? null : pr.name)}
                    >
                      {open ? <ChevronUp className="size-4" aria-hidden /> : <ChevronDown className="size-4" aria-hidden />}
                    </button>
                  </div>
                  <div className="gm-pr-stats">
                    <div className="gm-stat" data-tone="teal">
                      <span className="gm-stat-label">{t("heaviest")}</span>
                      <span className="gm-stat-value text-[1.05em]">
                        {show(pr.heaviest.weightKg)} {unit} × {pr.heaviest.reps}
                      </span>
                    </div>
                    <div className="gm-stat">
                      <span className="gm-stat-label">{t("e1rm")}</span>
                      <span className="gm-stat-value text-[1.05em]">
                        {show(pr.best.e1rm)} {unit}
                      </span>
                    </div>
                  </div>
                  {open && (
                    <ul className="gm-history" id={`history-${pr.name}`}>
                      {history.map((h) => (
                        <li key={h.workoutId + h.date} className="gm-history-row">
                          <span className="gm-history-date">{formatRelativeDay(lang, h.date)}</span>
                          <span className="gm-history-sets">
                            {h.sets.length === 0 ? "—" : h.sets.map((s) => `${show(s.weightKg)}×${s.reps}`).join("  ")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <p className="gm-hint">{t("e1rmNote")}</p>
      </CardContent>
    </Card>
  );
}
