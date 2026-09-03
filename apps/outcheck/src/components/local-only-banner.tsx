/**
 * Sticky note on the door. The Worker rewrites this element's text in the
 * FIRST HTML, so the id must survive into the mounted app unchanged.
 */
export function LocalOnlyBanner({ text }: { text: string }) {
  return (
    <p className="oc-notice" id="local-only" role="note">
      {text}
    </p>
  );
}
