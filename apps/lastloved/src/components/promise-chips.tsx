import type { MsgKey, Translate } from "@/lib/i18n";

/**
 * The gates this app refuses, answered on the first screen before anything
 * else: SongCapsule wants a music library with at least 100 songs, songspan
 * wants a login and locks you at 10, echo89 wants audio files. The two things
 * this app DOES — title and artist is enough, and it survives a tab close —
 * are stamped with a tick rather than a cross.
 *
 * The ids are also rewritten by the Worker in the no-JS shell (index.html), so
 * the very first HTML already carries these in the requested ?lang=.
 */
export const CHIPS: { id: string; key: MsgKey; kind: "no" | "yes" }[] = [
  { id: "chip-nologin", key: "chipNoLogin", kind: "no" },
  { id: "chip-nolock", key: "chipNoLock", kind: "no" },
  { id: "chip-nostream", key: "chipNoStream", kind: "no" },
  { id: "chip-titleonly", key: "chipTitleOnly", kind: "yes" },
  { id: "chip-persist", key: "chipPersist", kind: "yes" },
];

export function PromiseChips({ t }: { t: Translate }) {
  return (
    <ul className="ll-chips" id="promise-chips">
      {CHIPS.map(({ id, key, kind }) => (
        <li className="ll-chip" data-kind={kind} id={id} key={id}>
          {t(key)}
        </li>
      ))}
    </ul>
  );
}
