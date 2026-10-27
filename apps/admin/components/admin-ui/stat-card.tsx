import type { ReactNode } from "react";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/cn";

/**
 * 数値タイル。見本 (shadcndashboard.dev の Total Orders 等・2026-10-27 実測) と同じ形:
 * 名前 (14px) + 右上の枠付きアイコン / 値 (24px semibold) / 増減 (緑・赤) と補足 (muted) の 1 行。
 * 値の色は状態の意味があるときだけ tone で付ける (console-good/warn/bad/info は light/dark で AA を実測済み)。
 */
export type StatTone = "neutral" | "good" | "warn" | "bad" | "info";

const TONE: Record<StatTone, string | undefined> = {
  neutral: undefined,
  good: "text-console-good",
  warn: "text-console-warn",
  bad: "text-console-bad",
  info: "text-console-info",
};

/**
 * 前週比などの増減。direction は「増えた / 減った / 横ばい」。色は既定で増=良・減=悪で、
 * 減るほど良い量 (エラー件数など) は tone で逆にする。
 */
export type StatTrend = { label: ReactNode; direction: "up" | "down" | "flat"; tone?: "good" | "bad" | "neutral" };

const TREND_TONE = { good: "text-console-good", bad: "text-console-bad", neutral: "text-muted-foreground" } as const;

export function StatCard({
  label,
  value,
  sub,
  tone = "neutral",
  trend,
  icon,
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  tone?: StatTone;
  trend?: StatTrend;
  /** lucide のアイコン要素 (例: <WalletIcon />)。右上の枠付きの箱に入る */
  icon?: ReactNode;
}) {
  const trendTone = trend ? (trend.tone ?? (trend.direction === "up" ? "good" : trend.direction === "down" ? "bad" : "neutral")) : null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-normal">{label}</CardTitle>
        {icon ? (
          <CardAction>
            <div className="rounded-md p-2.5 outline [&_svg]:size-4" aria-hidden="true">
              {icon}
            </div>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <p className={cn("text-2xl font-semibold tracking-tight tabular-nums", TONE[tone])}>{value}</p>
        {trend || sub ? (
          <p className="text-sm text-muted-foreground">
            {trend && trendTone ? <span className={cn("mr-1.5", TREND_TONE[trendTone])}>{trend.label}</span> : null}
            {sub}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
