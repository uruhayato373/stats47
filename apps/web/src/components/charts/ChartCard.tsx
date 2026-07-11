"use client";

import { type ReactNode } from "react";

import { cn } from "@stats47/components";

import { SurfaceCard } from "@/components/surface";

export interface ChartCardProps {
  label: string;
  value: string;
  chart: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function ChartCard({
  label,
  value,
  chart,
  footer,
  className,
}: ChartCardProps) {
  return (
    <SurfaceCard className={cn("p-0", className)}>
      <div className="p-3 pb-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          <span className="text-xl font-bold text-foreground">{value}</span>
        </div>
      </div>
      <div className="p-3 pt-1">
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
