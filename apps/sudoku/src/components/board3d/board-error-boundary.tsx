import { Component, type ReactNode } from 'react';

import { nextCanvasKey } from '@/lib/board3d/canvas-key';

interface BoardErrorBoundaryProps {
  readonly children: (context: BoardRenderContext) => ReactNode;
  readonly errorMessage: string;
  readonly onRetry: () => void;
  readonly retryLabel: string;
}

export interface BoardRenderContext {
  readonly canvasKey: number;
  readonly reportInitializationError: (error: Error) => void;
}

interface BoardErrorBoundaryState {
  readonly error: Error | null;
  readonly retryKey: number;
}

export class BoardErrorBoundary extends Component<
  BoardErrorBoundaryProps,
  BoardErrorBoundaryState
> {
  state: BoardErrorBoundaryState = {
    error: null,
    retryKey: 0,
  };

  static getDerivedStateFromError(error: Error): Partial<BoardErrorBoundaryState> {
    return { error };
  }

  private reportInitializationError = (error: Error) => {
    this.setState({ error });
  };

  private handleRetry = () => {
    this.props.onRetry();
    this.setState(({ retryKey }) => ({ error: null, retryKey: nextCanvasKey(retryKey) }));
  };

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full min-h-64 flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-sm text-cream-muted">{this.props.errorMessage}</p>
          <button
            className="rounded-md border border-walnut-light bg-walnut px-4 py-2 text-sm text-cream"
            onClick={this.handleRetry}
            type="button"
          >
            {this.props.retryLabel}
          </button>
        </div>
      );
    }

    return this.props.children({
      canvasKey: this.state.retryKey,
      reportInitializationError: this.reportInitializationError,
    });
  }
}
