import type { Translate } from "@/lib/i18n";
import type { Person } from "@/lib/stash";
import { usePhotoUrl } from "@/lib/use-photo-url";

/**
 * A person in the filter strip. Tapping filters the ideas to them; tapping the
 * one already selected — or double-clicking any of them — opens their card,
 * exactly as the pre-Vite app behaved.
 */
export function PersonChip({
  person,
  active,
  t,
  onSelect,
  onEdit,
}: {
  person: Person;
  active: boolean;
  t: Translate;
  onSelect: (id: string) => void;
  onEdit: (person: Person) => void;
}) {
  const photoUrl = usePhotoUrl(person.photoId);

  return (
    <button
      type="button"
      className="gs-person"
      aria-pressed={active}
      title={t("editPersonAria", { name: person.name })}
      data-filter-person={person.id}
      onClick={() => (active ? onEdit(person) : onSelect(person.id))}
      onDoubleClick={() => onEdit(person)}
    >
      <span className="gs-face">
        {photoUrl ? <img src={photoUrl} alt="" /> : (person.name || "?").slice(0, 1)}
      </span>
      <span className="max-w-[7rem] truncate">{person.name}</span>
    </button>
  );
}
