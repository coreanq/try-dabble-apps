import type { MsgKey, Translate } from "@/lib/i18n";

/**
 * The five complaints the store apps earn, answered on the first screen before
 * anything else: forced credit card, contacts/invite spam, notes that vanish,
 * settings that reset, paywalled limits. "Type the names" is the one thing
 * this app DOES, so it is stamped as a tick rather than a cross.
 *
 * The ids are also rewritten by the Worker in the no-JS shell (index.html), so
 * the very first HTML already carries these in the requested ?lang=.
 */
export const CHIPS: { id: string; key: MsgKey; kind: "no" | "yes" }[] = [
  { id: "chip-nologin", key: "chipNoLogin", kind: "no" },
  { id: "chip-nocard", key: "chipNoCard", kind: "no" },
  { id: "chip-nocontacts", key: "chipNoContacts", kind: "no" },
  { id: "chip-noiap", key: "chipNoIap", kind: "yes" },
  { id: "chip-manual", key: "chipManual", kind: "yes" },
];

export function PromiseChips({ t }: { t: Translate }) {
  return (
    <ul className="kl-chips" id="promise-chips">
      {CHIPS.map(({ id, key, kind }) => (
        <li className="kl-chip" data-kind={kind} id={id} key={id}>
          {t(key)}
        </li>
      ))}
    </ul>
  );
}
