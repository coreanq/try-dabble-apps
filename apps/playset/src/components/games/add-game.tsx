import { useCallback, useEffect, useRef, useState } from "react";

import { randomInt, shuffle } from "@/lib/games";

import type { GameProps } from "@/components/games/types";

interface Sum {
  a: number;
  b: number;
  answers: number[];
}

function build(): Sum {
  const a = 1 + randomInt(9);
  const b = 1 + randomInt(9);
  const total = a + b;
  const wrong = new Set<number>();
  while (wrong.size < 2) {
    const delta = 1 + randomInt(3);
    const candidate = Math.random() < 0.5 ? total - delta : total + delta;
    if (candidate > 0 && candidate !== total) wrong.add(candidate);
  }
  return { a, b, answers: shuffle([total, ...wrong]) };
}

/**
 * 쉬운 덧셈 — two single digits and three big answers. Nothing is timed inside
 * the round and a wrong answer only dims itself, so there is no way to get
 * stuck and no running total of mistakes anywhere on screen.
 */
export function AddGame({ t, onRound, setPrompt }: GameProps) {
  const [sum, setSum] = useState<Sum>(build);
  const [miss, setMiss] = useState<number[]>([]);
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
    setPrompt(t("addPrompt"));
  }, [setPrompt, t]);

  function tap(value: number) {
    if (hit !== null) return;
    if (value === sum.a + sum.b) {
      setHit(value);
      onRound(true);
      later(() => {
        setSum(build());
        setMiss([]);
        setHit(null);
      }, 520);
      return;
    }
    setMiss((cur) => (cur.includes(value) ? cur : [...cur, value]));
  }

  return (
    <div className="flex h-full flex-col justify-center gap-5">
      <p
        className="m-0 text-center font-[family-name:var(--stack-title)] text-[3.4rem] leading-none font-extrabold text-ink tabular-nums"
        id="sum-line"
      >
        {sum.a} + {sum.b}
      </p>
      <div className="grid grid-cols-3 gap-2.5">
        {sum.answers.map((value) => (
          <button
            key={value}
            type="button"
            className={`ps-block h-24 text-[2.1rem] ${
              miss.includes(value) ? "ps-miss opacity-55" : ""
            } ${hit === value ? "ps-hit" : ""}`}
            data-state={hit === value ? "done" : undefined}
            onClick={() => tap(value)}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  );
}
