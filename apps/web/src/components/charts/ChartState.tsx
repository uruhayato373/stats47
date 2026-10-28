import { type ReactNode } from "react";

import { cn } from "@stats47/components";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@stats47/components/atoms/ui/card";
import { Empty, EmptyDescription } from "@stats47/components/atoms/ui/empty";
import { Skeleton } from "@stats47/components/atoms/ui/skeleton";

/**
 * チャートの状態表示 (読み込み中・空・エラー) の唯一の置き場。
 * テンプレートの Skeleton / Empty / Card をそのまま組み立てる。別名のラッパーを feature 側に作らない。
 */

interface ChartStateProps {
  /** 数値なら高さを固定する。null なら高さを持たず、className (aspect 等) に任せる。 */
  height?: number | null;
  className?: string;
}

interface ChartMessageStateProps extends ChartStateProps {
  title?: ReactNode;
  message?: ReactNode;
  /** 親の ChartPanel 内で使う場合は false にして外枠を重ねない。 */
  bordered?: boolean;
}

/**
 * 空・エラーの枠。見本の Empty と同じ余白 24px・間隔 16px に、破線の枠 (1px) を足す
 * (docs/01_技術設計/04_デザインシステム.md「見本の実測値と部品の仕様」の「空の状態」)。
 * 呼び出し側で地の色・線・余白を足さない (design-system:check の empty-state-no-look-override)。
 */
const EMPTY_FRAME_CLASS = "gap-4 border border-dashed border-border p-6";

function heightStyle(height: number | null | undefined) {
  return height == null ? undefined : { height };
}

export function ChartLoading({ height, className }: ChartStateProps) {
  return (
    <Skeleton
      className={cn("w-full", height == null && "h-[200px]", className)}
      style={heightStyle(height)}
    />
  );
}

export function ChartEmptyState({
  message = "データがありません",
  height = 80,
  className,
}: ChartMessageStateProps) {
  return (
    <Empty
      role="status"
      aria-live="polite"
      className={cn(EMPTY_FRAME_CLASS, "text-sm text-muted-foreground", className)}
      style={heightStyle(height)}
    >
      {message}
    </Empty>
  );
}

export function ChartErrorState({
  title,
  message = "チャートを表示できません",
  height = 250,
  className,
  bordered = true,
}: ChartMessageStateProps) {
  const body = (
    <Empty
      className={EMPTY_FRAME_CLASS}
      style={heightStyle(height)}
    >
      <EmptyDescription className="text-destructive">{message}</EmptyDescription>
    </Empty>
  );

  if (!bordered) {
    return (
      <div className={className}>
        {title && <h3 className="mb-3 text-sm font-medium text-foreground">{title}</h3>}
        {body}
      </div>
    );
  }
  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle>
            <h3>{title}</h3>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>{body}</CardContent>
    </Card>
  );
}

interface ChartLoadingCardProps extends ChartStateProps {
  /** chart = 見出し + 図の仮表示 / kpi = 指標名 + 値 + 増減の仮表示 */
  variant?: "chart" | "kpi";
}

export function ChartLoadingCard({
  height = 250,
  className,
  variant = "chart",
}: ChartLoadingCardProps) {
  if (variant === "kpi") {
    return (
      <Card className={className} aria-busy="true">
        <CardHeader>
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-5 w-1/4" />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className={className} aria-busy="true">
      <CardHeader>
        <Skeleton className="h-6 w-1/3" />
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full" style={heightStyle(height)} />
      </CardContent>
    </Card>
  );
}
