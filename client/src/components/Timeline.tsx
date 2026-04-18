import { Fragment } from "react";
import type { Record } from "../types";
import { SOURCE_COLORS, SOURCE_LABELS } from "../types";
import { dayKey, formatDay, formatShort } from "../lib/format";

interface Props {
  records: Record[];
  selectedId?: string;
  focusName: string;
  onSelect: (record: Record) => void;
}

export function Timeline({ records, selectedId, focusName, onSelect }: Props) {
  if (!records.length) {
    return (
      <div className="empty-state">
        <div className="empty-state__title">No timestamped records for {focusName} in the current filter.</div>
        <div className="empty-state__hint">Select a different person on the left, or loosen the source filter.</div>
      </div>
    );
  }

  const ordered = [...records]
    .filter((r) => r.timestamp || r.createdAt)
    .sort((a, b) => {
      const ta = a.timestamp ?? a.createdAt;
      const tb = b.timestamp ?? b.createdAt;
      return ta.localeCompare(tb);
    });

  let lastDay = "";
  return (
    <div className="timeline">
      {ordered.map((r, i) => {
        const when = r.timestamp ?? r.createdAt;
        const day = dayKey(when);
        const showHeader = day !== lastDay;
        lastDay = day;
        const others = r.people.filter(
          (n) => n.toLowerCase().trim() !== focusName.toLowerCase().trim()
        );
        return (
          <Fragment key={`${r.source}-${r.id}`}>
            {showHeader && <div className="timeline__day">{formatDay(when)}</div>}
            <button
              type="button"
              className={`timeline__row${r.id === selectedId ? " timeline__row--selected" : ""}`}
              onClick={() => onSelect(r)}
            >
              <div className="timeline__gutter">
                <span className="timeline__time">{formatShort(when)}</span>
                <span
                  className="timeline__dot"
                  style={{ background: SOURCE_COLORS[r.source] }}
                />
                {i < ordered.length - 1 && <span className="timeline__line" />}
              </div>
              <div className="timeline__card">
                <div className="timeline__card-header">
                  <span
                    className="record-item__badge"
                    style={{ background: SOURCE_COLORS[r.source] }}
                  >
                    {SOURCE_LABELS[r.source]}
                  </span>
                  {r.location && <span className="timeline__loc">📍 {r.location}</span>}
                </div>
                {others.length > 0 && (
                  <div className="timeline__with">with {others.join(", ")}</div>
                )}
                {r.text && <div className="timeline__text">{r.text}</div>}
              </div>
            </button>
          </Fragment>
        );
      })}
    </div>
  );
}

