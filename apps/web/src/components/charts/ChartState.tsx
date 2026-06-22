import { type ReactNode } from "react";

import { cn } from "@stats47/components";
import { Skeleton } from "@stats47/components/atoms/ui/skeleton";

import { SurfaceCard } from "@/components/surface";

interface ChartStateProps {
  height?: number;
  className?: string;
}

interface ChartMessageStateProps extends ChartStateProps {
  title?: ReactNode;
  message?: ReactNode;
}

export function ChartLoading({ height, className }: ChartStateProps) {
  return (
    <Skeleton
      className={cn("w-full rounded-none", height == null && "h-[200px]", className)}
      style={height == null ? undefined : { height }}
    />
  );
}

export function ChartEmptyState({
  message = "データがありません",
  height = 80,
  className,
}: ChartMessageStateProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center text-sm text-muted-foreground",
        className,
      )}
      style={{ height }}
    >
      {message}
    </div>
  );
}

export function ChartErrorState({
  title,
  message = "チャートを表示できません",
  height = 250,
  className,
}: ChartMessageStateProps) {
  return (
    <SurfaceCard className={cn("p-4", className)}>
      {title && <h3 className="mb-3 text-lg font-semibold">{title}</h3>}
      <div
        className="flex items-center justify-center bg-muted/10 text-sm text-destructive"
        style={{ height }}
      >
        {message}
      </div>
    </SurfaceCard>
  );
}

export function ChartLoadingCard({
  height = 250,
  className,
}: ChartStateProps) {
  return (
    <SurfaceCard className={cn("p-4", className)}>
      <div className="animate-pulse">
        <div className="mb-3 h-6 w-1/3 bg-muted" />
        <div className="bg-muted/30" style={{ height }} />
      </div>
    </SurfaceCard>
  );
}
