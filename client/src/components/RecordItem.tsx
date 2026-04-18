import type { Record } from "../types";
import { SOURCE_COLORS, SOURCE_LABELS } from "../types";
import { formatShort } from "../lib/format";

interface Props {
  record: Record;
  onSelect?: (record: Record) => void;
  selected?: boolean;
  postDisappearance?: boolean;
}

export function RecordItem({ record, onSelect, selected, postDisappearance }: Props) {
  const when = record.timestamp ?? record.createdAt;
  return (
    <button
      type="button"
      data-record-key={`${record.source}-${record.id}`}
      className={`record-item${selected ? " record-item--selected" : ""}${postDisappearance ? " record-item--anomaly" : ""}`}
      onClick={() => onSelect?.(record)}
    >
      <div className="record-item__row">
        <span
          className="record-item__badge"
          style={{ background: SOURCE_COLORS[record.source] }}
        >
          {SOURCE_LABELS[record.source]}
        </span>
        <span className="record-item__people">
          {record.people.length ? record.people.join(", ") : "—"}
        </span>
        {postDisappearance && (
          <span className="record-item__anomaly" title="Timestamped after Podo's last confirmed sighting — possible lead or contradiction">
            ⚠ post-disappearance
          </span>
        )}
        <span className="record-item__when">{when ? formatShort(when) : ""}</span>
      </div>
      {record.location && <div className="record-item__location">📍 {record.location}</div>}
      {record.text && <div className="record-item__text">{record.text}</div>}
    </button>
  );
}
