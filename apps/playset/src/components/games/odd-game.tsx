import { useCallback, useEffect, useRef, useState } from "react";

import { Shape, SHAPES, TONE_KEYS, type ShapeKind, type ToneKey } from "@/components/shapes";
import { randomInt, sample } from "@/lib/games";

import type { GameProps } from "@/components/games/types";

const CELLS = 9;

interface Board {
  kind: ShapeKind;
  tone: ToneKey;
  oddKind: ShapeKind;
  oddTone: ToneKey;
  oddIndex: number;
}

function build(): Board {
  const [kind, oddKind] = sample(SHAPES, 2);
  const [tone, oddTone] = sample(TONE_KEYS, 2);
  // Half the boards differ by colour, half by shape — same job, two ways in.
  const byColour = Math.random() < 0.5;
  return {
    kind,
    tone,
    oddKind: byColour ? kind : oddKind,
    oddTone: byColour ? oddTone : tone,
    oddIndex: randomInt(CELLS),
  };
}

/**
 * 다른 것 찾기 — nine blocks, one of them off. Sometimes the colour is off,
 * sometimes the shape. A wrong tap wobbles and the board stays put, so there
 * is nothing to lose by trying again.
 */
export function OddGame({ t, onRound, setPrompt }: GameProps) {
  const [board, setBoard] = useState<Board>(build);
  const [miss, setMiss] = useState<number | null>(null);
  const [hit, setHit] = useState(false);
  const timers = useRef<number[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach((id) => window.clearTimeout(id));
  }, []);

  useEffect(() => {
    setPrompt(t("oddPrompt"));
  }, [setPrompt, t]);

  function tap(index: number) {
    if (hit) return;
    if (index === board.oddIndex) {
      setHit(true);
      onRound(true);
      later(() => {
        setBoard(build());
        setHit(false);
      }, 480);
      return;
    }
    setMiss(index);
    later(() => setMiss(null), 420);
  }

  return (
    <div className="flex h-full flex-col justify-center">
      <div className="grid grid-cols-3 gap-2.5">
        {Array.from({ length: CELLS }, (_, i) => {
          const odd = i === board.oddIndex;
          return (
            <button
              key={i}
              type="button"
              className={`ps-block aspect-square ${miss === i ? "ps-miss" : ""} ${
                hit && odd ? "ps-hit" : ""
              }`}
              data-state={hit && odd ? "done" : undefined}
              aria-label={t("oddPrompt")}
              onClick={() => tap(i)}
            >
              <Shape
                kind={odd ? board.oddKind : board.kind}
                tone={odd ? board.oddTone : board.tone}
                size={46}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
