import { colorFor, initialsFor, TEMPLATE_MAP } from "@/lib/templates";

/**
 * Local brand tile: initials (or the template's short label) on a colour.
 * Nothing is fetched; a subscription without a template gets a stable
 * colour derived from its category or name.
 */
export function SubTile({
  name,
  iconKey,
  categoryId,
  color,
  small = false,
}: {
  name: string;
  iconKey?: string;
  categoryId?: string;
  color?: string;
  small?: boolean;
}) {
  const tpl = iconKey ? TEMPLATE_MAP[iconKey] : undefined;
  const label = tpl ? tpl.tile.label : initialsFor(name);
  const bg = color || (tpl ? tpl.tile.color : colorFor(name, categoryId));
  const long = [...label].length > 2;
  return (
    <span className={"sb-tile" + (small ? " is-sm" : "") + (long ? " is-long" : "")} style={{ background: bg }} aria-hidden="true">
      {label}
    </span>
  );
}
