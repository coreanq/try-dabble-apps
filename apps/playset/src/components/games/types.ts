import type { Translate } from "@/lib/i18n";

/**
 * A game is handed the translator, a way to say "a round just finished", and a
 * way to put a line of plain instruction at the top of the stage. It never owns
 * the clock, never renders a score and never decides what comes next — the
 * player shell does all three.
 */
export interface GameProps {
  t: Translate;
  onRound: (ok: boolean) => void;
  setPrompt: (text: string) => void;
}
