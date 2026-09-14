import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { peaks } from "@/lib/audio";

export type Selection = [number, number];

const EDGE_PX = 14;
const CLICK_PX = 4;
const HEIGHT = 150;

/**
 * Canvas waveform. Drag to select a region, tap to move the playhead, drag a
 * selection edge to adjust it. Positions are sample indices so the editor
 * never has to convert back from pixels.
 */
export function Waveform({
  samples,
  sampleRate,
  selection,
  playhead,
  recording,
  level,
  emptyText,
  onSelect,
  onSeek,
}: {
  samples: Float32Array | null;
  sampleRate: number;
  selection: Selection | null;
  playhead: number;
  recording: boolean;
  level: number;
  emptyText: string;
  onSelect: (sel: Selection | null) => void;
  onSeek: (sample: number) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(320);
  const drag = useRef<{ mode: "new" | "start" | "end"; anchor: number; startX: number; moved: boolean } | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = Math.max(120, Math.floor(entries[0].contentRect.width));
      setWidth(w);
    });
    ro.observe(el);
    setWidth(Math.max(120, Math.floor(el.clientWidth)));
    return () => ro.disconnect();
  }, []);

  const columns = useMemo(() => (samples && samples.length ? peaks(samples, width) : null), [samples, width]);
  const length = samples?.length ?? 0;
  const toX = (sample: number) => (length ? (sample / length) * width : 0);
  const toSample = (x: number) => (length ? Math.round(Math.max(0, Math.min(1, x / width)) * length) : 0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(HEIGHT * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, HEIGHT);
    ctx.fillStyle = "#fffaf3";
    ctx.fillRect(0, 0, width, HEIGHT);

    // Centre line + gentle rulers.
    ctx.strokeStyle = "rgba(74, 25, 66, 0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, HEIGHT / 2 + 0.5);
    ctx.lineTo(width, HEIGHT / 2 + 0.5);
    ctx.stroke();

    if (recording) {
      // Live level meter while the take is being captured.
      const h = Math.max(4, Math.min(1, level) * (HEIGHT - 20));
      ctx.fillStyle = "rgba(225, 29, 72, 0.18)";
      ctx.fillRect(0, 0, width, HEIGHT);
      ctx.fillStyle = "#e11d48";
      ctx.fillRect(width / 2 - 6, HEIGHT / 2 - h / 2, 12, h);
      return;
    }
    if (!columns) return;

    if (selection) {
      const [a, b] = selection;
      ctx.fillStyle = "rgba(217, 119, 6, 0.18)";
      ctx.fillRect(toX(a), 0, Math.max(1, toX(b) - toX(a)), HEIGHT);
    }
    const mid = HEIGHT / 2;
    ctx.fillStyle = "#0d9488";
    for (let x = 0; x < width; x++) {
      const top = mid - columns.max[x] * (mid - 6);
      const bottom = mid - columns.min[x] * (mid - 6);
      ctx.fillRect(x, Math.min(top, bottom), 1, Math.max(1, Math.abs(bottom - top)));
    }
    if (selection) {
      const [a, b] = selection;
      ctx.fillStyle = "#d97706";
      for (const s of [a, b]) {
        const x = Math.round(toX(s));
        ctx.fillRect(x - 1, 0, 2, HEIGHT);
        ctx.beginPath();
        ctx.arc(x, 10, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, HEIGHT - 10, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const px = Math.round(toX(Math.min(playhead, length)));
    ctx.fillStyle = "#4a1942";
    ctx.fillRect(px - 1, 0, 2, HEIGHT);
    ctx.beginPath();
    ctx.moveTo(px - 6, 0);
    ctx.lineTo(px + 6, 0);
    ctx.lineTo(px, 8);
    ctx.closePath();
    ctx.fill();
  }, [columns, width, selection, playhead, length, recording, level]);

  const localX = (e: ReactPointerEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return e.clientX - rect.left;
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!length || recording) return;
    const x = localX(e);
    e.currentTarget.setPointerCapture(e.pointerId);
    if (selection) {
      const [a, b] = selection;
      if (Math.abs(x - toX(a)) <= EDGE_PX) {
        drag.current = { mode: "start", anchor: b, startX: x, moved: false };
        return;
      }
      if (Math.abs(x - toX(b)) <= EDGE_PX) {
        drag.current = { mode: "end", anchor: a, startX: x, moved: false };
        return;
      }
    }
    drag.current = { mode: "new", anchor: toSample(x), startX: x, moved: false };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    if (!d || !length) return;
    const x = localX(e);
    if (!d.moved && Math.abs(x - d.startX) < CLICK_PX) return;
    d.moved = true;
    const cur = toSample(x);
    const lo = Math.min(d.anchor, cur);
    const hi = Math.max(d.anchor, cur);
    onSelect(hi > lo ? [lo, hi] : null);
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d || !length) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    if (!d.moved && d.mode === "new") {
      onSelect(null);
      onSeek(d.anchor);
    }
  };

  return (
    <div ref={wrapRef} className="rp-wave" id="waveform" data-state={recording ? "recording" : length ? "ready" : "empty"}>
      <canvas
        ref={canvasRef}
        className="rp-wave-canvas"
        style={{ width, height: HEIGHT }}
        aria-label={length ? `${(length / sampleRate).toFixed(1)} s` : emptyText}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      {!length && !recording && (
        <p className="rp-wave-empty" id="wave-empty">
          {emptyText}
        </p>
      )}
    </div>
  );
}
