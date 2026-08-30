export function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      id="toast"
      role="status"
      aria-live="polite"
      className={
        "pointer-events-none fixed bottom-[calc(1.25rem+var(--safe-b))] left-1/2 z-[900] max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-full border-[2.5px] border-ink bg-ink px-5 py-3 text-[0.88rem] font-bold text-felt shadow-[0_5px_12px_rgba(75,58,38,0.3)] transition-[transform,opacity] duration-200 " +
        (visible ? "translate-y-0 opacity-100" : "translate-y-[130%] opacity-0")
      }
    >
      {message}
    </div>
  );
}
