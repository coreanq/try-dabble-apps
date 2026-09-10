export function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      id="toast"
      role="status"
      aria-live="polite"
      className={
        "pointer-events-none fixed inset-x-3 bottom-[calc(1rem+var(--safe-b))] z-50 mx-auto max-w-[28rem] rounded-xl border border-line bg-ink px-3 py-2 text-center text-[0.9rem] font-bold text-white shadow-[0_10px_30px_rgba(43,58,46,0.25)] transition-opacity duration-200 " +
        (visible ? "opacity-100" : "opacity-0")
      }
    >
      {message}
    </div>
  );
}
