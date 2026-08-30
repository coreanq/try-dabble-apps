import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Translate } from "@/lib/i18n";

/**
 * Plain language, written for a caregiver holding a phone for someone else.
 * It says what the app is for before it asks for anything.
 */
export function EmptyState({ t, onStart }: { t: Translate; onStart: () => void }) {
  return (
    <Card id="empty-state" data-tone="lilac">
      <CardHeader>
        <CardTitle id="empty-title">{t("emptyTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="ps-note" id="empty-body">
          {t("emptyBody")}
        </p>
        <p className="ps-note mt-2" id="empty-body-2">
          {t("emptyBody2")}
        </p>
        <button type="button" className="ps-big mt-3" id="empty-cta" onClick={onStart}>
          {t("emptyCta")}
        </button>
      </CardContent>
    </Card>
  );
}
