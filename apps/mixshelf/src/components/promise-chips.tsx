import type { MsgKey } from "@/lib/i18n";

export const CHIPS: { id: string; key: MsgKey; kind: "no" | "yes" }[] = [
  { id: "chip-nologin", key: "chipNoLogin", kind: "no" },
  { id: "chip-nocap", key: "chipNoCap", kind: "no" },
  { id: "chip-multitype", key: "chipMultiType", kind: "yes" },
  { id: "chip-tags", key: "chipTags", kind: "yes" },
  { id: "chip-filter", key: "chipFilter", kind: "yes" },
  { id: "chip-manual", key: "chipManual", kind: "yes" },
  { id: "chip-persist", key: "chipPersist", kind: "yes" },
  { id: "chip-json", key: "chipJson", kind: "yes" },
];

export function PromiseChips({ t }: { t: (key: MsgKey) => string }) {
  return (
    <ul className="ms-chips" id="promise-chips">
      {CHIPS.map(({ id, key, kind }) => (
        <li className="ms-chip" data-kind={kind} id={id} key={id}>
          {t(key)}
        </li>
      ))}
    </ul>
  );
}
