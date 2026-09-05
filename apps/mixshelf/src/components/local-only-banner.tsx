export function LocalOnlyBanner({ text }: { text: string }) {
  return (
    <p className="ms-tape" id="local-only" role="note">
      {text}
    </p>
  );
}
