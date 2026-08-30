/** The same sentence the Worker puts in the first HTML, re-rendered by React. */
export function LocalOnlyBanner({ text }: { readonly text: string }) {
  return (
    <p className="sd-notice text-center text-xs text-cream-muted" id="local-only" role="note">
      {text}
    </p>
  );
}
