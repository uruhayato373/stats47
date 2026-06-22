import { cn } from "@stats47/components";

export interface ChartLegendItem {
  label: string;
  color: string;
}

interface ChartLegendProps {
  items: ChartLegendItem[];
  className?: string;
}

export function ChartLegend({ items, className }: ChartLegendProps) {
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground",
        className,
      )}
    >
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1">
          <span
            className="inline-block h-2 w-2"
            style={{ backgroundColor: item.color }}
            aria-hidden="true"
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}
