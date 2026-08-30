import { useCallback, useEffect, useRef, useState } from "react";

import { TONES, type ToneKey } from "@/components/shapes";
import { randomInt } from "@/lib/games";

import type { GameProps } from "@/components/games/types";

const PADS: ToneKey[] = ["sun", "sky", "mint", "peach"];
const START_LEN = 2;
const MAX_LEN = 7;

/**
 * 순서기억 — four fat pads light up one after another, then the player taps
 * them back in the same order. Getting it right adds a step; getting it wrong
 * takes one away and shows the same length again. It never ends on a failure
 * screen, it just gets easier.
 */
export function SequenceGame({ t, onRound, setPrompt }: GameProps) {
  const [order, setOrder] = useState<number[]>([]);
  const [lit, setLit] = useState<number | null>(null);
  const [watching, setWatching] = useState(true);
  const [step, setStep] = useState(0);
  const [miss, setMiss] = useState<number | null>(null);
  const lenRef = useRef(START_LEN);
  const timers = useRef<number[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach((id) => window.clearTimeout(id));
  }, []);

  const startRound = useCallback(
    (length: number) => {
      const next = Array.from({ length }, () => randomInt(PADS.length));
      setOrder(next);
      setStep(0);
      setWatching(true);
      setLit(null);
      next.forEach((pad, i) => {
        later(() => setLit(pad), 550 + i * 780);
        later(() => setLit(null), 550 + i * 780 + 520);
      });
      later(() => setWatching(false), 550 + next.length * 780);
    },
    [later],
  );

  useEffect(() => {
    startRound(START_LEN);
  }, [startRound]);

  useEffect(() => {
    setPrompt(watching ? t("sequenceWatch") : t("sequenceGo"));
  }, [watching, setPrompt, t]);

  function tap(pad: number) {
    if (watching || order.length === 0) return;
    if (order[step] === pad) {
      const nextStep = step + 1;
      if (nextStep >= order.length) {
        onRound(true);
        lenRef.current = Math.min(MAX_LEN, lenRef.current + 1);
        setWatching(true);
        later(() => startRound(lenRef.current), 750);
      } else {
        setStep(nextStep);
      }
      return;
    }
    // A miss shortens the next one instead of stopping the game.
    setMiss(pad);
    later(() => setMiss(null), 420);
    lenRef.current = Math.max(START_LEN, lenRef.current - 1);
    setWatching(true);
    later(() => startRound(lenRef.current), 700);
  }

  return (
    <div className="flex h-full flex-col justify-center">
      <div className="grid grid-cols-2 gap-3">
        {PADS.map((tone, i) => (
          <button
            key={tone}
            type="button"
            className={`ps-block aspect-square ${miss === i ? "ps-miss" : ""}`}
            style={{ background: TONES[tone] }}
            data-state={lit === i ? "lit" : undefined}
            disabled={watching}
            aria-label={`${t("sequenceGo")} ${i + 1}`}
            onClick={() => tap(i)}
          />
        ))}
      </div>
    </div>
  );
}
