interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function SearchBar({ value, onChange }: Props) {
  return (
    <div className="search">
      <input
        type="search"
        className="search__input"
        placeholder="Search people, locations, notes…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button type="button" className="search__clear" onClick={() => onChange("")}>
          ×
        </button>
      )}
    </div>
  );
}
