export function SbMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" className={className}>
      <rect x="10" y="6" width="44" height="52" rx="6" fill="#2f6f5e" />
      <path d="M14 10h36v40l-4 -3 -4 3 -4 -3 -4 3 -4 -3 -4 3 -4 -3 -4 3z" fill="#f7f3ea" />
      <rect x="20" y="18" width="24" height="3" rx="1.5" fill="#1e293b" />
      <rect x="20" y="26" width="16" height="3" rx="1.5" fill="#1e293b" opacity="0.55" />
      <rect x="20" y="34" width="20" height="3" rx="1.5" fill="#1e293b" opacity="0.55" />
      <circle cx="42" cy="36" r="6" fill="#e85d4c" />
    </svg>
  );
}
