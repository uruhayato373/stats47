import { cn } from "@stats47/components";
import { Skeleton } from "@stats47/components/atoms/ui/skeleton";

interface ChartStateProps {
  height?: number;
  className?: string;
}

interface ChartEmptyStateProps extends ChartStateProps {
  message?: string;
}

export function ChartLoading({ height, className }: ChartStateProps) {
  return (
    <Skeleton
      className={cn("w-full rounded-md", height == null && "h-[200px]", className)}
      style={height == null ? undefined : { height }}
    />
  );
}

export function ChartEmptyState({
  message = "データがありません",
  height = 80,
  className,
}: ChartEmptyStateProps) {
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
