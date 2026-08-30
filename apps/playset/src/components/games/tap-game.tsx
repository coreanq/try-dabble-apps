import { useCallback, useEffect, useRef, useState } from "react";

import { TONES, TONE_KEYS, type ToneKey } from "@/components/shapes";
import { pick, randomInt } from "@/lib/games";

import type { GameProps } from "@/components/games/types";

interface Target {
  /** Percent positions inside the play area, kept off the edges. */
  x: number;
  y: number;
  tone: ToneKey;
}

function place(): Target {
  return { x: 10 + randomInt(72), y: 10 + randomInt(70), tone: pick(TONE_KEYS) };
}

/**
 * 목표 탭 — a fat circle appears somewhere in the tray; tap it and it hops
 * elsewhere. Missing the circle does nothing at all: no penalty, no counter,
 * no sound. The target is 6rem across so it can be hit without aiming.
 */
export function TapGame({ t, onRound, setPrompt }: GameProps) {
  const [target, setTarget] = useState<Target>(place);
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
    setPrompt(t("tapPrompt"));
  }, [setPrompt, t]);

  function tap() {
    if (hit) return;
    setHit(true);
    onRound(true);
    later(() => {
      setTarget(place());
      setHit(false);
    }, 220);
  }

  return (
    <div className="relative h-full min-h-[19rem] w-full overflow-hidden rounded-[1.25rem] border-[2.5px] border-ink bg-felt">
      <button
        type="button"
        className={`ps-block absolute h-24 w-24 rounded-full ${hit ? "ps-hit" : ""}`}
        style={{
          left: `${target.x}%`,
          top: `${target.y}%`,
          background: TONES[target.tone],
        }}
        aria-label={t("tapPrompt")}
        onClick={tap}
      />
    </div>
  );
}
