import { cn } from "@stats47/components";

interface MapFallbackProps {
  message?: string;
  className?: string;
}

export function MapFallback({
  message = "地図を読み込めませんでした",
  className,
}: MapFallbackProps) {
  return (
    <div
      className={cn(
        "flex min-h-[200px] items-center justify-center rounded-md bg-muted/50 text-sm text-muted-foreground",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
