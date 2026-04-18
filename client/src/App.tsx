import { useEffect, useMemo, useRef, useState } from "react";
import { useRecords } from "./hooks/useRecords";
import { useInvestigation } from "./hooks/useInvestigation";
import { useHashState } from "./hooks/useHashState";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useTheme } from "./hooks/useTheme";
import { groupByPerson } from "./lib/link";
import { podoDisappearanceTime, podoLastCoord, podoTrail, podoTrailSteps } from "./lib/summary";
import { RecordList } from "./components/RecordList";
import { PeopleList } from "./components/PeopleList";
import { RecordDetail } from "./components/RecordDetail";
import { Timeline } from "./components/Timeline";
import { SummaryPanel } from "./components/SummaryPanel";
import { MapView } from "./components/MapView";
import { Controls } from "./components/Controls";
import { MainHeader } from "./components/MainHeader";
import { TimeScrubber } from "./components/TimeScrubber";
import { CoOccurrenceGraph } from "./components/CoOccurrenceGraph";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LoadingSkeleton } from "./components/Skeleton";
import type { View } from "./components/ViewToggle";
import type { Record, Source } from "./types";

const ALL_SOURCES: Source[] = [
  "checkins",
  "messages",
  "sightings",
  "personalNotes",
  "anonymousTips",
];

function parseSources(raw: string | undefined): Set<Source> {
  if (!raw) return new Set(ALL_SOURCES);
  const picked = raw.split(",").filter((s): s is Source => ALL_SOURCES.includes(s as Source));
  return picked.length ? new Set(picked) : new Set(ALL_SOURCES);
}

function serializeSources(s: Set<Source>): string {
  return s.size === ALL_SOURCES.length ? "" : ALL_SOURCES.filter((x) => s.has(x)).join(",");
}

const VALID_VIEWS: View[] = ["list", "timeline", "map", "graph"];

export function App() {
  const { data, loading, error } = useRecords();
  const [hash, setHash] = useHashState();
  const [theme, setTheme] = useTheme();

  const [selectedPerson, setSelectedPerson] = useState<string | null>(hash.person || null);
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);
  const [search, setSearch] = useState(hash.q ?? "");
  const [enabledSources, setEnabledSources] = useState<Set<Source>>(() => parseSources(hash.sources));
  const [view, setView] = useState<View>(
    VALID_VIEWS.includes(hash.view as View) ? (hash.view as View) : "list"
  );
  const [fuzzy, setFuzzy] = useState(hash.fuzzy === "1");
  const [timeRange, setTimeRange] = useState<[number, number] | null>(() => {
    const from = Number(hash.from);
    const to = Number(hash.to);
    return Number.isFinite(from) && Number.isFinite(to) && from < to ? [from, to] : null;
  });

  useEffect(() => {
    setHash({
      view: view === "list" ? "" : view,
      person: selectedPerson ?? "",
      q: search,
      sources: serializeSources(enabledSources),
      fuzzy: fuzzy ? "1" : "",
      from: timeRange ? String(timeRange[0]) : "",
      to: timeRange ? String(timeRange[1]) : "",
      record: selectedRecord ? `${selectedRecord.source}-${selectedRecord.id}` : "",
    });
  }, [view, selectedPerson, search, enabledSources, fuzzy, timeRange, selectedRecord, setHash]);

  const initialRecordKey = useRef(hash.record || "");
  const appliedInitialRecord = useRef(false);
  useEffect(() => {
    if (!data || appliedInitialRecord.current) return;
    appliedInitialRecord.current = true;
    const key = initialRecordKey.current;
    if (!key) return;
    const match = data.records.find((r) => `${r.source}-${r.id}` === key);
    if (match) setSelectedRecord(match);
  }, [data]);

  const timeBounds = useMemo<[number, number] | null>(() => {
    if (!data) return null;
    let min = Infinity;
    let max = -Infinity;
    for (const r of data.records) {
      const t = Date.parse(r.timestamp ?? r.createdAt);
      if (isNaN(t)) continue;
      if (t < min) min = t;
      if (t > max) max = t;
    }
    return min < max ? [min, max] : null;
  }, [data]);

  const investigation = useInvestigation({
    records: data?.records ?? null,
    fuzzy,
    selectedPerson,
    selectedRecord,
    search,
    enabledSources,
    timeRange,
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

  const hasActiveFilters =
    !!search || enabledSources.size < ALL_SOURCES.length || !!selectedPerson;
  const clearFilters = () => {
    setSearch("");
    setEnabledSources(new Set(ALL_SOURCES));
    handleSelectPerson(null);
  };

  const searchRef = useRef<HTMLInputElement>(null);

  const timelineRecords = filteredRecords.filter((r) =>
    r.people.some((n) => canonicalize(n) === timelineFocus.key)
  );

  const navigableRecords = view === "timeline" ? timelineRecords : filteredRecords;

  useKeyboardShortcuts({
    records: navigableRecords,
    selectedRecord,
    onSelectRecord: setSelectedRecord,
    onClearPerson: () => handleSelectPerson(null),
    searchRef,
  });

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

      {loading && !data && <LoadingSkeleton />}
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
            searchRef={searchRef}
            theme={theme}
            onThemeChange={setTheme}
          />
          {timeBounds && (
            <TimeScrubber
              min={timeBounds[0]}
              max={timeBounds[1]}
              value={timeRange ?? timeBounds}
              onChange={setTimeRange}
              onReset={() => setTimeRange(null)}
            />
          )}

          <div className="layout">
            <PeopleList
              people={people}
              selectedKey={selectedPerson}
              onSelect={handleSelectPerson}
            />
            <div className="workspace">
              <ErrorBoundary>
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
                  onSelectRecord={setSelectedRecord}
                />
                {view === "list" && (
                  <RecordList
                    records={filteredRecords}
                    selectedId={selectedRecord?.id}
                    onSelect={setSelectedRecord}
                    hasActiveFilters={hasActiveFilters}
                    onClearFilters={clearFilters}
                    postDisappearanceSince={podoDisappearanceTime(data.records, canonicalize)}
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
                    podoCoord={podoLastCoord(data.records, canonicalize)}
                    podoTrail={podoTrail(filteredRecords, canonicalize)}
                    podoSteps={podoTrailSteps(filteredRecords, canonicalize)}
                  />
                )}
                {view === "graph" && (
                  <CoOccurrenceGraph
                    records={filteredRecords}
                    canonicalize={canonicalize}
                    displayName={(key: string) => people.find((p) => p.key === key)?.displayName ?? key}
                    selectedKey={selectedPerson}
                    onSelect={handleSelectPerson}
                  />
                )}
              </main>
              </ErrorBoundary>
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
