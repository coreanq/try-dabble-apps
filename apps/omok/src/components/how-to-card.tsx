import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MsgKey, Translate } from "@/lib/i18n";

const HOW_TO: MsgKey[] = ["howToLi1", "howToLi2", "howToLi3", "howToLi4", "howToLi5", "howToLi6"];

/** The six things this board does, and the rule that governs it, in the
 *  reader's own language — the pre-Vite page hid this copy off-screen. */
export function HowToCard({ t }: { t: Translate }) {
  return (
    <Card>
      <CardHeader className="gb-headrule">
        <CardTitle>{t("howToTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3.5">
        <ol className="gb-howto">
          {HOW_TO.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ol>
        <div className="grid gap-1.5">
          <h3 className="gb-heading text-[0.86rem]">{t("rulesTitle")}</h3>
          <p className="gb-rules">{t("rulesBody")}</p>
        </div>
      </CardContent>
    </Card>
  );
}
