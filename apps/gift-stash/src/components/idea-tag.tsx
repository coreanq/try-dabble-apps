import { Gift, Link as LinkIcon } from "lucide-react";

import type { MsgKey, Translate } from "@/lib/i18n";
import type { Idea, Person, Status } from "@/lib/stash";
import { usePhotoUrl } from "@/lib/use-photo-url";

const STATUS_LABEL: Record<Status, MsgKey> = {
  idea: "statusIdea",
  bought: "statusBought",
  given: "statusGiven",
};

/** One gift idea on a tag: the screenshot in the window, then what it is, who
 *  it is for and where it came from. */
export function IdeaTag({
  idea,
  person,
  t,
  onEdit,
}: {
  idea: Idea;
  person: Person | undefined;
  t: Translate;
  onEdit: (idea: Idea) => void;
}) {
  const photoUrl = usePhotoUrl(idea.photoId);
  const status = idea.status || "idea";

  return (
    <article className="gs-tag flex flex-col gap-1.5 p-2 pt-5 [--snip:16px]">
      <button
        type="button"
        className="grid gap-1.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
        data-edit-idea={idea.id}
        onClick={() => onEdit(idea)}
      >
        <span className="gs-window">
          {photoUrl ? (
            <img src={photoUrl} alt="" />
          ) : (
            <Gift className="size-7 text-ribbon-deep/70" aria-hidden />
          )}
        </span>
        <span className="line-clamp-2 text-[0.82rem] leading-snug font-bold text-ink">
          {idea.title || "…"}
        </span>
        <span className="flex flex-wrap items-center gap-1 text-[0.68rem] text-muted-ink">
          <span className="gs-pip" data-status={status}>
            {t(STATUS_LABEL[status])}
          </span>
          {person ? <span className="truncate">{person.name}</span> : null}
          {idea.price ? <span className="font-bold text-foil">{idea.price}</span> : null}
        </span>
      </button>
      {idea.url ? (
        <a
          className="inline-flex items-center gap-1 text-[0.66rem] font-bold text-ribbon-deep"
          href={idea.url}
          target="_blank"
          rel="noreferrer noopener"
        >
          <LinkIcon className="size-3" aria-hidden />
          {t("openLink")}
        </a>
      ) : null}
    </article>
  );
}
