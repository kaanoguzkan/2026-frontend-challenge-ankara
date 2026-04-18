import { useEffect, useState } from "react";
import { formatShort } from "../lib/format";

interface Props {
  min: number;
  max: number;
  value: [number, number];
  onChange: (next: [number, number]) => void;
  onReset: () => void;
}

export function TimeScrubber({ min, max, value, onChange, onReset }: Props) {
  const [draft, setDraft] = useState<[number, number]>(value);

  useEffect(() => {
    setDraft(value);
  }, [value[0], value[1]]);

  if (min >= max) return null;
  const [lo, hi] = draft;
  const narrowed = lo > min || hi < max;

  const commit = (next: [number, number]) => {
    setDraft(next);
    onChange(next);
  };

  return (
    <div className="scrubber">
      <div className="scrubber__row">
        <span className="scrubber__label">From</span>
        <input
          type="range"
          min={min}
          max={max}
          step={60_000}
          value={lo}
          onChange={(e) => {
            const v = Number(e.target.value);
            setDraft(([, h]) => [Math.min(v, h), h]);
          }}
          onMouseUp={(e) => {
            const v = Number((e.target as HTMLInputElement).value);
            commit([Math.min(v, hi), hi]);
          }}
          onTouchEnd={(e) => {
            const v = Number((e.target as HTMLInputElement).value);
            commit([Math.min(v, hi), hi]);
          }}
          onKeyUp={(e) => {
            const v = Number((e.target as HTMLInputElement).value);
            commit([Math.min(v, hi), hi]);
          }}
        />
        <span className="scrubber__value">{formatShort(new Date(lo).toISOString())}</span>
      </div>
      <div className="scrubber__row">
        <span className="scrubber__label">To</span>
        <input
          type="range"
          min={min}
          max={max}
          step={60_000}
          value={hi}
          onChange={(e) => {
            const v = Number(e.target.value);
            setDraft(([l]) => [l, Math.max(v, l)]);
          }}
          onMouseUp={(e) => {
            const v = Number((e.target as HTMLInputElement).value);
            commit([lo, Math.max(v, lo)]);
          }}
          onTouchEnd={(e) => {
            const v = Number((e.target as HTMLInputElement).value);
            commit([lo, Math.max(v, lo)]);
          }}
          onKeyUp={(e) => {
            const v = Number((e.target as HTMLInputElement).value);
            commit([lo, Math.max(v, lo)]);
          }}
        />
        <span className="scrubber__value">{formatShort(new Date(hi).toISOString())}</span>
      </div>
      {narrowed && (
        <button type="button" className="scrubber__reset" onClick={onReset}>
          Reset range
        </button>
      )}
    </div>
  );
}
