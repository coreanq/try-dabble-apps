/**
 * The persistent not-medical-advice strip. The Worker rewrites #not-medical in
 * the FIRST HTML, so the id must survive into the mounted app unchanged.
 */
export function Disclaimer({ text }: { text: string }) {
  return (
    <p className="pl-disclaimer" id="not-medical" role="note">
      {text}
    </p>
  );
}

/** Short inline variant used inside the calculator and half-life cards. */
export function InlineDisclaimer({ text, id }: { text: string; id?: string }) {
  return (
    <p className="pl-disclaimer-inline" id={id} role="note">
      {text}
    </p>
  );
}
