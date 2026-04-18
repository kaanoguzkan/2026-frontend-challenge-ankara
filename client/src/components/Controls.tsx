import type { Source } from "../types";
import { SearchBar } from "./SearchBar";
import { SourceFilter } from "./SourceFilter";

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  enabledSources: Set<Source>;
  onToggleSource: (source: Source) => void;
  fuzzy: boolean;
  onFuzzyChange: (value: boolean) => void;
}

export function Controls({
  search,
  onSearchChange,
  enabledSources,
  onToggleSource,
  fuzzy,
  onFuzzyChange,
}: Props) {
  return (
    <div className="controls">
      <SearchBar value={search} onChange={onSearchChange} />
      <SourceFilter enabled={enabledSources} onToggle={onToggleSource} />
      <label className="fuzzy-toggle">
        <input
          type="checkbox"
          checked={fuzzy}
          onChange={(e) => onFuzzyChange(e.target.checked)}
        />
        <span>Fuzzy match</span>
      </label>
    </div>
  );
}
