import { useCallback, useEffect, useRef, useState } from "react";

import { Shape, SHAPES, TONE_KEYS, type ShapeKind, type ToneKey } from "@/components/shapes";
import { sample, shuffle } from "@/lib/games";

import type { GameProps } from "@/components/games/types";

interface Card {
  key: number;
  kind: ShapeKind;
  tone: ToneKey;
  pairId: number;
  open: boolean;
  done: boolean;
}

const PAIRS = 6;

function deal(): Card[] {
  const kinds = sample(SHAPES, PAIRS);
  const tones = sample(TONE_KEYS, PAIRS);
  const cards: Card[] = [];
  for (let i = 0; i < PAIRS; i++) {
    for (let copy = 0; copy < 2; copy++) {
      cards.push({
        key: i * 2 + copy,
        kind: kinds[i],
        tone: tones[i],
        pairId: i,
        open: false,
        done: false,
      });
    }
  }
  return shuffle(cards).map((c, i) => ({ ...c, key: i }));
}

/**
 * 짝맞추기 — twelve face-down blocks, six pairs. Turn two over; a match stays
 * up, anything else quietly turns back. When the board is clear a new one is
 * dealt, so the game simply keeps going until the clock runs out.
 */
export function PairGame({ t, onRound, setPrompt }: GameProps) {
  const [cards, setCards] = useState<Card[]>(deal);
  const [miss, setMiss] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const timers = useRef<number[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  useEffect(() => {
    setPrompt(t("pairPrompt"));
  }, [setPrompt, t]);

  /* Board cleared — deal a fresh one so the game just keeps going until the
     clock runs out. */
  useEffect(() => {
    if (!cards.every((c) => c.done)) return;
    const id = window.setTimeout(() => setCards(deal()), 750);
    return () => window.clearTimeout(id);
  }, [cards]);

  useEffect(() => {
    const list = timers.current;
    return () => {
      list.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  function flip(card: Card) {
    if (busy || card.open || card.done) return;
    const open = cards.filter((c) => c.open && !c.done);
    const next = cards.map((c) => (c.key === card.key ? { ...c, open: true } : c));
    setCards(next);
    if (open.length === 0) return;

    const first = open[0];
    setBusy(true);
    if (first.pairId === card.pairId) {
      later(() => {
        setCards((cur) =>
          cur.map((c) =>
            c.pairId === card.pairId ? { ...c, open: true, done: true } : c,
          ),
        );
        onRound(true);
        setBusy(false);
      }, 320);
    } else {
      setMiss([first.key, card.key]);
      later(() => {
        setCards((cur) =>
          cur.map((c) => (c.done ? c : { ...c, open: false })),
        );
        setMiss([]);
        setBusy(false);
      }, 800);
    }
  }

  return (
    <div className="flex h-full flex-col justify-center">
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {cards.map((card) => {
          const face = card.open || card.done;
          return (
            <button
              key={card.key}
              type="button"
              className={`ps-block aspect-square ${miss.includes(card.key) ? "ps-miss" : ""} ${
                card.done ? "ps-hit" : ""
              }`}
              data-state={card.done ? "done" : face ? "up" : "down"}
              aria-label={t("pairPrompt")}
              onClick={() => flip(card)}
            >
              {face ? <Shape kind={card.kind} tone={card.tone} size={46} /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
