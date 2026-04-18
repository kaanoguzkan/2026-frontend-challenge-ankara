import type { Record } from "../types";
import { RecordItem } from "./RecordItem";

interface Props {
  records: Record[];
  selectedId?: string;
  onSelect?: (record: Record) => void;
}

export function RecordList({ records, selectedId, onSelect }: Props) {
  if (!records.length) {
    return <div className="empty-state">No records match the current filters.</div>;
  }
  return (
    <div className="record-list">
      {records.map((r) => (
        <RecordItem
          key={`${r.source}-${r.id}`}
          record={r}
          onSelect={onSelect}
          selected={r.id === selectedId}
        />
      ))}
    </div>
  );
}
