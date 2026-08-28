import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Translate } from "@/lib/i18n";

/** Plain-language statement of the job, shown while nothing is saved yet. */
export function EmptyState({ t, onStart }: { t: Translate; onStart: () => void }) {
  return (
    <Card id="empty-state" className="bg-pad/70">
      <CardHeader>
        <CardTitle id="empty-title">{t("emptyTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="m-0 text-[0.84rem] leading-6 text-muted-ink" id="empty-body">
          {t("emptyBody")}
        </p>
        <Button className="mt-3" size="sm" id="empty-cta" onClick={onStart}>
          {t("emptyCta")}
        </Button>
      </CardContent>
    </Card>
  );
}
