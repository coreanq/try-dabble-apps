import type { Translate } from "@/lib/i18n";
import type { UpcomingEntry } from "@/lib/stash";

/**
 * Signature — one date coming up, painted on a drawer front. Inside the
 * reminder window the front is coral instead of cream.
 */
export function UpcomingDrawer({
  entry,
  soon,
  whenLabel,
  t,
  onOpen,
}: {
  entry: UpcomingEntry;
  soon: boolean;
  whenLabel: string;
  t: Translate;
  onOpen: (personId: string) => void;
}) {
  const age = entry.age ? ` · ${t("yearsOld", { n: entry.age })}` : "";

  return (
    <button
      type="button"
      className="gs-drawer"
      data-soon={soon}
      data-open-person={entry.person.id}
      onClick={() => onOpen(entry.person.id)}
    >
      <span className="gs-when block">{whenLabel}</span>
      <span className="gs-who block">{entry.person.name}</span>
      <span className="gs-what block">
        {entry.label}
        {age}
      </span>
    </button>
  );
}
