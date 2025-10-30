"use client";

export function Line({ title }: { title: string }) {
  return (
    <div className="p-4 rounded border border-border bg-card">
      <div className="text-sm text-muted-foreground mb-2">{title}</div>
      <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
        Line Chart (placeholder)
      </div>
    </div>
  );
}
