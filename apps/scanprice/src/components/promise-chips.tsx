import type { Translate } from "@/lib/i18n";

/** The named fail-fix, above the fold: this one scans, tags the shop and keeps
 *  a dated history — and asks for nothing. Mirrored in the no-JS shell. */
export function PromiseChips({ t }: { t: Translate }) {
  return (
    <ul className="sp-chips" id="promise-chips">
      <li className="sp-chip" id="chip-scan">
        {t("chipScan")}
      </li>
      <li className="sp-chip" id="chip-store">
        {t("chipStore")}
      </li>
      <li className="sp-chip" id="chip-history">
        {t("chipHistory")}
      </li>
      <li className="sp-chip" data-kind="no" id="chip-nologin">
        {t("chipNoLogin")}
      </li>
      <li className="sp-chip" id="chip-persist">
        {t("chipPersist")}
      </li>
    </ul>
  );
}
