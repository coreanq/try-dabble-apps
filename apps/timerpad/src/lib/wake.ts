/**
 * Screen Wake Lock + Fullscreen. Both are best-effort: a browser that
 * refuses simply leaves the buttons in place. We re-request wake lock
 * when the tab becomes visible again.
 */
export type WakeSentinel = { release: () => Promise<void> } | null;

export async function requestWake(): Promise<WakeSentinel> {
  try {
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    if (!nav.wakeLock) return null;
    return await nav.wakeLock.request("screen");
  } catch {
    return null;
  }
}

export async function releaseWake(sentinel: WakeSentinel): Promise<void> {
  if (!sentinel) return;
  try {
    await sentinel.release();
  } catch {
    /* already released */
  }
}

export async function enterFullscreen(el: HTMLElement | null): Promise<boolean> {
  const target = el ?? document.documentElement;
  try {
    if (document.fullscreenElement) return true;
    await target.requestFullscreen();
    return true;
  } catch {
    return false;
  }
}

export async function exitFullscreen(): Promise<void> {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
  } catch {
    /* ignore */
  }
}

export function isFullscreen(): boolean {
  return Boolean(document.fullscreenElement);
}
