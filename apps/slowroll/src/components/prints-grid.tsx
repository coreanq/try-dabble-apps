import { Download } from "lucide-react";

import type { Print } from "@/lib/develop";
import type { Translate } from "@/lib/i18n";

/**
 * The developed roll: every print at once, warm and grainy, on paper. This
 * component is only ever mounted with a full set — the caller waits for all
 * prints before rendering it, so no frame appears before another.
 */
export function PrintsGrid({
  prints,
  t,
  onDownload,
}: {
  prints: Print[];
  t: Translate;
  onDownload: (index: number) => void;
}) {
  return (
    <div className="sr-prints sr-prints-reveal" id="prints">
      {prints.map((p, i) => (
        <figure className="sr-print m-0" key={p.id} data-frame={i + 1}>
          <div className="sr-print-img-wrap">
            <img className="sr-print-img" src={p.url} alt={t("frameNo", { n: i + 1 })} loading="lazy" />
          </div>
          <figcaption className="sr-print-row">
            <span className="sr-print-no">{t("frameNo", { n: i + 1 })}</span>
            <button
              type="button"
              className="sr-key"
              style={{ minHeight: "2.4rem", padding: "0 0.6rem" }}
              aria-label={`${t("download")} ${t("frameNo", { n: i + 1 })}`}
              onClick={() => onDownload(i)}
            >
              <Download className="size-4" aria-hidden />
              {t("download")}
            </button>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
