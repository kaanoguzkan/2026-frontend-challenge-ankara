import type { Record } from "../types";
import { lastSeenWith, lastKnownLocation, suspicionRanking } from "../lib/summary";

interface Props {
  records: Record[];
  selectedPersonKey: string | null;
  selectedPersonName: string | null;
  onSelectPerson: (key: string) => void;
}

export function SummaryPanel({ records, selectedPersonKey, selectedPersonName, onSelectPerson }: Props) {
  if (selectedPersonKey) {
    const cooc = lastSeenWith(records, selectedPersonKey);
    const lastLoc = lastKnownLocation(records, selectedPersonKey);
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
                {formatWhen(lastLoc.timestamp ?? lastLoc.createdAt)}
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

  const top = suspicionRanking(records);
  if (!top.length) return null;
  return (
    <aside className="summary">
      <h3 className="summary__title">Most suspicious</h3>
      <p className="summary__hint">
        Score: +2 per anonymous tip, +1 per high-urgency message, +1 if seen within 1km of Podo's last location.
      </p>
      <ol className="summary__rank">
        {top.map((s, i) => (
          <li key={s.key} className="summary__rank-item">
            <button type="button" className="summary__rank-btn" onClick={() => onSelectPerson(s.key)}>
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
          </li>
        ))}
      </ol>
    </aside>
  );
}

function formatWhen(s: string): string {
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
