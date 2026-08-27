import { Button } from "@/components/ui/button";
import { daysUntil } from "@/lib/dates";
import type { Translate } from "@/lib/i18n";
import type { Leftover, Status, StoredLocation } from "@/lib/leftovers";

function stamp(t: Translate, eatBy: string) {
  const n = daysUntil(eatBy);
  if (n < 0) return { tone: "lb-stamp-overdue", dday: t("badgeOverdue"), overdue: true };
  if (n === 0) return { tone: "lb-stamp-today", dday: t("badgeToday"), overdue: false };
  return { tone: "lb-stamp-ok", dday: t("badgeDays", { n }), overdue: false };
}

function locationLabel(t: Translate, loc: StoredLocation): string {
  if (loc === "fridge") return t("locFridgeShort");
  if (loc === "freezer") return t("locFreezerShort");
  if (loc === "other") return t("locOtherShort");
  return "";
}

/** A leftover as a wax-paper note taped to the fridge door. */
export function LeftoverNote({
  item,
  status,
  t,
  onEaten,
  onEdit,
  onDelete,
}: {
  item: Leftover;
  status: Status;
  t: Translate;
  onEaten: (item: Leftover) => void;
  onEdit: (item: Leftover) => void;
  onDelete: (item: Leftover) => void;
}) {
  const badge = stamp(t, item.eatBy);
  const loc = locationLabel(t, item.location);
  const overdue = status === "open" && badge.overdue;

  return (
    <article className={"lb-note" + (overdue ? " lb-note-overdue" : "")}>
      <div className="font-heading text-base leading-[1.3] font-bold break-words">
        {item.name}
      </div>
      <div className="mt-[0.4rem] flex flex-wrap items-center gap-x-[0.55rem] gap-y-[0.4rem]">
        <span className={"lb-stamp " + badge.tone} title={item.eatBy}>
          <em>{badge.dday}</em>
          <small>{item.eatBy}</small>
        </span>
        <span className="text-[0.7rem] text-muted-ink">
          {status === "eaten"
            ? t("eatenOn", { d: item.eatenOn })
            : t("cookedLabel", { d: item.cookedOn }) + (loc ? ` · ${loc}` : "")}
        </span>
      </div>
      {item.note ? (
        <div className="mt-1 text-[0.78rem] break-words text-ink">{item.note}</div>
      ) : null}
      <div className="mt-[0.55rem] flex flex-wrap gap-[0.35rem]">
        {status === "open" ? (
          <Button size="sm" onClick={() => onEaten(item)}>
            {t("eaten")}
          </Button>
        ) : null}
        <Button size="sm" variant="ghost" onClick={() => onEdit(item)}>
          {t("edit")}
        </Button>
        <Button size="sm" variant="destructive" onClick={() => onDelete(item)}>
          {t("delete")}
        </Button>
      </div>
    </article>
  );
}
