export type Source =
  | "checkins"
  | "messages"
  | "sightings"
  | "personalNotes"
  | "anonymousTips";

export interface Record {
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
  fields: { [key: string]: string };
}

export interface RecordsResponse {
  records: Record[];
  errors: { source: Source; message: string }[];
  cachedAt: string;
}

export const SOURCE_LABELS: { [K in Source]: string } = {
  checkins: "Checkins",
  messages: "Messages",
  sightings: "Sightings",
  personalNotes: "Personal Notes",
  anonymousTips: "Anonymous Tips",
};

export const SOURCE_COLORS: { [K in Source]: string } = {
  checkins: "#4f9cff",
  messages: "#b26bff",
  sightings: "#ffb347",
  personalNotes: "#6bd4a8",
  anonymousTips: "#ff6b8b",
};
