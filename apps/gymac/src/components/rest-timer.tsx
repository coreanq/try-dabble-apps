import { useEffect, useState } from "react";
import { Play, Square, Timer } from "lucide-react";

import { NumField } from "@/components/num-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Translate } from "@/lib/i18n";
import { clampRestSeconds, formatSeconds, remainingSeconds, REST_PRESETS } from "@/lib/timer";

export interface RestState {
  endAt: number;
  total: number;
}

/**
 * Foreground-only countdown. The end instant lives in the parent so the
 * masthead chip can show it too; this card just draws it and offers presets.
 * No notifications, no audio file, no background work: a short vibration
 * where supported is the only nudge.
 */
export function RestTimer({
  t,
  rest,
  defaultSeconds,
  onStart,
  onStop,
}: {
  t: Translate;
  rest: RestState | null;
  defaultSeconds: number;
  onStart: (seconds: number) => void;
  onStop: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const [custom, setCustom] = useState<number | undefined>(defaultSeconds);
  const [justDone, setJustDone] = useState(false);

  useEffect(() => {
    if (!rest) return;
    setJustDone(false);
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [rest]);

  const remaining = rest ? remainingSeconds(rest.endAt, now) : 0;

  useEffect(() => {
    if (!rest || remaining > 0) return;
    setJustDone(true);
    try {
      navigator.vibrate?.([120, 60, 120]);
    } catch {
      /* not supported */
    }
    onStop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rest, remaining]);

  const running = rest !== null && remaining > 0;
  const pct = rest ? Math.max(0, Math.min(100, Math.round((remaining / rest.total) * 100))) : 0;

  return (
    <Card id="rest-card" size="sm" data-tone="teal">
      <CardHeader className="grid-cols-[auto_1fr] items-center gap-2">
        <Timer className="size-4 text-teal-deep" aria-hidden />
        <CardTitle>{t("restTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="gm-timer">
        <div className="gm-timer-face" data-state={justDone && !running ? "done" : running ? "running" : "idle"} aria-live="polite">
          <div className="gm-timer-digits" id="rest-digits">
            {formatSeconds(running ? remaining : justDone ? 0 : clampRestSeconds(custom))}
          </div>
          <div className="gm-timer-ring" aria-hidden>
            <div style={{ width: `${running ? pct : justDone ? 0 : 100}%` }} />
          </div>
          <p className="gm-hint" id="rest-state">
            {justDone && !running ? t("restDone") : running ? t("restRunning") : t("restHint")}
          </p>
        </div>
        <div className="gm-chip-row" role="group" aria-label={t("restTitle")}>
          {REST_PRESETS.map((s) => (
            <button
              key={s}
              type="button"
              className="gm-chip"
              id={`rest-preset-${s}`}
              aria-pressed={custom === s}
              onClick={() => {
                setCustom(s);
                onStart(s);
              }}
            >
              {s}
              {t("secondsUnit")}
            </button>
          ))}
        </div>
        <div className="gm-set-tools">
          <div>
            <label className="gm-field-label" htmlFor="rest-custom">
              {t("restCustom")}
            </label>
            <NumField id="rest-custom" integer value={custom} onCommit={setCustom} className="gm-num-input w-full" />
          </div>
          {running ? (
            <button type="button" className="gm-btn gm-btn-danger self-end" id="rest-stop" onClick={onStop}>
              <Square className="size-4" aria-hidden />
              {t("restStop")}
            </button>
          ) : (
            <button type="button" className="gm-btn gm-btn-teal self-end" id="rest-start" onClick={() => onStart(clampRestSeconds(custom))}>
              <Play className="size-4" aria-hidden />
              {t("restStart")}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
