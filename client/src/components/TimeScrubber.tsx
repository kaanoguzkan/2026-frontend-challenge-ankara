import { formatShort } from "../lib/format";

interface Props {
  min: number;
  max: number;
  value: [number, number];
  onChange: (next: [number, number]) => void;
  onReset: () => void;
}

export function TimeScrubber({ min, max, value, onChange, onReset }: Props) {
  if (min >= max) return null;
  const [lo, hi] = value;
  const narrowed = lo > min || hi < max;
  const setLo = (v: number) => onChange([Math.min(v, hi), hi]);
  const setHi = (v: number) => onChange([lo, Math.max(v, lo)]);
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
          onChange={(e) => setLo(Number(e.target.value))}
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
          onChange={(e) => setHi(Number(e.target.value))}
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
