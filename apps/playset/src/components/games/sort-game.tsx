import { useCallback, useEffect, useRef, useState } from "react";

import { Shape, TONES, type ShapeKind, type ToneKey } from "@/components/shapes";
import { randomInt, sample } from "@/lib/games";

import type { GameProps } from "@/components/games/types";

const SORT_SHAPES: ShapeKind[] = ["circle", "square", "triangle", "star"];
const SORT_TONES: ToneKey[] = ["sun", "sky", "mint", "peach"];

interface Round {
  /** Which rule this round is testing. */
  by: "colour" | "shape";
  item: { kind: ShapeKind; tone: ToneKey };
  /** Two bins; exactly one is right. */
  bins: { kind: ShapeKind; tone: ToneKey }[];
  right: number;
}

function build(): Round {
  const by: Round["by"] = Math.random() < 0.5 ? "colour" : "shape";
  const [kindA, kindB] = sample(SORT_SHAPES, 2);
  const [toneA, toneB] = sample(SORT_TONES, 2);
  const right = randomInt(2);

  if (by === "colour") {
    // Both bins wear the same neutral shape; only the colour tells them apart.
    const bins = [
      { kind: kindA, tone: toneA },
      { kind: kindA, tone: toneB },
    ];
    return { by, item: { kind: kindB, tone: bins[right].tone }, bins, right };
  }
  // Both bins wear the same colour; only the shape tells them apart.
  const bins = [
    { kind: kindA, tone: toneA },
    { kind: kindB, tone: toneA },
  ];
  return { by, item: { kind: bins[right].kind, tone: toneB }, bins, right };
}

/**
 * 색·모양 분류 — one thing at the top, two boxes underneath. Half the rounds
 * ask for the matching colour, half for the matching shape, and the line at
 * the top says which. Two boxes only: a person sorting with one hand should
 * never have to aim.
 */
export function SortGame({ t, onRound, setPrompt }: GameProps) {
  const [round, setRound] = useState<Round>(build);
  const [miss, setMiss] = useState<number | null>(null);
  const [hit, setHit] = useState<number | null>(null);
  const timers = useRef<number[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach((id) => window.clearTimeout(id));
  }, []);

  useEffect(() => {
    setPrompt(round.by === "colour" ? t("sortByColor") : t("sortByShape"));
  }, [round.by, setPrompt, t]);

  function tap(index: number) {
    if (hit !== null) return;
    if (index === round.right) {
      setHit(index);
      onRound(true);
      later(() => {
        setRound(build());
        setHit(null);
        setMiss(null);
      }, 520);
      return;
    }
    setMiss(index);
    later(() => setMiss(null), 420);
  }

  return (
    <div className="flex h-full flex-col justify-center gap-6">
      <div className="flex justify-center">
        <div className="ps-block ps-hit h-32 w-32 cursor-default" aria-hidden="true">
          <Shape kind={round.item.kind} tone={round.item.tone} size={84} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {round.bins.map((bin, i) => (
          <button
            key={i}
            type="button"
            className={`ps-block h-32 ${miss === i ? "ps-miss" : ""} ${
              hit === i ? "ps-hit" : ""
            }`}
            style={{ background: `${TONES[bin.tone]}33` }}
            data-state={hit === i ? "done" : undefined}
            aria-label={round.by === "colour" ? t("sortByColor") : t("sortByShape")}
            onClick={() => tap(i)}
          >
            <Shape kind={bin.kind} tone={bin.tone} size={68} />
          </button>
        ))}
      </div>
    </div>
  );
}
