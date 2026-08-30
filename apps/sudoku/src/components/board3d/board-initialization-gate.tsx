import { useEffect, useState, type ReactNode } from 'react';

import { runBoardInitialization } from '@/lib/board3d/board-initialization';

interface BoardInitializationGateProps {
  readonly children: ReactNode;
  readonly initialize: () => void | Promise<void>;
  readonly onFailure: (error: Error) => void;
}

export function BoardInitializationGate({
  children,
  initialize,
  onFailure,
}: BoardInitializationGateProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    void runBoardInitialization(initialize).then((result) => {
      if (!active) {
        return;
      }
      if (result.status === 'failed') {
        onFailure(result.error);
        return;
      }
      setReady(true);
    });

    return () => {
      active = false;
    };
  }, [initialize, onFailure]);

  return ready ? children : null;
}
