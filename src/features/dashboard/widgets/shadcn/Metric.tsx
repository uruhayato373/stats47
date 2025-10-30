"use client";

export function Metric({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="p-4 rounded border border-border bg-card">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
