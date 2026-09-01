import { Pause, Play, SkipForward, Square } from "lucide-react";

/**
 * The one key on the deck. It is deliberately enormous: an operator taps it in
 * the dark, with a thumb, without looking. It never advances on its own — the
 * "armed" face is what a finished track leaves behind, and only a tap moves on.
 */
export type GoState = "empty" | "ready" | "live" | "held" | "armed" | "end";

const FACE: Record<GoState, string> = {
  empty: "pc-go-dead",
  ready: "pc-go-ready",
  live: "pc-go-live",
  held: "pc-go-live",
  armed: "pc-go-armed",
  end: "pc-go-dead",
};

export function GoButton({
  state,
  label,
  sub,
  onPress,
}: {
  state: GoState;
  label: string;
  sub: string;
  onPress: () => void;
}) {
  const disabled = state === "empty" || state === "end";
  const Icon =
    state === "live" ? Pause : state === "armed" ? SkipForward : state === "end" ? Square : Play;

  return (
    <button
      type="button"
      id="go-button"
      className={`pc-go ${FACE[state]}`}
      data-state={state}
      disabled={disabled}
      aria-disabled={disabled}
      onClick={onPress}
    >
      <span className="flex items-center justify-center gap-3">
        <Icon className="size-9 shrink-0" aria-hidden />
        <span className="pc-go-label">{label}</span>
      </span>
      <span className="pc-go-sub" id="go-sub">
        {sub}
      </span>
    </button>
  );
}
