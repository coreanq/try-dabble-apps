import { WebGLRenderer } from "three";

import { BoardErrorBoundary } from "./board-error-boundary";
import { BoardInput } from "./board-input";
import { BoardInitializationGate } from "./board-initialization-gate";
import type { BoardCanvasProps } from "./board-scene";
import { preflightWebGLRenderer } from "@/lib/board3d/board-initialization";
import { MIN_PORTRAIT_CANVAS_SIZE } from "@/lib/board3d/board-layout";
import { clearSceneAssetCache } from "@/lib/board3d/scene-assets";

export type { BoardCanvasProps } from "./board-scene";

function preflightWebGL(): void {
  if (typeof document === "undefined") {
    return;
  }

  preflightWebGLRenderer(
    () => document.createElement("canvas"),
    (canvas) => new WebGLRenderer({ alpha: true, antialias: true, canvas }),
  );
}

export function BoardCanvas(props: BoardCanvasProps) {
  const { errorMessage, retryLabel } = props;

  return (
    <div
      className="flex-1 overflow-hidden"
      // The floor the board never shrinks past, not the 44px-target size: on
      // a phone the frame around this is smaller than that, and a larger
      // minimum here would push the scene out under overflow-hidden.
      style={{
        minHeight: MIN_PORTRAIT_CANVAS_SIZE,
        minWidth: MIN_PORTRAIT_CANVAS_SIZE,
      }}
    >
      <BoardErrorBoundary
        errorMessage={errorMessage}
        onRetry={clearSceneAssetCache}
        retryLabel={retryLabel}
      >
        {({ canvasKey, reportInitializationError }) => (
          <BoardInitializationGate
            initialize={preflightWebGL}
            key={canvasKey}
            onFailure={reportInitializationError}
          >
            <BoardInput {...props} />
          </BoardInitializationGate>
        )}
      </BoardErrorBoundary>
    </div>
  );
}
