import { useState, type Ref } from "react";
import type { Source } from "../types";
import { SearchBar } from "./SearchBar";
import { SourceFilter } from "./SourceFilter";
import type { Theme } from "../hooks/useTheme";

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  enabledSources: Set<Source>;
  onToggleSource: (source: Source) => void;
  fuzzy: boolean;
  onFuzzyChange: (value: boolean) => void;
  searchRef?: Ref<HTMLInputElement>;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export function Controls({
  search,
  onSearchChange,
  enabledSources,
  onToggleSource,
  fuzzy,
  onFuzzyChange,
  searchRef,
  theme,
  onThemeChange,
}: Props) {
  const [copied, setCopied] = useState(false);
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="controls">
      <SearchBar ref={searchRef} value={search} onChange={onSearchChange} />
      <SourceFilter enabled={enabledSources} onToggle={onToggleSource} />
      <label className="fuzzy-toggle">
        <input
          type="checkbox"
          checked={fuzzy}
          onChange={(e) => onFuzzyChange(e.target.checked)}
        />
        <span>Fuzzy match</span>
      </label>
      <button type="button" className="share-btn" onClick={handleShare} title="Copy link to this view">
        {copied ? "Copied!" : "Share link"}
      </button>
      <button
        type="button"
        className="share-btn"
        onClick={() => onThemeChange(theme === "dark" ? "light" : "dark")}
        title="Toggle theme"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? "☀ Light" : "☾ Dark"}
      </button>
    </div>
  );
}
