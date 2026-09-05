import { Button } from "@/components/ui/button";
import { statusLabel, typeLabel, type Lang, type MsgKey } from "@/lib/i18n";
import type { ShelfItem } from "@/lib/items";

const touch = { fontSize: 16, touchAction: "manipulation" as const };

export function ItemCard({
  item,
  lang,
  t,
  onEdit,
  onDelete,
}: {
  item: ShelfItem;
  lang: Lang;
  t: (key: MsgKey) => string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="ms-label" id={`item-${item.id}`} data-type={item.type}>
      <div className="ms-label-body">
        <div className="ms-aisle">{typeLabel(lang, item.type)}</div>
        <h3 className="ms-store-name">{item.title}</h3>
        {item.status ? (
          <p className="ms-status">{statusLabel(lang, item.status)}</p>
        ) : null}
        {item.tags.length > 0 ? (
          <ul className="ms-chips ms-item-tags">
            {item.tags.map((tag) => (
              <li className="ms-chip" data-kind="yes" key={tag}>
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
        {item.notes ? <p className="ms-notes">{item.notes}</p> : null}
      </div>
      <div className="ms-label-actions flex gap-2 mt-2">
        <Button id={`edit-${item.id}`} size="sm" variant="secondary" onClick={onEdit} style={touch}>
          {t("openEdit")}
        </Button>
        <Button
          id={`delete-${item.id}`}
          size="sm"
          variant="destructive"
          onClick={onDelete}
          style={touch}
        >
          {t("delete")}
        </Button>
      </div>
    </article>
  );
}
