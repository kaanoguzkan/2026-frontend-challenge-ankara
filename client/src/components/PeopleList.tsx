import type { Person } from "../lib/link";

interface Props {
  people: Person[];
  selectedKey?: string | null;
  onSelect: (key: string | null) => void;
}

export function PeopleList({ people, selectedKey, onSelect }: Props) {
  return (
    <aside className="people">
      <div className="people__header">
        <h2>People</h2>
        <span className="people__count">{people.length}</span>
      </div>
      <button
        type="button"
        className={`people__item people__item--all${!selectedKey ? " people__item--selected" : ""}`}
        onClick={() => onSelect(null)}
      >
        All records
      </button>
      <div className="people__list">
        {people.map((p) => {
          const isPodo = p.key === "podo";
          const isSelected = selectedKey === p.key;
          return (
            <button
              type="button"
              key={p.key}
              className={`people__item${isSelected ? " people__item--selected" : ""}${isPodo ? " people__item--podo" : ""}`}
              onClick={() => onSelect(p.key)}
            >
              <span className="people__name">
                {p.displayName}
                {p.aliases.length > 1 && (
                  <span className="people__aliases" title={p.aliases.join(", ")}>
                    +{p.aliases.length - 1}
                  </span>
                )}
              </span>
              <span className="people__stats">
                {p.records.length} · {p.sources.size}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
