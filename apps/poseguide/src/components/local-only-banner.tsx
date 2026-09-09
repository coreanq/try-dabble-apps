/**
 * The amber strip on top. The Worker rewrites this element's text in the
 * FIRST HTML, so the id must survive into the mounted app unchanged.
 */
export function LocalOnlyBanner({ text }: { text: string }) {
  return (
    <p className="pg-notice" id="local-only" role="note">
      {text}
    </p>
  );
}
