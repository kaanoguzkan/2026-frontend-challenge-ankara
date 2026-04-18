import { useMemo, useState } from "react";
import { useRecords } from "./hooks/useRecords";
import { RecordList } from "./components/RecordList";
import { PeopleList } from "./components/PeopleList";
import { groupByPerson, recordsForPerson } from "./lib/link";

export function App() {
  const { data, loading, error } = useRecords();
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);

  const people = useMemo(() => (data ? groupByPerson(data.records) : []), [data]);

  const visibleRecords = useMemo(() => {
    if (!data) return [];
    const pool = selectedPerson ? recordsForPerson(data.records, selectedPerson) : data.records;
    return [...pool].sort((a, b) => {
      const ta = a.timestamp ?? a.createdAt;
      const tb = b.timestamp ?? b.createdAt;
      return tb.localeCompare(ta);
    });
  }, [data, selectedPerson]);

  const selectedPersonName = selectedPerson
    ? people.find((p) => p.key === selectedPerson)?.displayName
    : null;

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1>Missing Podo</h1>
          <p className="app__subtitle">The Ankara Case — investigation dashboard</p>
        </div>
        {data && (
          <div className="app__meta">
            {data.records.length} records · {people.length} people · cached{" "}
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

      {data && (
        <div className="layout">
          <PeopleList
            people={people}
            selectedKey={selectedPerson}
            onSelect={setSelectedPerson}
          />
          <main className="main">
            <div className="main__header">
              <h2>
                {selectedPersonName
                  ? `Records involving ${selectedPersonName}`
                  : "All records"}
              </h2>
              <span className="main__count">{visibleRecords.length}</span>
            </div>
            <RecordList records={visibleRecords} />
          </main>
        </div>
      )}
    </div>
  );
}
