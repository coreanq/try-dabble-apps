import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Translate } from "@/lib/i18n";
import { hostOf, type Item } from "@/lib/items";

/**
 * Bookmark imports land here, not in the inbox. A why is required before a
 * draft counts as saved — that is the rule the whole app is built on, so an
 * import can never quietly turn into a Pocket-style dump.
 */
export function DraftsCard({
  drafts,
  t,
  onSave,
  onSkip,
  onError,
}: {
  drafts: Item[];
  t: Translate;
  onSave: (item: Item, why: string) => void;
  onSkip: (item: Item) => void;
  onError: (message: string) => void;
}) {
  const [whys, setWhys] = useState<Record<string, string>>({});

  if (drafts.length === 0) return null;

  function handleSave(item: Item) {
    const why = (whys[item.id] ?? "").trim();
    if (!why) {
      onError(t("needWhy"));
      return;
    }
    setWhys((prev) => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
    onSave(item, why);
  }

  return (
    <Card id="drafts-section">
      <CardHeader>
        <CardTitle id="drafts-title">{t("draftsTitle")}</CardTitle>
        <CardAction>
          <span id="drafts-count" className="li-count">
            {drafts.length}
          </span>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="mt-0 mb-[0.5rem] text-[0.72rem] text-muted-ink" id="drafts-hint">
          {t("draftsHint")}
        </p>
        <div id="drafts-list" className="grid gap-[0.6rem]">
          {drafts.map((item) => (
            <article key={item.id} className="li-slip" data-draft-id={item.id}>
              <div className="font-heading text-[0.92rem] leading-snug font-bold break-words text-ink">
                {item.title.trim() || hostOf(item.url) || t("hostFallback")}
              </div>
              <div className="mt-[0.15rem] font-mono text-[0.66rem] break-all text-muted-ink">
                {item.url}
              </div>
              <input
                className="li-field mt-[0.45rem]"
                type="text"
                maxLength={200}
                placeholder={t("draftWhyPh")}
                value={whys[item.id] ?? ""}
                onChange={(e) =>
                  setWhys((prev) => ({ ...prev, [item.id]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSave(item);
                  }
                }}
              />
              <div className="mt-[0.45rem] flex flex-wrap gap-[0.32rem]">
                <Button type="button" size="xs" onClick={() => handleSave(item)}>
                  {t("draftSave")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => onSkip(item)}
                >
                  {t("draftSkip")}
                </Button>
              </div>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
