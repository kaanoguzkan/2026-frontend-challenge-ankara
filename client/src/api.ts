import type { RecordsResponse } from "./types";

export async function fetchRecords(): Promise<RecordsResponse> {
  const res = await fetch("/api/records");
  if (!res.ok) throw new Error(`API responded ${res.status}`);
  return (await res.json()) as RecordsResponse;
}
