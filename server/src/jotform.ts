import type { FetchAllResult, JotformResponse, JotformSubmission, NormalizedRecord, Source, SourceConfig } from "./types.js";
import { normalize } from "./normalize.js";

export type { Source, SourceConfig, NormalizedRecord, FetchAllResult };

export const SOURCES: SourceConfig[] = [
  { source: "checkins", formId: "261065067494966", label: "Checkins" },
  { source: "messages", formId: "261065765723966", label: "Messages" },
  { source: "sightings", formId: "261065244786967", label: "Sightings" },
  { source: "personalNotes", formId: "261065509008958", label: "Personal Notes" },
  { source: "anonymousTips", formId: "261065875889981", label: "Anonymous Tips" },
];

const BASE_URL = process.env.JOTFORM_BASE_URL ?? "https://api.jotform.com";
const CACHE_MS = 60_000;
const ROTATABLE_STATUSES = new Set([401, 403, 429]);

function parseKeys(raw: string): string[] {
  return raw.split(",").map((k) => k.trim()).filter(Boolean);
}

function rotateKeys(keys: string[], offset: number): string[] {
  const pivot = offset % keys.length;
  return [...keys.slice(pivot), ...keys.slice(0, pivot)];
}

async function fetchSubmissions(formId: string, apiKeys: string[]): Promise<JotformSubmission[]> {
  const url = `${BASE_URL}/form/${formId}/submissions?limit=1000`;
  let lastStatus = 0;
  for (const key of apiKeys) {
    const res = await fetch(url, { headers: { APIKEY: key } });
    if (res.ok) {
      const body = (await res.json()) as JotformResponse<JotformSubmission[]>;
      return body.content ?? [];
    }
    lastStatus = res.status;
    if (!ROTATABLE_STATUSES.has(res.status)) {
      throw new Error(`Jotform ${formId} responded ${res.status}`);
    }
  }
  throw new Error(`Jotform ${formId} responded ${lastStatus} on all keys`);
}

let cache: { result: FetchAllResult; at: number } | null = null;

export async function fetchAllRecords(apiKeyEnv: string, force = false): Promise<FetchAllResult> {
  if (!force && cache && Date.now() - cache.at < CACHE_MS) {
    return cache.result;
  }
  const keys = parseKeys(apiKeyEnv);
  if (!keys.length) throw new Error("No Jotform API keys configured");

  const records: NormalizedRecord[] = [];
  const errors: FetchAllResult["errors"] = [];

  for (let i = 0; i < SOURCES.length; i++) {
    const { source, formId } = SOURCES[i];
    try {
      const subs = await fetchSubmissions(formId, rotateKeys(keys, i));
      for (const s of subs) records.push(normalize(s, source));
    } catch (err) {
      errors.push({ source, message: err instanceof Error ? err.message : String(err) });
    }
  }

  const result: FetchAllResult = { records, errors, cachedAt: new Date().toISOString() };
  cache = { result, at: Date.now() };
  return result;
}
