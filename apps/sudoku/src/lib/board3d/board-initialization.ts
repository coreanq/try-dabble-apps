export type BoardInitializationResult =
  | { readonly status: 'ready' }
  | { readonly status: 'failed'; readonly error: Error };

interface WebGLContextProbe {
  getExtension?(name: string): { loseContext?(): void } | null;
}

interface CanvasProbe {
  getContext(type: 'webgl2' | 'webgl'): WebGLContextProbe | null;
}

interface RendererProbe {
  dispose(): void;
  forceContextLoss(): void;
  getContext(): unknown;
}

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Board renderer initialization failed.');
}

export async function runBoardInitialization(
  preflight: () => void | Promise<void>,
): Promise<BoardInitializationResult> {
  try {
    await preflight();
    return { status: 'ready' };
  } catch (error) {
    return { status: 'failed', error: asError(error) };
  }
}

interface WebGLAcquisition<TCanvas extends CanvasProbe> {
  readonly canvas: TCanvas;
  readonly context: WebGLContextProbe;
}

export function assertWebGLAvailable<TCanvas extends CanvasProbe>(
  createCanvas: () => TCanvas,
): WebGLAcquisition<TCanvas> {
  const canvas = createCanvas();
  const context = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
  if (!context) {
    throw new Error('WebGL is unavailable on this device.');
  }

  return { canvas, context };
}

export function preflightWebGLRenderer<TCanvas extends CanvasProbe>(
  createCanvas: () => TCanvas,
  createRenderer: (canvas: TCanvas) => RendererProbe,
): void {
  const { canvas, context } = assertWebGLAvailable(createCanvas);
  let renderer: RendererProbe | undefined;

  try {
    renderer = createRenderer(canvas);
    if (!renderer.getContext()) {
      throw new Error('WebGL renderer context is unavailable.');
    }
  } finally {
    if (renderer) {
      // A constructed renderer owns context cleanup; raw cleanup must not run too.
      try {
        renderer.dispose();
      } finally {
        renderer.forceContextLoss();
      }
    } else {
      context.getExtension?.('WEBGL_lose_context')?.loseContext?.();
    }
  }
}

export async function preflightNativeContext<TContext>(
  createContext: () => Promise<TContext>,
  destroyContext: (context: TContext) => Promise<boolean>,
): Promise<void> {
  const context = await createContext();
  const destroyed = await destroyContext(context);
  if (!destroyed) {
    throw new Error('EXGL context cleanup failed.');
  }
}
