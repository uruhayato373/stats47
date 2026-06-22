import { cn } from "@stats47/components";

export type D3ChartLegendMarker = "square" | "line";

export interface D3ChartLegendItem {
  key: string;
  label: string;
  color: string;
  marker?: D3ChartLegendMarker;
  opacity?: number;
}

interface D3ChartLegendProps {
  items: D3ChartLegendItem[];
  className?: string;
}

export function D3ChartLegend({ items, className }: D3ChartLegendProps) {
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "mb-1 flex flex-wrap items-center justify-end gap-x-3 gap-y-1",
        className,
      )}
    >
      {items.map((item) => (
        <div
          key={item.key}
          className="flex items-center gap-1 text-[10px] text-muted-foreground"
        >
          <span
            className={
              item.marker === "line"
                ? "inline-block h-[3px] w-4 rounded-full"
                : "inline-block h-3 w-3 rounded-sm"
            }
            style={{ backgroundColor: item.color, opacity: item.opacity }}
            aria-hidden="true"
          />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
