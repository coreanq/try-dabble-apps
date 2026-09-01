import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Translate } from "@/lib/i18n";

/** The aisle job, in plain language, for a page with nothing on it yet. */
export function EmptyState({ t }: { t: Translate }) {
  return (
    <Card id="empty-card">
      <CardHeader>
        <CardTitle id="empty-title">{t("emptyTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="m-0 text-[0.82rem] leading-6 text-muted-ink" id="empty-body">
          {t("emptyBody")}
        </p>
        <ul className="mt-2.5 flex list-none flex-col gap-1.5 p-0">
          <li className="sp-step" id="empty-step-1">
            <span>{t("emptyStep1")}</span>
          </li>
          <li className="sp-step" id="empty-step-2">
            <span>{t("emptyStep2")}</span>
          </li>
          <li className="sp-step" id="empty-step-3">
            <span>{t("emptyStep3")}</span>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
