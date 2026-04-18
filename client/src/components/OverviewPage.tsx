import { useMemo } from "react";
import type { Record, Source } from "../types";
import { SOURCE_COLORS, SOURCE_LABELS } from "../types";
import {
  lastKnownLocation,
  lastSeenWith,
  podoDisappearanceTime,
  suspicionRanking,
  type Canonicalize,
} from "../lib/summary";
import { formatFull, formatShort, recordWhen } from "../lib/format";
import { SummaryPanel } from "./SummaryPanel";

interface Props {
  records: Record[];
  canonicalize: Canonicalize;
  selectedPerson: string | null;
  selectedPersonName: string | null;
  onSelectPerson: (key: string) => void;
  onSelectRecord: (record: Record) => void;
  onGoto: (view: "people" | "timeline" | "map" | "graph") => void;
}

const PODO_KEY = "podo";

function formatRelative(iso: string | undefined): string {
  if (!iso) return "—";
  const then = Date.parse(iso);
  if (isNaN(then)) return "—";
  const diffMs = Date.now() - then;
  const diffH = Math.round(diffMs / 3_600_000);
  if (Math.abs(diffH) < 1) return "just now";
  if (Math.abs(diffH) < 24) return `${diffH}h ago`;
  const diffD = Math.round(diffH / 24);
  return `${diffD}d ago`;
}

export function OverviewPage({
  records,
  canonicalize,
  selectedPerson,
  selectedPersonName,
  onSelectPerson,
  onSelectRecord,
  onGoto,
}: Props) {
  const podoLast = useMemo(() => lastKnownLocation(records, PODO_KEY, canonicalize), [records, canonicalize]);
  const podoDisappearance = useMemo(() => podoDisappearanceTime(records, canonicalize), [records, canonicalize]);
  const withPodo = useMemo(() => lastSeenWith(records, PODO_KEY, canonicalize, 5), [records, canonicalize]);

  const sourceCounts = useMemo(() => {
    const m = new Map<Source, number>();
    for (const r of records) m.set(r.source, (m.get(r.source) ?? 0) + 1);
    return m;
  }, [records]);

  const postDisappearanceCount = useMemo(() => {
    if (!podoDisappearance) return 0;
    return records.filter((r) => {
      const t = r.timestamp ?? r.createdAt;
      return t && t > podoDisappearance;
    }).length;
  }, [records, podoDisappearance]);

  const recent = useMemo(() => {
    return [...records]
      .sort((a, b) => recordWhen(b).localeCompare(recordWhen(a)))
      .slice(0, 5);
  }, [records]);

  const totalPeople = useMemo(() => {
    const s = new Set<string>();
    for (const r of records) for (const n of r.people) {
      const k = canonicalize(n);
      if (k) s.add(k);
    }
    return s.size;
  }, [records, canonicalize]);

  const suspects = useMemo(() => suspicionRanking(records, canonicalize), [records, canonicalize]);
  const topSuspectCount = suspects.length;

  return (
    <main className="main overview">
      <section className="case-brief">
        <div className="case-brief__top">
          <span className="case-brief__badge">CASE FILE</span>
          <h2 className="case-brief__title">Missing: Podo</h2>
        </div>
        <div className="case-brief__grid">
          <div>
            <div className="case-brief__label">Last confirmed sighting</div>
            <div className="case-brief__value">{podoDisappearance ? formatFull(podoDisappearance) : "—"}</div>
            <div className="case-brief__meta">{formatRelative(podoDisappearance)}</div>
          </div>
          <div>
            <div className="case-brief__label">Last known location</div>
            <div className="case-brief__value">{podoLast?.location ?? "Unknown"}</div>
            <div className="case-brief__meta">
              {podoLast?.coordinates
                ? `${podoLast.coordinates.lat.toFixed(4)}, ${podoLast.coordinates.lng.toFixed(4)}`
                : ""}
            </div>
          </div>
          <div>
            <div className="case-brief__label">Last seen with</div>
            <div className="case-brief__chips">
              {withPodo.length ? (
                withPodo.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    className="case-brief__chip"
                    onClick={() => onSelectPerson(p.key)}
                  >
                    {p.displayName}
                    <span className="case-brief__chip-count">×{p.count}</span>
                  </button>
                ))
              ) : (
                <span className="case-brief__meta">No co-occurrences</span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="stat-grid" aria-label="Case statistics">
        <button type="button" className="stat-card" onClick={() => onGoto("people")}>
          <span className="stat-card__num">{records.length}</span>
          <span className="stat-card__label">records</span>
        </button>
        <button type="button" className="stat-card" onClick={() => onGoto("people")}>
          <span className="stat-card__num">{totalPeople}</span>
          <span className="stat-card__label">people</span>
        </button>
        <button type="button" className="stat-card" onClick={() => onGoto("people")}>
          <span className="stat-card__num">{postDisappearanceCount}</span>
          <span className="stat-card__label">post-disappearance records</span>
        </button>
        <button type="button" className="stat-card" onClick={() => onGoto("graph")}>
          <span className="stat-card__num">{topSuspectCount}</span>
          <span className="stat-card__label">persons of interest</span>
        </button>
      </section>

      <section className="source-breakdown" aria-label="Source breakdown">
        <h3 className="overview__h3">Records by source</h3>
        <div className="source-breakdown__bars">
          {(Array.from(sourceCounts.entries()) as [Source, number][])
            .sort((a, b) => b[1] - a[1])
            .map(([src, n]) => {
              const max = Math.max(...Array.from(sourceCounts.values()));
              const pct = max ? (n / max) * 100 : 0;
              return (
                <div key={src} className="source-breakdown__row">
                  <span className="source-breakdown__label">{SOURCE_LABELS[src]}</span>
                  <div className="source-breakdown__bar-outer">
                    <div
                      className="source-breakdown__bar-inner"
                      style={{ width: `${pct}%`, background: SOURCE_COLORS[src] }}
                    />
                  </div>
                  <span className="source-breakdown__count">{n}</span>
                </div>
              );
            })}
        </div>
      </section>

      <div className="overview__two-col">
        <section className="overview__suspicion">
          <SummaryPanel
            records={records}
            selectedPersonKey={selectedPerson}
            selectedPersonName={selectedPersonName}
            canonicalize={canonicalize}
            onSelectPerson={onSelectPerson}
            onSelectRecord={onSelectRecord}
          />
        </section>

        <section className="recent" aria-label="Most recent records">
          <h3 className="overview__h3">Most recent</h3>
          <ul className="recent__list">
            {recent.map((r) => (
              <li key={`${r.source}-${r.id}`}>
                <button type="button" className="recent__item" onClick={() => onSelectRecord(r)}>
                  <span
                    className="recent__badge"
                    style={{ background: SOURCE_COLORS[r.source] }}
                  >
                    {SOURCE_LABELS[r.source]}
                  </span>
                  <span className="recent__when">{formatShort(r.timestamp ?? r.createdAt)}</span>
                  <span className="recent__who">{r.people.join(", ") || "—"}</span>
                  {r.location && <span className="recent__where">📍 {r.location}</span>}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
