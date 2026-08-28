export function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      id="toast"
      role="status"
      aria-live="polite"
      className={
        "pointer-events-none fixed bottom-[calc(1.25rem+var(--safe-b))] left-1/2 z-[900] max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-[2px] border-[1.5px] border-ink bg-ink px-4 py-2.5 text-[0.82rem] font-bold text-stub shadow-[0_4px_10px_rgba(46,39,51,0.32)] transition-[transform,opacity] duration-200 " +
        (visible ? "translate-y-0 opacity-100" : "translate-y-[130%] opacity-0")
      }
    >
      {message}
    </div>
  );
}
