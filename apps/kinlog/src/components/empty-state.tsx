import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Translate } from "@/lib/i18n";

/** Plain-language statement of the job, shown while the book is empty. */
export function EmptyState({ t }: { t: Translate }) {
  return (
    <Card id="empty-state">
      <CardHeader>
        <CardTitle id="empty-title">{t("emptyTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="m-0 text-[0.84rem] leading-6 text-muted-ink" id="empty-body">
          {t("emptyBody")}
        </p>
      </CardContent>
    </Card>
  );
}
