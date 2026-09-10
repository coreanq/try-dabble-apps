import { MilestoneBadge } from "@/components/trail-art";
import type { Lang, Translate } from "@/lib/i18n";
import type { MilestoneStatus } from "@/lib/progress";
import { localized } from "@/lib/routes";

export function MilestoneList({
  items,
  lang,
  t,
  distance,
  formatDate,
}: {
  items: MilestoneStatus[];
  lang: Lang;
  t: Translate;
  distance: (miles: number) => string;
  formatDate: (date: string) => string;
}) {
  if (items.length === 0) {
    return (
      <p className="tq-hint" id="milestones-empty">
        {t("noMilestones")}
      </p>
    );
  }
  return (
    <ol className="tq-ms-list" id="milestone-list">
      {items.map((m) => (
        <li key={m.milestone.id} className="tq-ms" data-milestone={m.milestone.id} data-unlocked={m.unlocked ? "true" : "false"}>
          <MilestoneBadge unlocked={m.unlocked} className="tq-ms-badge" />
          <div className="tq-ms-main">
            <span className="tq-ms-name">{localized(m.milestone.name, lang)}</span>
            {m.milestone.description && <span className="tq-ms-desc">{localized(m.milestone.description, lang)}</span>}
          </div>
          <div className="tq-ms-dist">
            <span className="tq-ms-miles">{distance(m.milestone.milesFromStart)}</span>
            <span className="tq-ms-state">{m.unlocked && m.unlockedOn ? t("unlockedOn", { date: formatDate(m.unlockedOn) }) : t("locked")}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
