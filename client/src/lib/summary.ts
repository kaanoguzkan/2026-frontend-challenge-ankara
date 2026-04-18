import type { Record } from "../types";
import { normalizeName } from "./names";
import { recordWhen } from "./format";

export type Canonicalize = (name: string) => string;

const identityCanonicalize: Canonicalize = normalizeName;

export interface CoOccurrence {
  key: string;
  displayName: string;
  count: number;
}

export function lastSeenWith(
  records: Record[],
  personKey: string,
  canonicalize: Canonicalize = identityCanonicalize,
  limit = 3
): CoOccurrence[] {
  const tally = new Map<string, CoOccurrence>();
  for (const r of records) {
    if (r.source !== "sightings" && r.source !== "checkins") continue;
    if (!r.people.some((n) => canonicalize(n) === personKey)) continue;
    for (const n of r.people) {
      const k = canonicalize(n);
      if (!k || k === personKey) continue;
      const e = tally.get(k);
      if (e) e.count += 1;
      else tally.set(k, { key: k, displayName: n, count: 1 });
    }
  }
  return Array.from(tally.values()).sort((a, b) => b.count - a.count).slice(0, limit);
}

export function lastKnownLocation(
  records: Record[],
  personKey: string,
  canonicalize: Canonicalize = identityCanonicalize
): Record | undefined {
  return records
    .filter((r) => r.people.some((n) => canonicalize(n) === personKey))
    .filter((r) => r.location || r.coordinates)
    .sort((a, b) => recordWhen(b).localeCompare(recordWhen(a)))[0];
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
const PODO_KEY = "podo";

function makeEmptyEntry(key: string, displayName: string): SuspicionEntry {
  return { key, displayName, score: 0, tipMentions: 0, urgentMessages: 0, nearPodo: false };
}

export function podoLastCoord(
  records: Record[],
  canonicalize: Canonicalize = identityCanonicalize
): { lat: number; lng: number } | undefined {
  return findPodoCoord(records, canonicalize);
}

export function podoDisappearanceTime(
  records: Record[],
  canonicalize: Canonicalize = identityCanonicalize
): string | undefined {
  const times = records
    .filter((r) => r.timestamp && r.people.some((n) => canonicalize(n) === PODO_KEY))
    .map((r) => r.timestamp!);
  if (!times.length) return undefined;
  return times.sort().at(-1);
}

export function podoTrail(
  records: Record[],
  canonicalize: Canonicalize = identityCanonicalize
): Array<[number, number]> {
  return records
    .filter((r) => r.coordinates && r.people.some((n) => canonicalize(n) === PODO_KEY))
    .sort((a, b) => recordWhen(a).localeCompare(recordWhen(b)))
    .map((r) => [r.coordinates!.lat, r.coordinates!.lng] as [number, number]);
}

export function podoTrailSteps(
  records: Record[],
  canonicalize: Canonicalize = identityCanonicalize
): Map<string, number> {
  const ordered = records
    .filter((r) => r.coordinates && r.people.some((n) => canonicalize(n) === PODO_KEY))
    .sort((a, b) => recordWhen(a).localeCompare(recordWhen(b)));
  const out = new Map<string, number>();
  ordered.forEach((r, i) => out.set(`${r.source}-${r.id}`, i + 1));
  return out;
}

function findPodoCoord(records: Record[], canonicalize: Canonicalize): { lat: number; lng: number } | undefined {
  const latest = records
    .filter((r) => r.coordinates && r.people.some((n) => canonicalize(n) === PODO_KEY))
    .sort((a, b) => recordWhen(b).localeCompare(recordWhen(a)))[0];
  return latest?.coordinates;
}

function scoreMentions(records: Record[], canonicalize: Canonicalize): Map<string, SuspicionEntry> {
  const map = new Map<string, SuspicionEntry>();
  const upsert = (name: string): SuspicionEntry | null => {
    const key = canonicalize(name);
    if (!key || key === PODO_KEY) return null;
    let e = map.get(key);
    if (!e) {
      e = makeEmptyEntry(key, name);
      map.set(key, e);
    } else if (name.length > e.displayName.length) {
      e.displayName = name;
    }
    return e;
  };
  for (const r of records) {
    if (r.source === "anonymousTips") {
      for (const n of r.people) {
        const e = upsert(n);
        if (e) { e.tipMentions += 1; e.score += 2; }
      }
    } else if (r.source === "messages" && r.urgency && /high|urgent/i.test(r.urgency)) {
      for (const n of r.people) {
        const e = upsert(n);
        if (e) { e.urgentMessages += 1; e.score += 1; }
      }
    }
  }
  return map;
}

function flagNearPodo(
  records: Record[],
  canonicalize: Canonicalize,
  podoCoord: { lat: number; lng: number },
  map: Map<string, SuspicionEntry>
): void {
  const nearKeys = new Set<string>();
  for (const r of records) {
    if (!r.coordinates) continue;
    if (haversineKm(r.coordinates, podoCoord) > PROXIMITY_KM) continue;
    for (const n of r.people) {
      const k = canonicalize(n);
      if (k && k !== PODO_KEY) nearKeys.add(k);
    }
  }
  for (const k of nearKeys) {
    const e = map.get(k);
    if (e && !e.nearPodo) { e.nearPodo = true; e.score += 1; }
  }
}

export interface SuspectEvidence {
  tips: Record[];
  urgentMessages: Record[];
  nearPodo: Record[];
}

export function suspectEvidence(
  records: Record[],
  personKey: string,
  canonicalize: Canonicalize = identityCanonicalize
): SuspectEvidence {
  const tips: Record[] = [];
  const urgentMessages: Record[] = [];
  const nearPodoRecords: Record[] = [];
  const podoCoord = findPodoCoord(records, canonicalize);
  for (const r of records) {
    const mentionsPerson = r.people.some((n) => canonicalize(n) === personKey);
    if (!mentionsPerson) continue;
    if (r.source === "anonymousTips") tips.push(r);
    else if (r.source === "messages" && r.urgency && /high|urgent/i.test(r.urgency)) urgentMessages.push(r);
    if (podoCoord && r.coordinates && haversineKm(r.coordinates, podoCoord) <= PROXIMITY_KM) {
      nearPodoRecords.push(r);
    }
  }
  return { tips, urgentMessages, nearPodo: nearPodoRecords };
}

export function suspicionRanking(
  records: Record[],
  canonicalize: Canonicalize = identityCanonicalize,
  limit = 5
): SuspicionEntry[] {
  const map = scoreMentions(records, canonicalize);
  const podoCoord = findPodoCoord(records, canonicalize);
  if (podoCoord) flagNearPodo(records, canonicalize, podoCoord, map);
  return Array.from(map.values())
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
