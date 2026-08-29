import type { MsgKey, Translate } from "@/lib/i18n";

/**
 * The gates this app refuses, answered on the first screen before anything
 * else: Google Sheets on a phone is the thing people give up on, Collections
 * stops free users at 100 documents, and Customer List keeps "unlimited"
 * behind PRO. The two things this app DOES — export, and surviving a tab
 * close — are stamped with a tick rather than a cross.
 *
 * The ids are also rewritten by the Worker in the no-JS shell (index.html), so
 * the very first HTML already carries these in the requested ?lang=.
 */
export const CHIPS: { id: string; key: MsgKey; kind: "no" | "yes" }[] = [
  { id: "chip-nologin", key: "chipNoLogin", kind: "no" },
  { id: "chip-nolock", key: "chipNoLock", kind: "no" },
  { id: "chip-nosheet", key: "chipNoSheet", kind: "no" },
  { id: "chip-export", key: "chipExport", kind: "yes" },
  { id: "chip-persist", key: "chipPersist", kind: "yes" },
];

export function PromiseChips({ t }: { t: Translate }) {
  return (
    <ul className="sl-chips" id="promise-chips">
      {CHIPS.map(({ id, key, kind }) => (
        <li className="sl-chip" data-kind={kind} id={id} key={id}>
          {t(key)}
        </li>
      ))}
    </ul>
  );
}
