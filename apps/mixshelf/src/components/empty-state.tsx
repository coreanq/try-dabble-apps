export function EmptyState({
  title,
  body,
  body2,
}: {
  title: string;
  body: string;
  body2: string;
}) {
  return (
    <div className="ms-empty" id="empty-state">
      <h2>{title}</h2>
      <p>{body}</p>
      <p>{body2}</p>
    </div>
  );
}
