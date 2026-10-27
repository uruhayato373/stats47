"use client";

import { type ReactNode } from "react";

import { cn } from "@stats47/components";

import { SurfaceCard } from "@/components/surface";

interface ChartCardProps {
  label: string;
  value: string;
  chart: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * compact KPI カード。テンプレートの KPI カード (`py-0! gap-0!`) と同じく Card の py と gap を `!` で外し、
 * 内側の余白を自分で持つ (`.style-lyra .cn-card` の py-4・gap-4 は素の `p-0` より強く、上下が 16px ずつ空いていた)。
 */
export function ChartCard({
  label,
  value,
  chart,
  footer,
  className,
}: ChartCardProps) {
  return (
    <SurfaceCard className={cn("gap-0! p-0 py-0!", className)}>
      <div className="flex items-baseline justify-between gap-2 px-3 pt-3 pb-1">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className="text-xl font-bold text-foreground">{value}</span>
      </div>
      <div className="px-3 pt-1 pb-3">
        {chart}
        {footer && (
          <div className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
            {footer}
          </div>
        )}
      </div>
    </SurfaceCard>
  );
}
