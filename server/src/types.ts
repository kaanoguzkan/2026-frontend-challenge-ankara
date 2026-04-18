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

export interface JotformAnswer {
  name?: string;
  text?: string;
  type?: string;
  answer?: unknown;
}

export interface JotformSubmission {
  id: string;
  form_id: string;
  created_at: string;
  answers: Record<string, JotformAnswer>;
}

export interface JotformResponse<T> {
  responseCode: number;
  message: string;
  content: T;
}

export interface FetchAllResult {
  records: NormalizedRecord[];
  errors: { source: Source; message: string }[];
  cachedAt: string;
}
