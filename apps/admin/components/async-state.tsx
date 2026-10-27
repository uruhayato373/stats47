import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";

/** 読込中プレースホルダ。旧 UI の `.lead` (muted テキスト) 相当。 */
export function Loading({ label = "読込中...", className }: { label?: string; className?: string }) {
  return <p className={cn("text-sm text-muted-foreground", className)}>{label}</p>;
}

/** データ 0 件のプレースホルダ。 */
export function EmptyState({ message, className }: { message: string; className?: string }) {
  return <p className={cn("text-sm text-muted-foreground", className)}>{message}</p>;
}

/** エラー表示。旧 UI の `.err` (赤系テキスト) 相当。再試行ボタンは任意。 */
export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3 text-sm text-console-bad", className)}>
      <span>{message}</span>
      {onRetry ? (
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          再試行
        </Button>
      ) : null}
    </div>
  );
}
