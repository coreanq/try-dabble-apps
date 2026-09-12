import { RotateCcw } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dateKeyOfIso } from "@/lib/dates";
import { formatRelativeDay } from "@/lib/format";
import { siteName, type Lang, type Translate } from "@/lib/i18n";
import type { DoseLog } from "@/lib/model";
import { rotationOrder, suggestNextSite } from "@/lib/rotation";

/** Ten dots, the one that has rested longest lit up. Tap any dot to put it in the quick log instead. */
export function RotationCard({ t, lang, logs, onUse }: { t: Translate; lang: Lang; logs: DoseLog[]; onUse: (site: string) => void }) {
  const next = suggestNextSite(logs);
  const order = rotationOrder(logs);
  return (
    <Card id="rotation-card" size="sm">
      <CardHeader className="grid-cols-[auto_1fr] items-center gap-2">
        <RotateCcw className="size-4 text-teal-deep" aria-hidden />
        <CardTitle>{t("rotationTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <p className="pl-hint">{t("rotationBody")}</p>
        <div className="pl-stat" data-tone="lav">
          <span className="pl-stat-label">{t("rotationNext")}</span>
          <span className="pl-stat-value" id="rotation-next" data-site={next}>
            {siteName(lang, next)}
          </span>
        </div>
        <button type="button" className="pl-btn pl-btn-primary" id="rotation-use" onClick={() => onUse(next)}>
          {t("rotationUse")}
        </button>
        <div className="pl-rotation" id="rotation-list">
          {order.map(({ site, lastUsed }) => (
            <button key={site} type="button" className="pl-site" data-site={site} data-next={site === next ? "true" : "false"} onClick={() => onUse(site)}>
              <span className="pl-site-dot" aria-hidden />
              <span className="truncate">{siteName(lang, site)}</span>
              <span className="pl-site-when">{lastUsed ? `${t("lastUsed")} ${formatRelativeDay(lang, dateKeyOfIso(lastUsed))}` : t("neverUsed")}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
