import type { Source } from "../types";
import { SOURCE_COLORS, SOURCE_LABELS } from "../types";

const ALL_SOURCES: Source[] = [
  "checkins",
  "messages",
  "sightings",
  "personalNotes",
  "anonymousTips",
];

interface Props {
  enabled: Set<Source>;
  onToggle: (source: Source) => void;
}

export function SourceFilter({ enabled, onToggle }: Props) {
  return (
    <div className="source-filter">
      {ALL_SOURCES.map((s) => {
        const on = enabled.has(s);
        return (
          <button
            key={s}
            type="button"
            className={`chip${on ? " chip--on" : ""}`}
            style={on ? { background: SOURCE_COLORS[s], color: "#0e1116" } : undefined}
            onClick={() => onToggle(s)}
          >
            {SOURCE_LABELS[s]}
          </button>
        );
      })}
    </div>
  );
}
