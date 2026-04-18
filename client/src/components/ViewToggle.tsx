export type View = "overview" | "people" | "timeline" | "map" | "graph";

const VIEWS: { id: View; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "people", label: "People" },
  { id: "timeline", label: "Timeline" },
  { id: "map", label: "Map" },
  { id: "graph", label: "Graph" },
];

interface Props {
  view: View;
  onChange: (view: View) => void;
}

export function TopNav({ view, onChange }: Props) {
  return (
    <nav className="top-nav" aria-label="Primary">
      {VIEWS.map((v) => (
        <button
          key={v.id}
          type="button"
          className={`top-nav__btn${view === v.id ? " top-nav__btn--on" : ""}`}
          onClick={() => onChange(v.id)}
          aria-current={view === v.id ? "page" : undefined}
        >
          {v.label}
        </button>
      ))}
    </nav>
  );
}

// Kept for backward-compat import paths.
export { TopNav as ViewToggle };
