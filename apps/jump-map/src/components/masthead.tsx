import { BlockMark } from "@/components/block-mark";
import { HowToDialog } from "@/components/how-to-dialog";
import type { Translate } from "@/lib/i18n";

/**
 * The marquee. h1#brand-title is the element the Worker rewrites for ?lang=,
 * so it must keep both the tag and the id.
 */
export function Masthead({ t }: { t: Translate }) {
  return (
    <header className="pj-masthead">
      <BlockMark />
      <div className="pj-brand">
        <h1 id="brand-title">{t("title")}</h1>
        <p id="brand-sub">{t("titleSub")}</p>
      </div>
      <div className="pj-masthead-actions">
        <HowToDialog t={t} />
      </div>
    </header>
  );
}
