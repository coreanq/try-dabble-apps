import type { MsgKey, Translate } from "@/lib/i18n";

/**
 * The gates this app refuses, answered on the first screen before anything
 * else: Store Orders App and DMOrder both make a DM seller sign in with Meta
 * before they can write down a single order, and the spreadsheet everyone
 * falls back to is filled in at night rather than mid-chat. The two things
 * this app DOES — export, and surviving a tab close — are stamped with a tick
 * rather than a cross.
 *
 * The ids are also rewritten by the Worker in the no-JS shell (index.html), so
 * the very first HTML already carries these in the requested ?lang=.
 */
export const CHIPS: { id: string; key: MsgKey; kind: "no" | "yes" }[] = [
  { id: "chip-nometa", key: "chipNoMeta", kind: "no" },
  { id: "chip-nologin", key: "chipNoLogin", kind: "no" },
  { id: "chip-unlimited", key: "chipUnlimited", kind: "no" },
  { id: "chip-export", key: "chipExport", kind: "yes" },
  { id: "chip-persist", key: "chipPersist", kind: "yes" },
];

export function PromiseChips({ t }: { t: Translate }) {
  return (
    <ul className="op-chips" id="promise-chips">
      {CHIPS.map(({ id, key, kind }) => (
        <li className="op-chip" data-kind={kind} id={id} key={id}>
          {t(key)}
        </li>
      ))}
    </ul>
  );
}
