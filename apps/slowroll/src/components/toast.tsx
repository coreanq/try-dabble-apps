export function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      id="toast"
      role="status"
      aria-live="polite"
      className={
        "pointer-events-none fixed inset-x-3 bottom-[calc(1rem+var(--safe-b))] z-50 mx-auto max-w-[30rem] rounded-lg border border-[#8a5f12] bg-[#f2b632] px-3 py-2 text-center text-[0.84rem] font-bold text-[#2a2118] shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-opacity duration-200 " +
        (visible ? "opacity-100" : "opacity-0")
      }
    >
      {message}
    </div>
  );
}
