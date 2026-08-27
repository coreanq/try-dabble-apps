import { Button } from "@/components/ui/button";
import type { Translate } from "@/lib/i18n";
import { ageDays, daysLeft, hostOf, type Item, type Status } from "@/lib/items";
import { cn } from "@/lib/utils";

/** Language-neutral filing codes, the way a real stamp abbreviates. */
const STATUS_CODE: Record<Status, string> = {
  inbox: "IN",
  week: "WK",
  done: "OK",
  expired: "EX",
};

function displayTitle(item: Item, t: Translate): string {
  return item.title.trim() || hostOf(item.url) || t("hostFallback");
}

/**
 * The teal stamp turns amber in the last week before the 30-day sweep and
 * oxblood once the item is out of days — the pressure is on the stamp, not on
 * a separate warning row.
 */
function stampTone(item: Item): string {
  if (item.status !== "inbox" || item.pinned) return "";
  const left = daysLeft(item.createdAt);
  if (left <= 0) return "li-stamp-over";
  if (left <= 7) return "li-stamp-warn";
  return "";
}

export function ItemSlip({
  item,
  t,
  onOpen,
  onWeek,
  onDone,
  onExpire,
  onPin,
  onEdit,
  onDelete,
}: {
  item: Item;
  t: Translate;
  onOpen: (item: Item) => void;
  onWeek: (item: Item) => void;
  onDone: (item: Item) => void;
  onExpire: (item: Item) => void;
  onPin: (item: Item) => void;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
}) {
  const days = ageDays(item.createdAt);
  const age = days <= 0 ? t("ageToday") : t("ageDays", { n: days });

  return (
    <article
      className={cn(
        "li-slip",
        item.pinned && "li-slip-pinned",
        item.status === "expired" && "li-slip-expired",
      )}
    >
      <div className="flex items-start gap-[0.6rem]">
        <div className="min-w-0 flex-1">
          <div className="font-heading text-[0.95rem] leading-snug font-bold break-words text-ink">
            {displayTitle(item, t)}
          </div>
          {item.why ? (
            <p className="mt-[0.15rem] mb-0 text-[0.82rem] leading-[22px] break-words text-ink/85">
              {item.why}
            </p>
          ) : null}
          <div className="mt-[0.25rem] font-mono text-[0.68rem] break-all text-muted-ink">
            {hostOf(item.url) || item.url}
          </div>
        </div>

        <span className={cn("li-stamp shrink-0", stampTone(item))}>
          <em>{age}</em>
          <small>{STATUS_CODE[item.status]}</small>
        </span>
      </div>

      {item.pinned ? (
        <span className="mt-[0.45rem] inline-block rounded-[2px] border-[1.5px] border-amber-deep bg-amber/35 px-[0.35rem] py-[0.04rem] font-mono text-[0.62rem] font-extrabold tracking-[0.06em] text-amber-ink">
          {t("pinned")}
        </span>
      ) : null}

      <div className="mt-[0.5rem] flex flex-wrap gap-[0.32rem]">
        <Button type="button" variant="ghost" size="xs" onClick={() => onOpen(item)}>
          {t("open")}
        </Button>
        {item.status !== "week" ? (
          <Button type="button" variant="ghost" size="xs" onClick={() => onWeek(item)}>
            {t("keepWeek")}
          </Button>
        ) : null}
        {item.status !== "done" ? (
          <Button type="button" variant="ghost" size="xs" onClick={() => onDone(item)}>
            {t("markDone")}
          </Button>
        ) : null}
        {item.status !== "expired" ? (
          <Button type="button" variant="ghost" size="xs" onClick={() => onExpire(item)}>
            {t("expire")}
          </Button>
        ) : (
          <Button type="button" variant="destructive" size="xs" onClick={() => onDelete(item)}>
            {t("delete")}
          </Button>
        )}
        <Button
          type="button"
          variant={item.pinned ? "secondary" : "ghost"}
          size="xs"
          aria-pressed={item.pinned}
          onClick={() => onPin(item)}
        >
          {item.pinned ? t("unpin") : t("pin")}
        </Button>
        <Button type="button" variant="ghost" size="xs" onClick={() => onEdit(item)}>
          {t("edit")}
        </Button>
      </div>
    </article>
  );
}
