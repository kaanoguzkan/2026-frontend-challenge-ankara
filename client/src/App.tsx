import { useState } from "react";
import { useRecords } from "./hooks/useRecords";
import { useInvestigation } from "./hooks/useInvestigation";
import { groupByPerson } from "./lib/link";
import { RecordList } from "./components/RecordList";
import { PeopleList } from "./components/PeopleList";
import { RecordDetail } from "./components/RecordDetail";
import { Timeline } from "./components/Timeline";
import { SummaryPanel } from "./components/SummaryPanel";
import { MapView } from "./components/MapView";
import { Controls } from "./components/Controls";
import { MainHeader } from "./components/MainHeader";
import type { View } from "./components/ViewToggle";
import type { Record, Source } from "./types";

const ALL_SOURCES: Source[] = [
  "checkins",
  "messages",
  "sightings",
  "personalNotes",
  "anonymousTips",
];

export function App() {
  const { data, loading, error } = useRecords();
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);
  const [search, setSearch] = useState("");
  const [enabledSources, setEnabledSources] = useState<Set<Source>>(new Set(ALL_SOURCES));
  const [view, setView] = useState<View>("list");
  const [fuzzy, setFuzzy] = useState(false);

  const investigation = useInvestigation({
    records: data?.records ?? null,
    fuzzy,
    selectedPerson,
    selectedRecord,
    search,
    enabledSources,
  });

  const {
    people,
    canonicalize,
    filteredRecords,
    relatedRecords,
    timelineFocus,
    selectedPersonName,
  } = investigation;

  const toggleSource = (s: Source) => {
    setEnabledSources((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const handleFuzzyChange = (next: boolean) => {
    if (selectedPerson && data) {
      const nextPeople = groupByPerson(data.records, next);
      const match = nextPeople.find((p) => p.aliases.includes(selectedPerson));
      setSelectedPerson(match ? match.key : null);
    }
    setFuzzy(next);
    setSelectedRecord(null);
  };

  const handleSelectPerson = (key: string | null) => {
    setSelectedPerson(key);
    setSelectedRecord(null);
  };

  const timelineRecords = filteredRecords.filter((r) =>
    r.people.some((n) => canonicalize(n) === timelineFocus.key)
  );

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
          <Controls
            search={search}
            onSearchChange={setSearch}
            enabledSources={enabledSources}
            onToggleSource={toggleSource}
            fuzzy={fuzzy}
            onFuzzyChange={handleFuzzyChange}
          />

          <div className="layout">
            <PeopleList
              people={people}
              selectedKey={selectedPerson}
              onSelect={handleSelectPerson}
            />
            <div className="workspace">
              <main className="main">
                <MainHeader
                  view={view}
                  onViewChange={setView}
                  count={filteredRecords.length}
                  selectedPersonName={selectedPersonName}
                  timelineFocusName={timelineFocus.name}
                />
                <SummaryPanel
                  records={data.records}
                  selectedPersonKey={selectedPerson}
                  selectedPersonName={selectedPersonName}
                  canonicalize={canonicalize}
                  onSelectPerson={(key) => handleSelectPerson(key)}
                />
                {view === "list" && (
                  <RecordList
                    records={filteredRecords}
                    selectedId={selectedRecord?.id}
                    onSelect={setSelectedRecord}
                  />
                )}
                {view === "timeline" && (
                  <Timeline
                    records={timelineRecords}
                    selectedId={selectedRecord?.id}
                    focusName={timelineFocus.name}
                    onSelect={setSelectedRecord}
                  />
                )}
                {view === "map" && (
                  <MapView
                    records={filteredRecords}
                    selectedId={selectedRecord?.id}
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
                  onSelectPerson={(key) => handleSelectPerson(key)}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
