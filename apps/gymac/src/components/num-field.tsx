import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";

/**
 * A numeric input that keeps its own text while the person is typing (so
 * "60." and "" survive a keystroke) and commits a parsed number to the
 * parent on every valid change. When the parent value changes from outside
 * (unit switch, import) the text follows. 16px, decimal keypad, never focused on mount.
 */
export function NumField({
  id,
  value,
  onCommit,
  className,
  placeholder,
  integer = false,
  ariaLabel,
  min = 0,
}: {
  id?: string;
  value: number | undefined;
  onCommit: (n: number | undefined) => void;
  className?: string;
  placeholder?: string;
  integer?: boolean;
  ariaLabel?: string;
  min?: number;
}) {
  const asText = (v: number | undefined) => (v === undefined || (v === 0 && placeholder !== undefined) ? "" : String(v));
  const [text, setText] = useState(() => asText(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(asText(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, focused]);

  return (
    <Input
      id={id}
      className={className}
      inputMode={integer ? "numeric" : "decimal"}
      autoComplete="off"
      enterKeyHint="done"
      placeholder={placeholder}
      aria-label={ariaLabel}
      value={text}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        setText(asText(value));
      }}
      onChange={(e) => {
        const raw = e.target.value.replace(integer ? /[^\d]/g : /[^\d.]/g, "");
        setText(raw);
        if (raw === "" || raw === ".") {
          onCommit(undefined);
          return;
        }
        const n = Number(raw);
        if (Number.isFinite(n) && n >= min) onCommit(integer ? Math.round(n) : n);
      }}
    />
  );
}
