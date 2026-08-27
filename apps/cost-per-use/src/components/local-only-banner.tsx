/**
 * Amber local-only notice. The Worker rewrites this element's text in the FIRST
 * HTML, so the id must survive into the mounted app unchanged, and the number
 * sign stays a CSS ::before (setInnerContent would wipe a real child).
 */
export function LocalOnlyBanner({ text }: { text: string }) {
  return (
    <p className="cpu-notice" id="local-only" role="note">
      {text}
    </p>
  );
}
