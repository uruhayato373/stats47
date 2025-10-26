export function AdminLoadingSkeleton() {
  return (
    <div className="bg-card rounded-lg shadow p-6">
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded" />
        ))}
      </div>
    </div>
  );
}
