import type { ReactNode } from "react";

import { StatTile, cn } from "@stats47/components";

/**
 * 数値タイル。公開サイトと同じ StatTile (@stats47/components) で描き、管理画面で使う tone と trend だけを足す。
 * 値の色は状態の意味があるときだけ tone で付ける (状態色は @stats47/ui-theme/theme.css の positive / warning / negative / info)。
 */
export type StatTone = "neutral" | "good" | "warn" | "bad" | "info";

const TONE: Record<StatTone, string | undefined> = {
  neutral: undefined,
  good: "text-positive",
  warn: "text-warning",
  bad: "text-negative",
  info: "text-info",
};

/**
 * 前週比などの増減。direction は「増えた / 減った / 横ばい」。色は既定で増=良・減=悪で、
 * 減るほど良い量 (エラー件数など) は tone で逆にする。
 */
export type StatTrend = { label: ReactNode; direction: "up" | "down" | "flat"; tone?: "good" | "bad" | "neutral" };

const TREND_TONE = { good: "text-positive", bad: "text-negative", neutral: "text-muted-foreground" } as const;

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
    <StatTile
      label={label}
      value={TONE[tone] ? <span className={TONE[tone]}>{value}</span> : value}
      icon={icon}
      meta={
        trend || sub ? (
          <>
            {trend && trendTone ? <span className={cn("mr-1.5", TREND_TONE[trendTone])}>{trend.label}</span> : null}
            {sub}
          </>
        ) : undefined
      }
    />
  );
}
