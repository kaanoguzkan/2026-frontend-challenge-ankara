import type { Record } from "../types";

export interface Person {
  key: string;
  displayName: string;
  records: Record[];
  sources: Set<string>;
}

function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

export function groupByPerson(records: Record[]): Person[] {
  const map = new Map<string, Person>();
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
  return Array.from(map.values()).sort((a, b) => {
    if (b.records.length !== a.records.length) return b.records.length - a.records.length;
    return a.displayName.localeCompare(b.displayName);
  });
}

export function recordsForPerson(records: Record[], personKey: string): Record[] {
  return records.filter((r) => r.people.some((n) => normalizeName(n) === personKey));
}
