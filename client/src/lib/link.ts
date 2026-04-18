import type { Record } from "../types";
import { canonicalForFuzzy, normalizeName, similarEnough } from "./names";

export interface Person {
  key: string;
  displayName: string;
  records: Record[];
  sources: Set<string>;
  aliases: string[];
}

interface RawEntry {
  key: string;
  displayName: string;
  records: Record[];
  sources: Set<string>;
}

function collectRaw(records: Record[]): Map<string, RawEntry> {
  const map = new Map<string, RawEntry>();
  for (const rec of records) {
    for (const name of rec.people) {
      const key = normalizeName(name);
      if (!key) continue;
      let entry = map.get(key);
      if (!entry) {
        entry = { key, displayName: name, records: [], sources: new Set() };
        map.set(key, entry);
      }
      if (!entry.records.find((r) => r.id === rec.id && r.source === rec.source)) {
        entry.records.push(rec);
      }
      entry.sources.add(rec.source);
    }
  }
  return map;
}

function toPerson(e: RawEntry): Person {
  return { ...e, aliases: [e.key] };
}

function mergeInto(cluster: Person, entry: RawEntry): void {
  for (const r of entry.records) {
    if (!cluster.records.find((x) => x.id === r.id && x.source === r.source)) {
      cluster.records.push(r);
    }
  }
  for (const s of entry.sources) cluster.sources.add(s);
  cluster.aliases.push(entry.key);
  if (entry.displayName.length > cluster.displayName.length) {
    cluster.displayName = entry.displayName;
  }
}

function clusterFuzzy(raw: Map<string, RawEntry>): Person[] {
  const entries = Array.from(raw.values()).sort((a, b) => b.records.length - a.records.length);
  const clusters: Person[] = [];
  for (const e of entries) {
    const target = clusters.find((c) =>
      c.aliases.some((a) => similarEnough(canonicalForFuzzy(a), canonicalForFuzzy(e.key)))
    );
    if (target) mergeInto(target, e);
    else clusters.push(toPerson(e));
  }
  return clusters;
}

function sortPeople(people: Person[]): Person[] {
  return people.sort((a, b) => {
    if (b.records.length !== a.records.length) return b.records.length - a.records.length;
    return a.displayName.localeCompare(b.displayName);
  });
}

export function groupByPerson(records: Record[], fuzzy = false): Person[] {
  const raw = collectRaw(records);
  const people = fuzzy ? clusterFuzzy(raw) : Array.from(raw.values()).map(toPerson);
  return sortPeople(people);
}

export function recordsForPerson(records: Record[], aliases: string[] | string): Record[] {
  const set = new Set(typeof aliases === "string" ? [aliases] : aliases);
  return records.filter((r) => r.people.some((n) => set.has(normalizeName(n))));
}
