export function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      id="toast"
      role="status"
      aria-live="polite"
      className={
        "pointer-events-none fixed bottom-[calc(1.25rem+var(--safe-b))] left-1/2 z-50 max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-[3px] border-[1.5px] border-chili-deep bg-chili px-4 py-2.5 text-[0.85rem] font-extrabold text-paper-2 shadow-[2px_2px_0_var(--color-chili-deep)] transition-[transform,opacity] duration-200 " +
        (visible ? "translate-y-0 opacity-100" : "translate-y-[120%] opacity-0")
      }
    >
      {message}
    </div>
  );
}
