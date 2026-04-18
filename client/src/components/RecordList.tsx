import type { Record } from "../types";
import { RecordItem } from "./RecordItem";
import { EmptyState } from "./EmptyState";

interface Props {
  records: Record[];
  selectedId?: string;
  onSelect?: (record: Record) => void;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
}

export function RecordList({ records, selectedId, onSelect, hasActiveFilters, onClearFilters }: Props) {
  if (!records.length) {
    return (
      <EmptyState
        title="No records match the current filters."
        hint={hasActiveFilters ? "Try clearing the search or re-enabling hidden sources." : undefined}
        actionLabel={hasActiveFilters ? "Clear filters" : undefined}
        onAction={onClearFilters}
      />
    );
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
