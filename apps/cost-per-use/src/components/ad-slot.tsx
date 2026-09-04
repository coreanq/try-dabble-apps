import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/** AdSense ca-pub-1343411537040925, carried over from the pre-Vite shell. */
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
      className="min-h-[100px] w-full overflow-hidden rounded-[2px] border border-dashed border-edge bg-[rgba(253,250,240,0.6)]"
      id="ad-slot"
      role="complementary"
      aria-label="Advertisement"
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
