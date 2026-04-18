import type { Record } from "../types";
import { SOURCE_COLORS, SOURCE_LABELS } from "../types";

interface Props {
  record: Record;
  onSelect?: (record: Record) => void;
  selected?: boolean;
}

export function RecordItem({ record, onSelect, selected }: Props) {
  const when = record.timestamp ?? record.createdAt;
  return (
    <button
      type="button"
      className={`record-item${selected ? " record-item--selected" : ""}`}
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
        <span className="record-item__when">{formatWhen(when)}</span>
      </div>
      {record.location && <div className="record-item__location">📍 {record.location}</div>}
      {record.text && <div className="record-item__text">{record.text}</div>}
    </button>
  );
}

function formatWhen(s: string | undefined): string {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
