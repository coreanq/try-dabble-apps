export function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      id="toast"
      role="status"
      aria-live="polite"
      className={
        "pointer-events-none fixed inset-x-3 bottom-[calc(1rem+var(--safe-b))] z-50 mx-auto max-w-[30rem] rounded-lg border border-rail bg-[#1d1430] px-3 py-2 text-center text-[0.82rem] font-bold text-stage-ink shadow-[0_10px_30px_rgba(0,0,0,0.6)] transition-opacity duration-200 " +
        (visible ? "opacity-100" : "opacity-0")
      }
    >
      {message}
    </div>
  );
}
