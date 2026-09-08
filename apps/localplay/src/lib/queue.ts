/**
 * Queue arithmetic. Pure, no DOM, so node --test can import it.
 *
 * The queue is a list of track ids plus a cursor. Shuffle reorders the list
 * (keeping the current track where it is) and remembers the original order so
 * turning shuffle off puts everything back. Repeat decides what happens when
 * the last track ends: nothing, wrap to the first, or play the same one again.
 */
import type { QueueState, RepeatMode } from "./library.ts";

export type Rng = () => number;

export function currentId(q: QueueState): string | null {
  return q.index >= 0 && q.index < q.trackIds.length ? q.trackIds[q.index] : null;
}

/** Fisher–Yates with an injectable rng so tests are deterministic. */
export function shuffled<T>(items: T[], rng: Rng = Math.random): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Builds a fresh queue from a list, starting at `startId` (or the first). With
 * shuffle on, the start track is pinned to the front and the rest is shuffled.
 */
export function buildQueue(
  ids: string[],
  startId: string | null,
  shuffle: boolean,
  repeat: RepeatMode,
  rng: Rng = Math.random,
): QueueState {
  const base = ids.filter((id, i) => ids.indexOf(id) === i);
  if (base.length === 0) return { trackIds: [], index: -1, shuffle, repeat };
  const start = startId && base.includes(startId) ? startId : base[0];
  if (!shuffle) {
    return { trackIds: base, index: base.indexOf(start), shuffle, repeat };
  }
  const rest = shuffled(
    base.filter((id) => id !== start),
    rng,
  );
  return { trackIds: [start, ...rest], index: 0, shuffle, repeat, baseIds: base };
}

/** Toggles shuffle, keeping the current track under the cursor. */
export function setShuffle(q: QueueState, on: boolean, rng: Rng = Math.random): QueueState {
  if (on === q.shuffle) return q;
  const cur = currentId(q);
  if (on) {
    const base = q.baseIds ?? q.trackIds;
    const rest = shuffled(
      q.trackIds.filter((id) => id !== cur),
      rng,
    );
    const trackIds = cur ? [cur, ...rest] : rest;
    return { ...q, shuffle: true, trackIds, index: trackIds.length ? 0 : -1, baseIds: base };
  }
  const base = q.baseIds ?? q.trackIds;
  const present = new Set(q.trackIds);
  const trackIds = [
    ...base.filter((id) => present.has(id)),
    ...q.trackIds.filter((id) => !base.includes(id)),
  ];
  const index = cur ? trackIds.indexOf(cur) : trackIds.length ? 0 : -1;
  return { trackIds, index, shuffle: false, repeat: q.repeat };
}

export function cycleRepeat(mode: RepeatMode): RepeatMode {
  return mode === "off" ? "all" : mode === "all" ? "one" : "off";
}

/**
 * Index to play when the current track ends on its own. null means stop.
 * Repeat-one replays the same index; repeat-all wraps; otherwise the queue
 * runs to the end and goes quiet.
 */
export function indexAfterEnded(q: QueueState): number | null {
  if (q.trackIds.length === 0 || q.index < 0) return null;
  if (q.repeat === "one") return q.index;
  if (q.index + 1 < q.trackIds.length) return q.index + 1;
  return q.repeat === "all" ? 0 : null;
}

/** A tap on "next" always moves, wrapping at the end even with repeat off. */
export function indexAfterSkip(q: QueueState): number | null {
  if (q.trackIds.length === 0) return null;
  if (q.index < 0) return 0;
  return (q.index + 1) % q.trackIds.length;
}

export function indexBeforeSkip(q: QueueState): number | null {
  if (q.trackIds.length === 0) return null;
  if (q.index <= 0) return q.trackIds.length - 1;
  return q.index - 1;
}

/** Appends ids that are not yet queued; a track can sit in the queue once. */
export function appendToQueue(q: QueueState, ids: string[]): QueueState {
  const have = new Set(q.trackIds);
  const fresh = ids.filter((id) => !have.has(id) && (have.add(id), true));
  if (fresh.length === 0) return q;
  const trackIds = [...q.trackIds, ...fresh];
  return {
    ...q,
    trackIds,
    index: q.index < 0 ? 0 : q.index,
    baseIds: q.baseIds ? [...q.baseIds, ...fresh] : undefined,
  };
}

/** Removes one id, keeping the cursor on the same track where possible. */
export function removeFromQueue(q: QueueState, id: string): QueueState {
  const at = q.trackIds.indexOf(id);
  if (at < 0) return q;
  const trackIds = q.trackIds.filter((t) => t !== id);
  let index = q.index;
  if (trackIds.length === 0) index = -1;
  else if (at < q.index) index = q.index - 1;
  else if (at === q.index) index = Math.min(q.index, trackIds.length - 1);
  return {
    ...q,
    trackIds,
    index,
    baseIds: q.baseIds ? q.baseIds.filter((t) => t !== id) : undefined,
  };
}

/** Drops ids that no longer exist in the library. */
export function pruneQueue(q: QueueState, known: Set<string>): QueueState {
  const gone = q.trackIds.filter((id) => !known.has(id));
  let next = q;
  for (const id of gone) next = removeFromQueue(next, id);
  return next;
}
