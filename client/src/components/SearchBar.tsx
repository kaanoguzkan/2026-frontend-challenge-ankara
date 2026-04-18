import { forwardRef } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export const SearchBar = forwardRef<HTMLInputElement, Props>(function SearchBar(
  { value, onChange },
  ref
) {
  return (
    <div className="search">
      <input
        ref={ref}
        type="search"
        className="search__input"
        placeholder="Search people, locations, notes… (press /)"
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
});
