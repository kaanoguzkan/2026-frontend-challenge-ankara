import type { Record } from "../types";

function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

function recordWhen(r: Record): string {
  return r.timestamp ?? r.createdAt;
}

export interface CoOccurrence {
  key: string;
  displayName: string;
  count: number;
}

export function lastSeenWith(records: Record[], personKey: string, limit = 3): CoOccurrence[] {
  const tally = new Map<string, CoOccurrence>();
  for (const r of records) {
    if (r.source !== "sightings" && r.source !== "checkins") continue;
    if (!r.people.some((n) => normalizeName(n) === personKey)) continue;
    for (const n of r.people) {
      const k = normalizeName(n);
      if (!k || k === personKey) continue;
      const e = tally.get(k);
      if (e) e.count += 1;
      else tally.set(k, { key: k, displayName: n, count: 1 });
    }
  }
  return Array.from(tally.values()).sort((a, b) => b.count - a.count).slice(0, limit);
}

export function lastKnownLocation(records: Record[], personKey: string): Record | undefined {
  const mine = records
    .filter((r) => r.people.some((n) => normalizeName(n) === personKey))
    .filter((r) => r.location || r.coordinates)
    .sort((a, b) => recordWhen(b).localeCompare(recordWhen(a)));
  return mine[0];
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export interface SuspicionEntry {
  key: string;
  displayName: string;
  score: number;
  tipMentions: number;
  urgentMessages: number;
  nearPodo: boolean;
}

const PROXIMITY_KM = 1;

export function suspicionRanking(records: Record[], limit = 5): SuspicionEntry[] {
  const podoLast = records
    .filter((r) => r.coordinates && r.people.some((n) => normalizeName(n) === "podo"))
    .sort((a, b) => recordWhen(b).localeCompare(recordWhen(a)))[0];
  const podoCoord = podoLast?.coordinates;

  const map = new Map<string, SuspicionEntry>();
  const ensure = (name: string): SuspicionEntry | null => {
    const key = normalizeName(name);
    if (!key || key === "podo") return null;
    let e = map.get(key);
    if (!e) {
      e = { key, displayName: name, score: 0, tipMentions: 0, urgentMessages: 0, nearPodo: false };
      map.set(key, e);
    }
    return e;
  };

  for (const r of records) {
    if (r.source === "anonymousTips") {
      for (const n of r.people) {
        const e = ensure(n);
        if (e) { e.tipMentions += 1; e.score += 2; }
      }
    } else if (r.source === "messages" && r.urgency && /high|urgent/i.test(r.urgency)) {
      for (const n of r.people) {
        const e = ensure(n);
        if (e) { e.urgentMessages += 1; e.score += 1; }
      }
    }
  }

  if (podoCoord) {
    const nearKeys = new Set<string>();
    for (const r of records) {
      if (!r.coordinates) continue;
      if (haversineKm(r.coordinates, podoCoord) > PROXIMITY_KM) continue;
      for (const n of r.people) {
        const k = normalizeName(n);
        if (k && k !== "podo") nearKeys.add(k);
      }
    }
    for (const k of nearKeys) {
      const e = map.get(k);
      if (e && !e.nearPodo) { e.nearPodo = true; e.score += 1; }
    }
  }

  return Array.from(map.values())
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
