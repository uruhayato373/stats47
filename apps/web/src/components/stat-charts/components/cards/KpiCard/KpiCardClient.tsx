"use client";

import React from "react";

import { cn } from "@stats47/components";
import { formatUnitForDisplay } from "@stats47/data-configs/unit";
import { formatValueWithPrecision, resolveValuePrecision } from "@stats47/utils";
import { TrendingDown, TrendingUp } from "lucide-react";

import { StatTile } from "@/components/surface";

import { parseTitle } from "../../../utils/parseTitle";

export interface KpiCardClientProps {
  title: string;
  value: number | string | null;
  unit: string | null;
  year: string | null;
  changeRate?: number | null;
  changeDirection?: "increase" | "decrease" | "neutral" | null;
  /** 同じ指標の値集合から解決した表示小数桁。未指定時は現在値から最大2桁まで保持する。 */
  precision?: number;
}

export const KpiCardClient: React.FC<KpiCardClientProps> = ({
  title,
  value,
  unit,
  year,
  changeRate,
  changeDirection,
  precision,
}) => {
  const formattedValue = value !== null && value !== undefined
    ? typeof value === "number"
      ? formatValueWithPrecision(value, precision ?? resolveValuePrecision([value]))
      : value
    : "---";

  const trendColor =
    changeDirection === "increase"
      ? "text-positive"
      : changeDirection === "decrease"
        ? "text-negative"
        : "text-muted-foreground";

  const TrendIcon =
    changeDirection === "increase"
      ? TrendingUp
      : changeDirection === "decrease"
        ? TrendingDown
        : null;

  const { main, sub } = parseTitle(title);

  // 数値タイル (StatTile) で描く: 名前 → 値 + 増減 → 年
  return (
    <StatTile
      label={
        <>
          {main}
          {sub && <span className="mt-0.5 block text-xs text-muted-foreground">{sub}</span>}
        </>
      }
      value={formattedValue}
      unit={unit ? formatUnitForDisplay(unit) : undefined}
      badge={
        changeRate !== null && changeRate !== undefined && changeDirection ? (
          <span className={cn("flex items-center gap-0.5 text-xs font-medium", trendColor)}>
            {TrendIcon && <TrendIcon className="size-3" aria-hidden="true" />}
            {changeRate > 0 ? "+" : ""}
            {changeRate}%
          </span>
        ) : undefined
      }
      meta={year ?? undefined}
    />
  );
};
