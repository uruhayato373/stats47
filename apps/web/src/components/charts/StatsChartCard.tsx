"use client";

import { type ReactNode } from "react";

import { cn } from "@stats47/components";
import { Card, CardContent, CardHeader } from "@stats47/components/atoms/ui/card";

export interface StatsChartCardProps {
  label: string;
  value: string;
  chart: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function StatsChartCard({
  label,
  value,
  chart,
  footer,
  className,
}: StatsChartCardProps) {
  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="p-3 pb-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          <span className="text-xl font-bold text-foreground">{value}</span>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-1">
        {chart}
        {footer && (
          <div className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
            {footer}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ChartCard(props: StatsChartCardProps) {
  return <StatsChartCard {...props} />;
}
