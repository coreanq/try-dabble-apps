import { Shape, type ShapeKind, type ToneKey } from "@/components/shapes";
import { gameDef, type GameId } from "@/lib/games";
import type { Translate } from "@/lib/i18n";

/** Each game wears one shape and one colour, everywhere it appears. */
const FACE: Record<GameId, { kind: ShapeKind; tone: ToneKey }> = {
  pair: { kind: "heart", tone: "sun" },
  sequence: { kind: "square", tone: "sky" },
  odd: { kind: "star", tone: "mint" },
  add: { kind: "circle", tone: "peach" },
  sort: { kind: "flower", tone: "lilac" },
  tap: { kind: "triangle", tone: "grass" },
};

export function GameToken({ id, small }: { id: GameId; small?: boolean }) {
  const face = FACE[id];
  return (
    <span
      className="ps-token"
      data-size={small ? "sm" : undefined}
      style={{ ["--token-bg" as string]: "#fffdf6" }}
    >
      <Shape kind={face.kind} tone={face.tone} size={small ? 24 : 34} />
    </span>
  );
}

/**
 * One game in the picker. The whole block is the button — 4rem tall and full
 * width, so it can be hit with a thumb without looking at the screen.
 */
export function GameTile({
  id,
  t,
  onAdd,
}: {
  id: GameId;
  t: Translate;
  onAdd: (id: GameId) => void;
}) {
  const def = gameDef(id);
  return (
    <button
      type="button"
      className="ps-tile"
      id={`pick-${id}`}
      style={{ ["--tile-shadow" as string]: def.tint }}
      onClick={() => onAdd(id)}
    >
      <GameToken id={id} />
      <span className="ps-tile-name">
        {t(def.nameKey)}
        <span className="ps-tile-how">{t(def.howKey)}</span>
      </span>
      <span className="ps-tile-add" aria-hidden="true">
        +
      </span>
    </button>
  );
}
