import { useMemo } from "react";
import type { Record, Source } from "../types";
import { groupByPerson, type Person } from "../lib/link";
import { normalizeName } from "../lib/names";
import { applyFilters } from "../lib/filter";
import type { Canonicalize } from "../lib/summary";

export interface Investigation {
  people: Person[];
  canonicalize: Canonicalize;
  filteredRecords: Record[];
  relatedRecords: Record[];
  timelineFocus: { key: string; name: string };
  selectedPersonName: string | null;
  aliasesForKey: (key: string) => string[];
}

interface Args {
  records: Record[] | null;
  fuzzy: boolean;
  selectedPerson: string | null;
  selectedRecord: Record | null;
  search: string;
  enabledSources: Set<Source>;
  timeRange?: [number, number] | null;
}

const PODO_FALLBACK = { key: "podo", name: "Podo" };

export function useInvestigation({
  records,
  fuzzy,
  selectedPerson,
  selectedRecord,
  search,
  enabledSources,
  timeRange,
}: Args): Investigation {
  const people = useMemo(
    () => (records ? groupByPerson(records, fuzzy) : []),
    [records, fuzzy]
  );

  const aliasToKey = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of people) for (const a of p.aliases) m.set(a, p.key);
    return m;
  }, [people]);

  const canonicalize = useMemo<Canonicalize>(() => {
    return (name: string) => aliasToKey.get(normalizeName(name)) ?? normalizeName(name);
  }, [aliasToKey]);

  const aliasesByKey = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const p of people) m.set(p.key, p.aliases);
    return m;
  }, [people]);

  const aliasesForKey = useMemo(
    () => (key: string) => aliasesByKey.get(key) ?? [key],
    [aliasesByKey]
  );

  const filteredRecords = useMemo(() => {
    if (!records) return [];
    return applyFilters({
      records,
      search,
      enabledSources,
      personAliases: selectedPerson ? aliasesForKey(selectedPerson) : null,
      timeRange,
    });
  }, [records, search, enabledSources, selectedPerson, aliasesForKey, timeRange]);

  const relatedRecords = useMemo(() => {
    if (!records || !selectedRecord) return [];
    const keys = new Set(selectedRecord.people.map(canonicalize));
    return records.filter((r) => {
      if (r.id === selectedRecord.id && r.source === selectedRecord.source) return false;
      return r.people.some((n) => keys.has(canonicalize(n)));
    });
  }, [records, selectedRecord, canonicalize]);

  const timelineFocus = useMemo(() => {
    if (!records) return PODO_FALLBACK;
    if (selectedPerson) {
      const p = people.find((p) => p.key === selectedPerson);
      if (p) return { key: p.key, name: p.displayName };
    }
    const podo = people.find((p) => p.key === "podo");
    return podo ? { key: podo.key, name: podo.displayName } : PODO_FALLBACK;
  }, [records, selectedPerson, people]);

  const selectedPersonName = selectedPerson
    ? people.find((p) => p.key === selectedPerson)?.displayName ?? null
    : null;

  return {
    people,
    canonicalize,
    filteredRecords,
    relatedRecords,
    timelineFocus,
    selectedPersonName,
    aliasesForKey,
  };
}
