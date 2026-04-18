import type { Record } from "../types";
import { SOURCE_COLORS, SOURCE_LABELS } from "../types";
import { formatFull, formatShort } from "../lib/format";
import { normalizeName } from "../lib/names";

interface Props {
  record: Record;
  relatedRecords: Record[];
  onClose: () => void;
  onSelectRecord: (record: Record) => void;
  onSelectPerson: (personKey: string) => void;
}

export function RecordDetail({
  record,
  relatedRecords,
  onClose,
  onSelectRecord,
  onSelectPerson,
}: Props) {
  return (
    <div className="detail">
      <div className="detail__header">
        <span
          className="record-item__badge"
          style={{ background: SOURCE_COLORS[record.source] }}
        >
          {SOURCE_LABELS[record.source]}
        </span>
        <button type="button" className="detail__close" onClick={onClose}>
          ×
        </button>
      </div>

      {record.timestamp && (
        <div className="detail__row">
          <span className="detail__label">When</span>
          <span>{formatFull(record.timestamp)}</span>
        </div>
      )}
      {record.location && (
        <div className="detail__row">
          <span className="detail__label">Where</span>
          <span>
            {record.location}
            {record.coordinates && (
              <span className="detail__coords">
                {" "}
                · {record.coordinates.lat.toFixed(5)}, {record.coordinates.lng.toFixed(5)}
              </span>
            )}
          </span>
        </div>
      )}
      {record.people.length > 0 && (
        <div className="detail__row">
          <span className="detail__label">People</span>
          <span className="detail__people">
            {record.people.map((name) => (
              <button
                key={name}
                type="button"
                className="detail__person"
                onClick={() => onSelectPerson(normalizeName(name))}
              >
                {name}
              </button>
            ))}
          </span>
        </div>
      )}
      {record.urgency && (
        <div className="detail__row">
          <span className="detail__label">Urgency</span>
          <span>{record.urgency}</span>
        </div>
      )}
      {record.confidence && (
        <div className="detail__row">
          <span className="detail__label">Confidence</span>
          <span>{record.confidence}</span>
        </div>
      )}
      {record.text && (
        <div className="detail__text">{record.text}</div>
      )}

      <details className="detail__raw">
        <summary>Raw fields</summary>
        <dl>
          {Object.entries(record.fields).map(([k, v]) => (
            <div key={k} className="detail__raw-row">
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </details>

      {relatedRecords.length > 0 && (
        <div className="detail__related">
          <h3>Other records mentioning these people</h3>
          <div className="detail__related-list">
            {relatedRecords.map((r) => (
              <button
                key={`${r.source}-${r.id}`}
                type="button"
                className="detail__related-item"
                onClick={() => onSelectRecord(r)}
              >
                <span
                  className="record-item__badge"
                  style={{ background: SOURCE_COLORS[r.source] }}
                >
                  {SOURCE_LABELS[r.source]}
                </span>
                <span className="detail__related-when">
                  {formatShort(r.timestamp ?? r.createdAt)}
                </span>
                <span className="detail__related-where">{r.location ?? "—"}</span>
                {r.text && <span className="detail__related-text">{r.text}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

