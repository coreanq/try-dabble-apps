export function Masthead({ title, sub }: { readonly title: string; readonly sub: string }) {
  return (
    <header className="sd-masthead flex flex-col items-center gap-1 py-3">
      <h1 className="font-display text-2xl text-cream" id="brand-title">
        {title}
      </h1>
      <p className="text-xs text-cream-muted" id="brand-sub">
        {sub}
      </p>
    </header>
  );
}
