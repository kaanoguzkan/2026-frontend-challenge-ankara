export type View = "list" | "timeline" | "map";

const VIEWS: { id: View; label: string }[] = [
  { id: "list", label: "List" },
  { id: "timeline", label: "Timeline" },
  { id: "map", label: "Map" },
];

interface Props {
  view: View;
  onChange: (view: View) => void;
}

export function ViewToggle({ view, onChange }: Props) {
  return (
    <div className="view-toggle">
      {VIEWS.map((v) => (
        <button
          key={v.id}
          type="button"
          className={`view-toggle__btn${view === v.id ? " view-toggle__btn--on" : ""}`}
          onClick={() => onChange(v.id)}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}
