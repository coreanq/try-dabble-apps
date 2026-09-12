import { Hourglass } from "lucide-react";

import { InlineDisclaimer } from "@/components/disclaimer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmt, halfLifeRemaining } from "@/lib/calc";
import { hoursSince } from "@/lib/dates";
import type { Translate } from "@/lib/i18n";
import type { Compound, DoseLog } from "@/lib/model";

/**
 * Optional, off by default. For each compound with a user-entered half-life,
 * shows a toy "about X left" figure from simple halving since the last log.
 * Labelled estimate-only everywhere it appears; never feeds any other screen.
 */
export function HalfLifeCard({
  t,
  compounds,
  logs,
  enabled,
  onToggle,
  now,
}: {
  t: Translate;
  compounds: Compound[];
  logs: DoseLog[];
  enabled: boolean;
  onToggle: (next: boolean) => void;
  now?: Date;
}) {
  const withHl = compounds.filter((c) => typeof c.halfLifeHours === "number" && c.halfLifeHours > 0);
  return (
    <Card id="halflife-card" size="sm">
      <CardHeader className="grid-cols-[auto_1fr] items-center gap-2">
        <Hourglass className="size-4 text-teal-deep" aria-hidden />
        <CardTitle>{t("halfLifeTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <label className="pl-toggle" htmlFor="halflife-toggle">
          <span className="pl-toggle-label">{t("halfLifeToggle")}</span>
          <input id="halflife-toggle" className="pl-switch" type="checkbox" checked={enabled} onChange={(e) => onToggle(e.target.checked)} />
        </label>
        {enabled && (
          <>
            <span className="pl-badge" data-tone="lav" id="halflife-badge">
              {t("halfLifeEstimateOnly")}
            </span>
            <p className="pl-hint">{t("halfLifeBody")}</p>
            {withHl.length === 0 ? (
              <p className="pl-hint" id="halflife-none">
                {t("halfLifeNoCompound")}
              </p>
            ) : (
              <ul className="pl-list" id="halflife-list">
                {withHl.map((c) => {
                  const last = logs.find((l) => l.compoundId === c.id);
                  if (!last) {
                    return (
                      <li key={c.id} className="pl-row" data-compound={c.id}>
                        <p className="pl-row-text">{t("halfLifeNoLog", { compound: c.name })}</p>
                      </li>
                    );
                  }
                  const hours = hoursSince(last.datetime, now);
                  const remaining = halfLifeRemaining(last.amount, c.halfLifeHours as number, hours);
                  return (
                    <li key={c.id} className="pl-row" data-compound={c.id}>
                      <p className="pl-row-text">
                        {t("halfLifeLine", {
                          compound: c.name,
                          amount: last.amount,
                          unit: last.unitLabel ?? c.unitLabel ?? "",
                          hours: fmt(hours, 1),
                          remaining: fmt(remaining, 2),
                          hl: c.halfLifeHours as number,
                        })}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
            <InlineDisclaimer id="halflife-disclaimer" text={t("halfLifeEstimateOnly")} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
