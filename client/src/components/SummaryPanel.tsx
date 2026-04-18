import { useState } from "react";
import type { Record } from "../types";
import { SOURCE_LABELS } from "../types";
import { lastSeenWith, lastKnownLocation, suspicionRanking, suspectEvidence } from "../lib/summary";
import type { Canonicalize } from "../lib/summary";
import { formatShort } from "../lib/format";

interface Props {
  records: Record[];
  selectedPersonKey: string | null;
  selectedPersonName: string | null;
  canonicalize: Canonicalize;
  onSelectPerson: (key: string) => void;
  onSelectRecord?: (record: Record) => void;
}

function EvidenceGroup({
  label,
  records,
  onSelectRecord,
}: {
  label: string;
  records: Record[];
  onSelectRecord?: (record: Record) => void;
}) {
  if (!records.length) return null;
  return (
    <div className="summary__evidence-group">
      <span className="summary__evidence-label">{label}</span>
      <ul className="summary__evidence-list">
        {records.map((r) => (
          <li key={`${r.source}-${r.id}`}>
            <button
              type="button"
              className="summary__evidence-row"
              onClick={() => onSelectRecord?.(r)}
              disabled={!onSelectRecord}
            >
              <span className="summary__evidence-source">{SOURCE_LABELS[r.source]}</span>
              <span className="summary__evidence-text">
                {r.text ?? r.location ?? r.people.join(", ")}
              </span>
              <span className="summary__evidence-when">
                {formatShort(r.timestamp ?? r.createdAt)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SummaryPanel({ records, selectedPersonKey, selectedPersonName, canonicalize, onSelectPerson, onSelectRecord }: Props) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  if (selectedPersonKey) {
    const cooc = lastSeenWith(records, selectedPersonKey, canonicalize);
    const lastLoc = lastKnownLocation(records, selectedPersonKey, canonicalize);
    if (!cooc.length && !lastLoc) return null;
    return (
      <aside className="summary">
        <h3 className="summary__title">{selectedPersonName ?? "Person"} — summary</h3>
        {lastLoc && (
          <div className="summary__block">
            <span className="summary__label">Last known whereabouts</span>
            <div className="summary__value">
              {lastLoc.location ?? "—"}
              <span className="summary__meta">
                {" · "}
                {formatShort(lastLoc.timestamp ?? lastLoc.createdAt)}
              </span>
            </div>
          </div>
        )}
        {cooc.length > 0 && (
          <div className="summary__block">
            <span className="summary__label">Last seen with</span>
            <div className="summary__chips">
              {cooc.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  className="summary__chip"
                  onClick={() => onSelectPerson(c.key)}
                >
                  {c.displayName}
                  <span className="summary__chip-count">×{c.count}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>
    );
  }

  const top = suspicionRanking(records, canonicalize);
  if (!top.length) return null;
  return (
    <aside className="summary">
      <h3 className="summary__title">Most suspicious</h3>
      <p className="summary__hint">
        Score: +2 per anonymous tip, +1 per high-urgency message, +1 if seen within 1km of Podo's last location.
      </p>
      <ol className="summary__rank">
        {top.map((s, i) => {
          const isOpen = expandedKey === s.key;
          const evidence = isOpen ? suspectEvidence(records, s.key, canonicalize) : null;
          return (
            <li key={s.key} className="summary__rank-item">
              <button
                type="button"
                className="summary__rank-btn"
                onClick={() => setExpandedKey(isOpen ? null : s.key)}
                aria-expanded={isOpen}
              >
                <span className="summary__rank-pos">{i + 1}</span>
                <span className="summary__rank-name">{s.displayName}</span>
                <span className="summary__rank-score">{s.score}</span>
                <span className="summary__rank-why">
                  {s.tipMentions ? `${s.tipMentions} tip${s.tipMentions > 1 ? "s" : ""}` : null}
                  {s.tipMentions && (s.urgentMessages || s.nearPodo) ? " · " : ""}
                  {s.urgentMessages ? `${s.urgentMessages} urgent msg${s.urgentMessages > 1 ? "s" : ""}` : null}
                  {s.urgentMessages && s.nearPodo ? " · " : ""}
                  {s.nearPodo ? "near Podo" : null}
                </span>
              </button>
              {isOpen && evidence && (
                <div className="summary__evidence">
                  <EvidenceGroup label="Tips" records={evidence.tips} onSelectRecord={onSelectRecord} />
                  <EvidenceGroup label="Urgent messages" records={evidence.urgentMessages} onSelectRecord={onSelectRecord} />
                  <EvidenceGroup label="Near Podo" records={evidence.nearPodo} onSelectRecord={onSelectRecord} />
                  <button
                    type="button"
                    className="summary__evidence-focus"
                    onClick={() => onSelectPerson(s.key)}
                  >
                    Focus on {s.displayName} →
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

