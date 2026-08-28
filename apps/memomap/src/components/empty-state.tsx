import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Translate } from "@/lib/i18n";

/** Plain-language statement of the job, shown while the map has no pins. */
export function EmptyState({ t, onPinCentre }: { t: Translate; onPinCentre: () => void }) {
  return (
    <Card id="empty-state">
      <CardHeader>
        <CardTitle id="empty-title">{t("emptyTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="m-0 text-[0.84rem] leading-6 text-muted-ink" id="empty-body">
          {t("emptyBody")}
        </p>
        <Button className="mt-3" size="sm" id="empty-cta" onClick={onPinCentre}>
          {t("emptyCta")}
        </Button>
      </CardContent>
    </Card>
  );
}
