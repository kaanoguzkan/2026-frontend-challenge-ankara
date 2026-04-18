import { useMemo, useState } from "react";
import { useRecords } from "./hooks/useRecords";
import { RecordList } from "./components/RecordList";
import { PeopleList } from "./components/PeopleList";
import { SearchBar } from "./components/SearchBar";
import { SourceFilter } from "./components/SourceFilter";
import { RecordDetail } from "./components/RecordDetail";
import { Timeline } from "./components/Timeline";
import { groupByPerson, recordsForPerson } from "./lib/link";
import type { Record, Source } from "./types";

type View = "list" | "timeline";

const ALL_SOURCES: Source[] = [
  "checkins",
  "messages",
  "sightings",
  "personalNotes",
  "anonymousTips",
];

function normalizeSearchKey(s: string): string {
  return s.toLowerCase().trim();
}

export function App() {
  const { data, loading, error } = useRecords();
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [enabledSources, setEnabledSources] = useState<Set<Source>>(new Set(ALL_SOURCES));
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);
  const [view, setView] = useState<View>("list");

  const people = useMemo(() => (data ? groupByPerson(data.records) : []), [data]);

  const timelineFocus = useMemo(() => {
    if (!data) return { key: "podo", name: "Podo" };
    if (selectedPerson) {
      const p = people.find((p) => p.key === selectedPerson);
      if (p) return { key: p.key, name: p.displayName };
    }
    const podo = people.find((p) => p.key === "podo");
    return podo ? { key: podo.key, name: podo.displayName } : { key: "podo", name: "Podo" };
  }, [data, selectedPerson, people]);

  const filteredRecords = useMemo(() => {
    if (!data) return [];
    const q = normalizeSearchKey(search);
    let pool = selectedPerson ? recordsForPerson(data.records, selectedPerson) : data.records;
    pool = pool.filter((r) => enabledSources.has(r.source));
    if (q) {
      pool = pool.filter((r) => {
        const hay = [
          ...r.people,
          r.location ?? "",
          r.text ?? "",
          r.urgency ?? "",
          r.confidence ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }
    return [...pool].sort((a, b) => {
      const ta = a.timestamp ?? a.createdAt;
      const tb = b.timestamp ?? b.createdAt;
      return tb.localeCompare(ta);
    });
  }, [data, selectedPerson, enabledSources, search]);

  const relatedRecords = useMemo(() => {
    if (!data || !selectedRecord) return [];
    const names = new Set(selectedRecord.people.map((n) => n.toLowerCase().trim().replace(/\s+/g, " ")));
    return data.records.filter((r) => {
      if (r.id === selectedRecord.id && r.source === selectedRecord.source) return false;
      return r.people.some((n) => names.has(n.toLowerCase().trim().replace(/\s+/g, " ")));
    });
  }, [data, selectedRecord]);

  const toggleSource = (s: Source) => {
    setEnabledSources((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

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
        <>
          <div className="controls">
            <SearchBar value={search} onChange={setSearch} />
            <SourceFilter enabled={enabledSources} onToggle={toggleSource} />
          </div>

          <div className="layout">
            <PeopleList
              people={people}
              selectedKey={selectedPerson}
              onSelect={(key) => {
                setSelectedPerson(key);
                setSelectedRecord(null);
              }}
            />
            <div className="workspace">
              <main className="main">
              <div className="main__header">
                <h2>
                  {view === "timeline"
                    ? `${timelineFocus.name}'s timeline`
                    : selectedPersonName
                    ? `Records involving ${selectedPersonName}`
                    : "All records"}
                </h2>
                <span className="main__count">{filteredRecords.length}</span>
                <div className="view-toggle">
                  <button
                    type="button"
                    className={`view-toggle__btn${view === "list" ? " view-toggle__btn--on" : ""}`}
                    onClick={() => setView("list")}
                  >
                    List
                  </button>
                  <button
                    type="button"
                    className={`view-toggle__btn${view === "timeline" ? " view-toggle__btn--on" : ""}`}
                    onClick={() => setView("timeline")}
                  >
                    Timeline
                  </button>
                </div>
              </div>
              {view === "list" ? (
                <RecordList
                  records={filteredRecords}
                  selectedId={selectedRecord?.id}
                  onSelect={setSelectedRecord}
                />
              ) : (
                <Timeline
                  records={filteredRecords.filter((r) =>
                    r.people.some(
                      (n) => n.toLowerCase().trim().replace(/\s+/g, " ") === timelineFocus.key
                    )
                  )}
                  selectedId={selectedRecord?.id}
                  focusName={timelineFocus.name}
                  onSelect={setSelectedRecord}
                />
              )}
            </main>
              {selectedRecord && (
                <RecordDetail
                  record={selectedRecord}
                  relatedRecords={relatedRecords}
                  onClose={() => setSelectedRecord(null)}
                  onSelectRecord={setSelectedRecord}
                  onSelectPerson={(key) => {
                    setSelectedPerson(key);
                    setSelectedRecord(null);
                  }}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
