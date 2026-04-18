interface Props {
  title: string;
  count?: number;
  hint?: string;
}

export function MainHeader({ title, count, hint }: Props) {
  return (
    <div className="main__header">
      <h2>{title}</h2>
      {typeof count === "number" && <span className="main__count">{count}</span>}
      {hint && <span className="main__hint">{hint}</span>}
    </div>
  );
}
