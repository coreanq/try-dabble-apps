import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/** AdSense ca-pub-3398336402999065, same slot the sibling apps carry. */
export function AdSlot() {
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
      className="min-h-[100px] w-full overflow-hidden rounded-[3px] border border-dashed border-[#c9b98d] bg-desk-2/60"
      id="ad-slot"
      role="complementary"
      aria-label="Advertisement"
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block", minHeight: "90px", width: "100%" }}
        data-ad-client="ca-pub-3398336402999065"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
