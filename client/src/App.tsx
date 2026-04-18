import { useMemo } from "react";
import { useRecords } from "./hooks/useRecords";
import { RecordList } from "./components/RecordList";
import { SOURCE_LABELS } from "./types";

export function App() {
  const { data, loading, error } = useRecords();

  const sortedRecords = useMemo(() => {
    if (!data) return [];
    return [...data.records].sort((a, b) => {
      const ta = a.timestamp ?? a.createdAt;
      const tb = b.timestamp ?? b.createdAt;
      return tb.localeCompare(ta);
    });
  }, [data]);

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1>Missing Podo</h1>
          <p className="app__subtitle">The Ankara Case — investigation dashboard</p>
        </div>
        {data && (
          <div className="app__meta">
            {data.records.length} records ·{" "}
            {Object.keys(SOURCE_LABELS).length} sources · cached{" "}
            {new Date(data.cachedAt).toLocaleTimeString()}
          </div>
        )}
      </header>

      {loading && <div className="status status--loading">Loading records…</div>}
      {error && <div className="status status--error">Failed to load: {error}</div>}
      {data?.errors.length ? (
        <div className="status status--warn">
          Partial fetch: {data.errors.map((e) => e.source).join(", ")} unavailable
        </div>
      ) : null}

      {data && <RecordList records={sortedRecords} />}
    </div>
  );
}
