interface Props {
  title: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, hint, actionLabel, onAction }: Props) {
  return (
    <div className="empty-state">
      <div className="empty-state__title">{title}</div>
      {hint && <div className="empty-state__hint">{hint}</div>}
      {actionLabel && onAction && (
        <button type="button" className="empty-state__action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
