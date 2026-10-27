import type { ReactNode } from "react";
import { MinusIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/cn";

/**
 * 数値タイル。公式 dashboard-01 の Section Cards と同じ形 (CardDescription = 名前・CardTitle = 値・
 * CardAction = 前週比などの Badge・CardFooter = 補足)。色は状態の意味があるときだけ tone で付ける
 * (console-good/warn/bad/info は light/dark でコントラスト AA を実測済み)。
 */
export type StatTone = "neutral" | "good" | "warn" | "bad" | "info";

const TONE: Record<StatTone, string | undefined> = {
  neutral: undefined,
  good: "text-console-good",
  warn: "text-console-warn",
  bad: "text-console-bad",
  info: "text-console-info",
};

/** 前週比などの増減。direction は値の符号ではなく「増えた / 減った / 横ばい」 */
export type StatTrend = { label: ReactNode; direction: "up" | "down" | "flat" };

const TREND_ICON = { up: TrendingUpIcon, down: TrendingDownIcon, flat: MinusIcon } as const;

export function StatCard({
  label,
  value,
  sub,
  tone = "neutral",
  trend,
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  tone?: StatTone;
  trend?: StatTrend;
}) {
  const Icon = trend ? TREND_ICON[trend.direction] : null;
  return (
    <Card className="@container/card bg-linear-to-t from-primary/5 to-card shadow-xs dark:bg-card">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className={cn("text-2xl font-semibold tabular-nums @[250px]/card:text-3xl", TONE[tone])}>{value}</CardTitle>
        {trend && Icon ? (
          <CardAction>
            <Badge variant="outline">
              <Icon />
              {trend.label}
            </Badge>
          </CardAction>
        ) : null}
      </CardHeader>
      {sub ? <CardFooter className="flex-col items-start gap-1.5 text-sm text-muted-foreground">{sub}</CardFooter> : null}
    </Card>
  );
}
