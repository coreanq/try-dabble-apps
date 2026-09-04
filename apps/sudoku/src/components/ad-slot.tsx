import { useEffect, useRef } from "react";

import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/locales";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/** AdSense ca-pub-1343411537040925, same slot the sibling apps carry. */
export function AdSlot({ locale }: { readonly locale: Locale }) {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* blocked or offline — the slot just stays empty */
    }
  }, []);

  return (
    <div
      className="mx-auto min-h-[100px] w-full max-w-2xl overflow-hidden rounded-[1.1rem] border border-dashed border-panel bg-cream/60"
      id="ad-slot"
      role="complementary"
      aria-label={t(locale, "adLabel")}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block", minHeight: "90px", width: "100%" }}
        data-ad-client="ca-pub-1343411537040925"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
