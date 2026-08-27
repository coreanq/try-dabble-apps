import type { Translate } from "@/lib/i18n";

/** Landscape is the playable orientation; CSS shows this only in portrait. */
export function PortraitHint({ t }: { t: Translate }) {
  return (
    <div id="portrait-hint" role="note">
      <span aria-hidden="true">📱</span>
      <span id="portrait-hint-text">{t("portraitHint")}</span>
    </div>
  );
}
