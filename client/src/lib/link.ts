import type { Record } from "../types";

export interface Person {
  key: string;
  displayName: string;
  records: Record[];
  sources: Set<string>;
  aliases: string[];
}

function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

const TR_FOLD: { [k: string]: string } = {
  ğ: "g", ş: "s", ı: "i", İ: "i", ö: "o", ü: "u", ç: "c",
};

function foldTurkish(s: string): string {
  return s.replace(/[ğşıİöüç]/g, (c) => TR_FOLD[c] ?? c);
}

function canonicalForFuzzy(name: string): string {
  return foldTurkish(normalizeName(name));
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev = new Array(b.length + 1);
  const curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

function similarEnough(a: string, b: string): boolean {
  if (a === b) return true;
  const fa = foldTurkish(a);
  const fb = foldTurkish(b);
  if (fa === fb) return true;
  const [shorter, longer] = fa.length <= fb.length ? [fa, fb] : [fb, fa];
  if (longer.startsWith(shorter + " ") || longer.startsWith(shorter + ".")) return true;
  if (shorter.length >= 4) {
    const dist = levenshtein(fa, fb);
    const max = Math.max(fa.length, fb.length);
    if (dist <= 1) return true;
    if (max >= 8 && dist <= 2) return true;
  }
  return false;
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

function rawToPerson(e: RawEntry): Person {
  return { ...e, aliases: [e.key] };
}

function mergeFuzzy(raw: Map<string, RawEntry>): Person[] {
  const entries = Array.from(raw.values()).sort((a, b) => b.records.length - a.records.length);
  const clusters: Person[] = [];
  for (const e of entries) {
    let joined = false;
    for (const c of clusters) {
      if (c.aliases.some((a) => similarEnough(canonicalForFuzzy(a), canonicalForFuzzy(e.key)))) {
        for (const r of e.records) {
          if (!c.records.find((x) => x.id === r.id && x.source === r.source)) c.records.push(r);
        }
        for (const s of e.sources) c.sources.add(s);
        c.aliases.push(e.key);
        if (e.displayName.length > c.displayName.length) c.displayName = e.displayName;
        joined = true;
        break;
      }
    }
    if (!joined) clusters.push({ ...rawToPerson(e) });
  }
  return clusters;
}

export function groupByPerson(records: Record[], fuzzy = false): Person[] {
  const raw = collectRaw(records);
  const people = fuzzy ? mergeFuzzy(raw) : Array.from(raw.values()).map(rawToPerson);
  return people.sort((a, b) => {
    if (b.records.length !== a.records.length) return b.records.length - a.records.length;
    return a.displayName.localeCompare(b.displayName);
  });
}

export function recordsForPerson(records: Record[], aliases: string[] | string): Record[] {
  const set = new Set(typeof aliases === "string" ? [aliases] : aliases);
  return records.filter((r) => r.people.some((n) => set.has(normalizeName(n))));
}

export { normalizeName, canonicalForFuzzy, similarEnough };
