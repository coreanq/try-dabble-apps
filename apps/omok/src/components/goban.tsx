import { useCallback, useEffect, useRef, useState } from "react";

import { BOARD_SIZE, type Board, type Move } from "@/lib/gomoku";

/**
 * The board itself, drawn on a canvas exactly as the pre-Vite page drew it:
 * a kaya-wood wash with bezier grain, a 15×15 grid, nine star points, and
 * stones lit from the upper left — slate for black, clam shell for white.
 * The last stone wears a vermilion ring; after a win its five stones are
 * strung together so the finished game reads at a glance while reviewing.
 */
export function Goban({
  board,
  lastMove,
  winLine,
  disabled,
  onPlay,
}: {
  board: Board;
  lastMove: Move | null;
  winLine: Move[] | null;
  disabled: boolean;
  onPlay: (move: Move) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState(560);

  const cellSize = size / (BOARD_SIZE + 1);
  const padding = cellSize;

  /* Fit the board to whatever is left after the bars, on every device. */
  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const isMobile = vw < 768;

      const maxWidth = isMobile ? vw - 40 : Math.min(vw * 0.8, 620);
      const headerFooterSpace = isMobile ? 260 : 280;
      const maxHeight = (vh - headerFooterSpace) * 0.95;

      setSize(Math.max(280, Math.min(maxWidth, maxHeight)));
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Kaya wood
    const wood = ctx.createLinearGradient(0, 0, size, size);
    wood.addColorStop(0, "#E8C87E");
    wood.addColorStop(0.3, "#D4A85A");
    wood.addColorStop(0.5, "#E0B76A");
    wood.addColorStop(0.7, "#D4A85A");
    wood.addColorStop(1, "#C89B4A");
    ctx.fillStyle = wood;
    ctx.fillRect(0, 0, size, size);

    // Grain
    ctx.strokeStyle = "rgba(139, 90, 43, 0.1)";
    ctx.lineWidth = 1;
    for (let i = 0; i < size; i += 12) {
      ctx.beginPath();
      ctx.moveTo(0, i + Math.sin(i * 0.1) * 3);
      ctx.bezierCurveTo(
        size * 0.25, i + Math.sin(i * 0.1 + 1) * 5,
        size * 0.75, i + Math.sin(i * 0.1 + 2) * 4,
        size, i + Math.sin(i * 0.1 + 3) * 3,
      );
      ctx.stroke();
    }

    // Grid
    ctx.strokeStyle = "#2D1810";
    ctx.lineWidth = Math.max(1, cellSize * 0.025);
    ctx.lineCap = "round";
    for (let i = 0; i < BOARD_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(padding, padding + i * cellSize);
      ctx.lineTo(padding + (BOARD_SIZE - 1) * cellSize, padding + i * cellSize);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(padding + i * cellSize, padding);
      ctx.lineTo(padding + i * cellSize, padding + (BOARD_SIZE - 1) * cellSize);
      ctx.stroke();
    }

    // Star points (화점)
    ctx.fillStyle = "#2D1810";
    for (const [row, col] of [
      [3, 3], [3, 7], [3, 11],
      [7, 3], [7, 7], [7, 11],
      [11, 3], [11, 7], [11, 11],
    ]) {
      ctx.beginPath();
      ctx.arc(padding + col * cellSize, padding + row * cellSize, cellSize * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }

    // The winning five, strung together under the stones
    if (winLine && winLine.length >= 2) {
      const a = winLine[0];
      const b = winLine[winLine.length - 1];
      ctx.strokeStyle = "rgba(180, 41, 31, 0.75)";
      ctx.lineWidth = Math.max(3, cellSize * 0.14);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(padding + a.col * cellSize, padding + a.row * cellSize);
      ctx.lineTo(padding + b.col * cellSize, padding + b.row * cellSize);
      ctx.stroke();
    }

    // Stones
    board.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (!cell) return;

        const x = padding + c * cellSize;
        const y = padding + r * cellSize;
        const radius = cellSize * 0.42;
        const isLast = lastMove != null && lastMove.row === r && lastMove.col === c;

        ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
        ctx.shadowBlur = cellSize * 0.15;
        ctx.shadowOffsetX = cellSize * 0.05;
        ctx.shadowOffsetY = cellSize * 0.08;

        if (cell === "black") {
          const gradient = ctx.createRadialGradient(
            x - radius * 0.35, y - radius * 0.35, radius * 0.05,
            x + radius * 0.1, y + radius * 0.1, radius,
          );
          gradient.addColorStop(0, "#555555");
          gradient.addColorStop(0.3, "#333333");
          gradient.addColorStop(0.7, "#1a1a1a");
          gradient.addColorStop(1, "#000000");

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();

          ctx.shadowColor = "transparent";
          const highlight = ctx.createRadialGradient(
            x - radius * 0.4, y - radius * 0.4, 0,
            x - radius * 0.3, y - radius * 0.3, radius * 0.5,
          );
          highlight.addColorStop(0, "rgba(255, 255, 255, 0.45)");
          highlight.addColorStop(0.5, "rgba(255, 255, 255, 0.15)");
          highlight.addColorStop(1, "rgba(255, 255, 255, 0)");

          ctx.beginPath();
          ctx.arc(x - radius * 0.2, y - radius * 0.2, radius * 0.45, 0, Math.PI * 2);
          ctx.fillStyle = highlight;
          ctx.fill();
        } else {
          const gradient = ctx.createRadialGradient(
            x - radius * 0.3, y - radius * 0.3, radius * 0.05,
            x + radius * 0.15, y + radius * 0.15, radius,
          );
          gradient.addColorStop(0, "#FFFFFF");
          gradient.addColorStop(0.4, "#F8F8F8");
          gradient.addColorStop(0.7, "#E8E8E8");
          gradient.addColorStop(1, "#D0D0D0");

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();

          ctx.shadowColor = "transparent";
          ctx.strokeStyle = "rgba(180, 180, 180, 0.5)";
          ctx.lineWidth = 1;
          ctx.stroke();

          const shell = ctx.createRadialGradient(
            x - radius * 0.35, y - radius * 0.35, 0,
            x - radius * 0.2, y - radius * 0.2, radius * 0.55,
          );
          shell.addColorStop(0, "rgba(255, 255, 255, 0.9)");
          shell.addColorStop(0.4, "rgba(255, 255, 255, 0.4)");
          shell.addColorStop(1, "rgba(255, 255, 255, 0)");

          ctx.beginPath();
          ctx.arc(x - radius * 0.15, y - radius * 0.15, radius * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = shell;
          ctx.fill();
        }

        if (isLast) {
          ctx.shadowColor = "transparent";
          ctx.strokeStyle = cell === "black" ? "#FF6B6B" : "#B4291F";
          ctx.lineWidth = Math.max(2, cellSize * 0.06);
          ctx.beginPath();
          ctx.arc(x, y, radius * 0.35, 0, Math.PI * 2);
          ctx.stroke();
        }
      });
    });

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }, [board, size, cellSize, padding, lastMove, winLine]);

  const positionFrom = useCallback(
    (clientX: number, clientY: number): Move | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const x = (clientX - rect.left) * (size / rect.width);
      const y = (clientY - rect.top) * (size / rect.height);

      const col = Math.round((x - padding) / cellSize);
      const row = Math.round((y - padding) / cellSize);

      if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) return { row, col };
      return null;
    },
    [size, cellSize, padding],
  );

  const tryPlay = useCallback(
    (clientX: number, clientY: number) => {
      if (disabled) return;
      const pos = positionFrom(clientX, clientY);
      if (pos && !board[pos.row][pos.col]) onPlay(pos);
    },
    [board, disabled, onPlay, positionFrom],
  );

  return (
    <div className="gb-board-wrap">
      <div className="gb-frame">
        <canvas
          ref={canvasRef}
          className="gb-canvas"
          role="img"
          aria-label="15 x 15"
          onClick={(e) => tryPlay(e.clientX, e.clientY)}
          onTouchStart={(e) => {
            e.preventDefault();
            const touch = e.touches[0];
            if (touch) tryPlay(touch.clientX, touch.clientY);
          }}
        />
      </div>
    </div>
  );
}
