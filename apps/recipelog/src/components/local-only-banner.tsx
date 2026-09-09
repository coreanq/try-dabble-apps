/**
 * The amber strip on top of the vault. The Worker rewrites this element's
 * text in the FIRST HTML, so the id must survive into the mounted app.
 */
export function LocalOnlyBanner({ text }: { text: string }) {
  return (
    <p className="rl-notice" id="local-only" role="note">
      {text}
    </p>
  );
}
