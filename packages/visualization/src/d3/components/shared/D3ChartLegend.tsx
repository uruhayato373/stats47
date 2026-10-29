import { cn } from "@stats47/components";

import { useChartLegendLead } from "./chart-legend-lead";

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
  const lead = useChartLegendLead();
  if (items.length === 0) return null;

  const legend = items.map((item) => (
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
  ));

  // 呼び出し側が説明 (地域・期間・単位) を渡したときは、左に説明・右に凡例の 1 行にする (chart-legend-lead.tsx)
  if (lead) {
    return (
      <div
        data-chart-legend-lead
        className={cn(
          "mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1",
          className,
        )}
      >
        <p className="min-w-0 text-xs text-muted-foreground">{lead}</p>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
          {legend}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mb-1 flex flex-wrap items-center justify-end gap-x-3 gap-y-1",
        className,
      )}
    >
      {legend}
    </div>
  );
}
