export type Source =
  | "checkins"
  | "messages"
  | "sightings"
  | "personalNotes"
  | "anonymousTips";

export interface SourceConfig {
  source: Source;
  formId: string;
  label: string;
}

export const SOURCES: SourceConfig[] = [
  { source: "checkins", formId: "261065067494966", label: "Checkins" },
  { source: "messages", formId: "261065765723966", label: "Messages" },
  { source: "sightings", formId: "261065244786967", label: "Sightings" },
  { source: "personalNotes", formId: "261065509008958", label: "Personal Notes" },
  { source: "anonymousTips", formId: "261065875889981", label: "Anonymous Tips" },
];

export interface NormalizedRecord {
  id: string;
  source: Source;
  createdAt: string;
  timestamp?: string;
  location?: string;
  coordinates?: { lat: number; lng: number };
  people: string[];
  primaryPerson?: string;
  text?: string;
  urgency?: string;
  confidence?: string;
  fields: Record<string, string>;
}

interface JotformAnswer {
  name?: string;
  text?: string;
  type?: string;
  answer?: unknown;
}

interface JotformSubmission {
  id: string;
  form_id: string;
  created_at: string;
  answers: Record<string, JotformAnswer>;
}

interface JotformResponse<T> {
  responseCode: number;
  message: string;
  content: T;
}

const BASE_URL = process.env.JOTFORM_BASE_URL ?? "https://api.jotform.com";

function parseKeys(raw: string): string[] {
  return raw.split(",").map((k) => k.trim()).filter(Boolean);
}

export async function fetchSubmissions(formId: string, apiKeys: string[]): Promise<JotformSubmission[]> {
  const url = `${BASE_URL}/form/${formId}/submissions?limit=1000`;
  let lastStatus = 0;
  for (const key of apiKeys) {
    const res = await fetch(url, { headers: { APIKEY: key } });
    if (res.ok) {
      const body = (await res.json()) as JotformResponse<JotformSubmission[]>;
      return body.content ?? [];
    }
    lastStatus = res.status;
    if (res.status !== 429 && res.status !== 401 && res.status !== 403) {
      throw new Error(`Jotform ${formId} responded ${res.status}`);
    }
  }
  throw new Error(`Jotform ${formId} responded ${lastStatus} on all keys`);
}

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

export function normalize(raw: JotformSubmission, source: Source): NormalizedRecord {
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

  let text: string | undefined;
  for (const key of TEXT_FIELDS) {
    if (fields[key]) {
      text = fields[key];
      break;
    }
  }

  return {
    id: raw.id,
    source,
    createdAt: raw.created_at,
    timestamp: parseTimestamp(fields.timestamp),
    location: fields.location,
    coordinates: parseCoords(fields.coordinates),
    people,
    primaryPerson,
    text,
    urgency: fields.urgency,
    confidence: fields.confidence,
    fields,
  };
}

export interface FetchAllResult {
  records: NormalizedRecord[];
  errors: { source: Source; message: string }[];
  cachedAt: string;
}

let cache: { result: FetchAllResult; at: number } | null = null;
const CACHE_MS = 60_000;

export async function fetchAllRecords(apiKeyEnv: string, force = false): Promise<FetchAllResult> {
  if (!force && cache && Date.now() - cache.at < CACHE_MS) {
    return cache.result;
  }
  const keys = parseKeys(apiKeyEnv);
  if (!keys.length) throw new Error("No Jotform API keys configured");
  const records: NormalizedRecord[] = [];
  const errors: { source: Source; message: string }[] = [];
  for (let i = 0; i < SOURCES.length; i++) {
    const { source, formId } = SOURCES[i];
    const rotated = [...keys.slice(i % keys.length), ...keys.slice(0, i % keys.length)];
    try {
      const subs = await fetchSubmissions(formId, rotated);
      for (const s of subs) records.push(normalize(s, source));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push({ source, message });
    }
  }
  const result: FetchAllResult = { records, errors, cachedAt: new Date().toISOString() };
  cache = { result, at: Date.now() };
  return result;
}
