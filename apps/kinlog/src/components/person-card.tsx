import { Button } from "@/components/ui/button";
import type { Translate } from "@/lib/i18n";
import {
  MAX_CONTEXT,
  MAX_NOTES,
  addDays,
  addMonths,
  daysUntil,
  notesPreview,
  tabLetter,
  todayISO,
  type Person,
} from "@/lib/people";

export interface PersonPatch {
  context?: string;
  notes?: string;
  lastContact?: string;
  nextContact?: string;
}

type Tone = "overdue" | "due" | "none";

/** The next-contact stamp, in words. Overdue and due-today share the red
 *  stamp, because "today" is the last moment it is still not late. */
function nextStamp(person: Person, t: Translate): { text: string; tone: Tone } {
  const n = daysUntil(person.nextContact);
  if (n === null) return { text: t("statusNoNext"), tone: "none" };
  if (n < 0) return { text: t("statusOverdue", { n: -n }), tone: "overdue" };
  if (n === 0) return { text: t("statusToday"), tone: "overdue" };
  return { text: t("statusInDays", { n }), tone: "due" };
}

function lastMark(person: Person, t: Translate): string {
  const n = daysUntil(person.lastContact);
  if (n === null) return t("lastNever");
  if (n === 0) return t("lastToday");
  return t("lastAgo", { n: -n });
}

/**
 * One index card. Collapsed it shows the name, the context line, the first
 * line of the notes and the two dates. Open it and the notes become an
 * editable ruled page that writes straight through to storage — there is no
 * Save button anywhere in this app, and nothing is lost on reload.
 */
export function PersonCard({
  person,
  t,
  open,
  overdue,
  dateLabel,
  onToggle,
  onPatch,
  onDelete,
}: {
  person: Person;
  t: Translate;
  open: boolean;
  overdue: boolean;
  dateLabel: (iso: string) => string;
  onToggle: (id: string) => void;
  onPatch: (id: string, patch: PersonPatch) => void;
  onDelete: (person: Person) => void;
}) {
  const stamp = nextStamp(person, t);
  const bodyId = `person-body-${person.id}`;

  function setNext(iso: string) {
    onPatch(person.id, { nextContact: iso });
  }

  return (
    <article
      className="kl-card"
      data-open={open}
      data-overdue={overdue}
      data-person-card=""
    >
      <span className="kl-tab" aria-hidden="true">
        {tabLetter(person)}
      </span>

      <button
        type="button"
        className="kl-open-btn"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => onToggle(person.id)}
      >
        <h3 className="kl-name">{person.name}</h3>
        {person.context ? <p className="kl-context">{person.context}</p> : null}
        {!open && notesPreview(person) ? (
          <p className="kl-preview">{notesPreview(person)}</p>
        ) : null}
        <div className="mt-[0.4rem] flex flex-wrap items-center gap-x-[0.55rem] gap-y-[0.3rem]">
          <span className="kl-stamp" data-tone={stamp.tone}>
            {stamp.text}
          </span>
          <span className="kl-datemark">
            {t("lastContactLabel")}: {lastMark(person, t)}
          </span>
        </div>
        <span className="sr-only">{open ? t("closeCard") : t("openCard")}</span>
      </button>

      {open ? (
        <div className="mt-[0.6rem] flex flex-col gap-[0.55rem]" id={bodyId}>
          <div className="h-px bg-rule" />

          <div>
            <label className="kl-label" htmlFor={`context-${person.id}`}>
              {t("contextCardLabel")}
            </label>
            <input
              id={`context-${person.id}`}
              className="kl-field mt-[0.25rem]"
              type="text"
              autoComplete="off"
              maxLength={MAX_CONTEXT}
              value={person.context}
              placeholder={t("contextPlaceholder")}
              onChange={(e) => onPatch(person.id, { context: e.target.value })}
            />
          </div>

          <div>
            <label className="kl-label" htmlFor={`notes-${person.id}`}>
              {t("notesLabel")}
            </label>
            <textarea
              id={`notes-${person.id}`}
              className="kl-field mt-[0.25rem]"
              rows={5}
              maxLength={MAX_NOTES}
              value={person.notes}
              placeholder={t("notesPlaceholder")}
              onChange={(e) => onPatch(person.id, { notes: e.target.value })}
            />
            <p
              className="mt-[0.25rem] mb-0 text-[0.7rem] leading-[1.4] text-muted-ink"
              id={`notes-hint-${person.id}`}
            >
              {t("notesAutosave")}
            </p>
          </div>

          <div className="flex flex-col gap-[0.3rem]">
            <label className="kl-label" htmlFor={`last-${person.id}`}>
              {t("lastContactLabel")}
            </label>
            <div className="flex flex-wrap items-center gap-[0.35rem]">
              <input
                id={`last-${person.id}`}
                className="kl-field kl-date h-10 w-auto flex-1 basis-[9.5rem] py-0"
                type="date"
                value={person.lastContact}
                onChange={(e) => onPatch(person.id, { lastContact: e.target.value })}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onPatch(person.id, { lastContact: todayISO() })}
              >
                {t("contactedToday")}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-[0.3rem]">
            <label className="kl-label" htmlFor={`next-${person.id}`}>
              {t("nextContactLabel")}
            </label>
            <input
              id={`next-${person.id}`}
              className="kl-field kl-date h-10 py-0"
              type="date"
              value={person.nextContact}
              onChange={(e) => onPatch(person.id, { nextContact: e.target.value })}
            />
            {/* The reminder interval the store apps keep forgetting. Written
                to storage the moment it is tapped, never reset by the app. */}
            <div className="flex flex-wrap gap-[0.35rem]">
              <Button
                variant="outline"
                size="xs"
                onClick={() => setNext(addDays(todayISO(), 7))}
              >
                {t("plusWeek")}
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setNext(addMonths(todayISO(), 1))}
              >
                {t("plusMonth")}
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setNext(addMonths(todayISO(), 3))}
              >
                {t("plusThreeMonths")}
              </Button>
              {person.nextContact ? (
                <Button variant="ghost" size="xs" onClick={() => setNext("")}>
                  {t("clearNext")}
                </Button>
              ) : null}
            </div>
            {person.nextContact ? (
              <p className="kl-datemark m-0">{dateLabel(person.nextContact)}</p>
            ) : null}
          </div>

          <div className="flex justify-end">
            <Button
              variant="destructive"
              size="sm"
              data-delete-person=""
              onClick={() => onDelete(person)}
            >
              {t("deletePerson")}
            </Button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
