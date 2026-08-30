import type { MsgKey, Translate } from "@/lib/i18n";

/**
 * The gates this tray refuses, answered on the first screen before anything
 * else. Lumosity, Peak, Elevate and NeuroNation all put a sign-in in front of
 * the first game, cap a free day at a handful of exercises, and keep the rest
 * behind a subscription — and none of them let you skip to the one game you
 * actually came for. The two things this app DOES are stamped with a tick.
 *
 * The ids are also rewritten by the Worker in the no-JS shell (index.html), so
 * the very first HTML already carries the fail-fix in the requested ?lang=.
 */
export const CHIPS: { id: string; key: MsgKey; kind: "no" | "yes" }[] = [
  { id: "chip-nologin", key: "chipNoLogin", kind: "no" },
  { id: "chip-nolock", key: "chipNoLock", kind: "no" },
  { id: "chip-nosub", key: "chipNoSub", kind: "no" },
  { id: "chip-allgames", key: "chipAllGames", kind: "yes" },
  { id: "chip-persist", key: "chipPersist", kind: "yes" },
];

export function PromiseChips({ t }: { t: Translate }) {
  return (
    <ul className="ps-chips" id="promise-chips">
      {CHIPS.map(({ id, key, kind }) => (
        <li className="ps-chip" data-kind={kind} id={id} key={id}>
          {t(key)}
        </li>
      ))}
    </ul>
  );
}
