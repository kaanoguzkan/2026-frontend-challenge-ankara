import type { JotformSubmission, NormalizedRecord, Source } from "./types.js";

const PERSON_FIELDS = [
  "personName",
  "authorName",
  "senderName",
  "recipientName",
  "seenWith",
  "suspectName",
  "mentionedPeople",
];

const TEXT_FIELDS = ["note", "text", "tip"];

function parseTimestamp(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const m = raw.match(/^(\d{2})-(\d{2})-(\d{4})\s+(\d{1,2}):(\d{2})$/);
  if (!m) return raw;
  const [, dd, mm, yyyy, hh, min] = m;
  return `${yyyy}-${mm}-${dd}T${hh.padStart(2, "0")}:${min}:00`;
}

function parseCoords(raw: string | undefined): { lat: number; lng: number } | undefined {
  if (!raw) return undefined;
  const [latStr, lngStr] = raw.split(",").map((s) => s.trim());
  const lat = Number(latStr);
  const lng = Number(lngStr);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return undefined;
  return { lat, lng };
}

function extractFields(raw: JotformSubmission): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const ans of Object.values(raw.answers ?? {})) {
    if (!ans || !ans.name) continue;
    if (ans.type === "control_head" || ans.type === "control_button") continue;
    const val = ans.answer;
    if (val == null) continue;
    const str = typeof val === "string" ? val : typeof val === "number" ? String(val) : "";
    if (!str.trim()) continue;
    fields[ans.name] = str;
  }
  return fields;
}

function extractPeople(fields: Record<string, string>): { people: string[]; primaryPerson?: string } {
  const people: string[] = [];
  let primaryPerson: string | undefined;
  for (const key of PERSON_FIELDS) {
    const v = fields[key];
    if (!v) continue;
    for (const name of v.split(/[,;]/).map((s) => s.trim()).filter(Boolean)) {
      if (!people.includes(name)) people.push(name);
    }
    if (!primaryPerson) primaryPerson = v.split(/[,;]/)[0].trim();
  }
  return { people, primaryPerson };
}

function extractText(fields: Record<string, string>): string | undefined {
  for (const key of TEXT_FIELDS) {
    if (fields[key]) return fields[key];
  }
  return undefined;
}

export function normalize(raw: JotformSubmission, source: Source): NormalizedRecord {
  const fields = extractFields(raw);
  const { people, primaryPerson } = extractPeople(fields);
  return {
    id: raw.id,
    source,
    createdAt: raw.created_at,
    timestamp: parseTimestamp(fields.timestamp),
    location: fields.location,
    coordinates: parseCoords(fields.coordinates),
    people,
    primaryPerson,
    text: extractText(fields),
    urgency: fields.urgency,
    confidence: fields.confidence,
    fields,
  };
}
