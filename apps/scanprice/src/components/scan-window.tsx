import type { Translate } from "@/lib/i18n";

/**
 * The idle viewfinder that starts a scan: dark glass, yellow corner brackets,
 * a red line sweeping ghost bars. It is the app's one big control, sized for a
 * thumb on a 390px phone.
 */
export function ScanWindow({ t, onOpen }: { t: Translate; onOpen: () => void }) {
  return (
    <button type="button" className="sp-scanwin" id="scan-open" onClick={onOpen}>
      <span className="sp-scanwin-bars" />
      <span className="sp-bracket" data-c="tl" />
      <span className="sp-bracket" data-c="tr" />
      <span className="sp-bracket" data-c="bl" />
      <span className="sp-bracket" data-c="br" />
      <span className="sp-laser" />
      <span className="sp-scanwin-face">
        <span className="sp-scanwin-sub">{t("scanPanelTitle")}</span>
        <span className="sp-scanwin-title">{t("scanBtn")}</span>
        <span className="sp-scanwin-sub">{t("scanFormats")}</span>
      </span>
    </button>
  );
}
