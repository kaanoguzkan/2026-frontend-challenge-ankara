export function LoadingSkeleton() {
  return (
    <div className="skeleton-layout">
      <aside className="skeleton-people">
        <div className="skeleton-line skeleton-line--title" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton-line skeleton-line--row" />
        ))}
      </aside>
      <div className="skeleton-main">
        <div className="skeleton-line skeleton-line--controls" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-line skeleton-line--badge" />
            <div className="skeleton-line skeleton-line--text" />
            <div className="skeleton-line skeleton-line--text skeleton-line--short" />
          </div>
        ))}
      </div>
    </div>
  );
}
