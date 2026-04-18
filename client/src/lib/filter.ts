import type { Record, Source } from "../types";
import { recordsForPerson } from "./link";
import { recordWhen } from "./format";

export interface FilterOptions {
  records: Record[];
  search: string;
  enabledSources: Set<Source>;
  personAliases: string[] | null;
  timeRange?: [number, number] | null;
}

export function sortByTimeDesc(records: Record[]): Record[] {
  return [...records].sort((a, b) => recordWhen(b).localeCompare(recordWhen(a)));
}

function matchesSearch(r: Record, query: string): boolean {
  const hay = [...r.people, r.location ?? "", r.text ?? "", r.urgency ?? "", r.confidence ?? ""]
    .join(" ")
    .toLowerCase();
  return hay.includes(query);
}

export function applyFilters({ records, search, enabledSources, personAliases, timeRange }: FilterOptions): Record[] {
  const q = search.toLowerCase().trim();
  let pool = personAliases ? recordsForPerson(records, personAliases) : records;
  pool = pool.filter((r) => enabledSources.has(r.source));
  if (q) pool = pool.filter((r) => matchesSearch(r, q));
  if (timeRange) {
    const [lo, hi] = timeRange;
    pool = pool.filter((r) => {
      const t = Date.parse(recordWhen(r));
      return !isNaN(t) && t >= lo && t <= hi;
    });
  }
  return sortByTimeDesc(pool);
}
