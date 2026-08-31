export function Masthead({ title, sub }: { readonly title: string; readonly sub: string }) {
  return (
    // On a short screen the board is already down to its floor, so the title
    // block gives back what it can rather than pushing the keys off the bottom.
    <header className="sd-masthead flex flex-col items-center gap-1 py-3 [@media(max-height:720px)]:gap-0 [@media(max-height:720px)]:py-1">
      <h1
        className="font-display text-2xl text-ink [@media(max-height:720px)]:text-lg"
        id="brand-title"
      >
        {title}
      </h1>
      <p
        className="text-xs text-ink-muted [@media(max-height:720px)]:text-[10px]"
        id="brand-sub"
      >
        {sub}
      </p>
    </header>
  );
}
