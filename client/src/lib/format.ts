export function formatFull(s: string): string {
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleString();
}

export function formatShort(s: string): string {
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function recordWhen(r: { timestamp?: string; createdAt: string }): string {
  return r.timestamp ?? r.createdAt;
}

export function formatDay(s: string): string {
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function dayKey(s: string): string {
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
