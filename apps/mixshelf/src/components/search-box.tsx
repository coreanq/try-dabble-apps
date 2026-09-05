export function SearchBox({
  label,
  placeholder,
  clearLabel,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  clearLabel: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="ms-search" id="search-box">
      <label className="sr-only" htmlFor="search-input">
        {label}
      </label>
      <input
        id="search-input"
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{ fontSize: 16, touchAction: "manipulation" }}
        autoComplete="off"
      />
      {value ? (
        <button
          type="button"
          id="search-clear"
          onClick={() => onChange("")}
          style={{ fontSize: 16, touchAction: "manipulation" }}
        >
          {clearLabel}
        </button>
      ) : null}
    </div>
  );
}
