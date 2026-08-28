"use client";

import React from "react";

import { cn } from "@stats47/components";
import { Badge } from "@stats47/components/atoms/ui/badge";
import { formatValueWithPrecision, resolveValuePrecision } from "@stats47/utils";
import { TrendingDown, TrendingUp } from "lucide-react";

import { SurfaceCard } from "@/components/surface";

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
      ? "text-emerald-600 dark:text-emerald-400"
      : changeDirection === "decrease"
        ? "text-red-600 dark:text-red-400"
        : "text-muted-foreground";

  const TrendIcon =
    changeDirection === "increase"
      ? TrendingUp
      : changeDirection === "decrease"
        ? TrendingDown
        : null;

  const { main, sub } = parseTitle(title);

  return (
    <SurfaceCard className="@container/kpi p-0">
      <div className="px-4 pb-0 pt-4">
        <p className="min-w-0 text-sm text-muted-foreground">
          {main}
          {sub && (
            <span className="block text-xs text-muted-foreground/70 mt-0.5">{sub}</span>
          )}
        </p>
      </div>
      <div className="px-4 pb-1.5">
        <div className="text-lg font-semibold @[200px]/kpi:text-xl tabular-nums">
          {formattedValue}
          {unit && (
            <span className="text-sm font-normal text-muted-foreground ml-1">
              {unit}
            </span>
          )}
        </div>
      </div>
      <div className="px-4 pb-3 pt-0">
        <div className="flex items-center gap-2">
          {year && (
            <Badge variant="outline" size="sm" className="shrink-0 whitespace-nowrap text-[9px] rounded-md">
              {year}
            </Badge>
          )}
          {changeRate !== null && changeRate !== undefined && changeDirection ? (
            <div className={cn("flex items-center gap-0.5 text-xs", trendColor)}>
              {TrendIcon && <TrendIcon className="h-3 w-3" />}
              <span className="font-medium">{changeRate > 0 ? "+" : ""}{changeRate}%</span>
            </div>
          ) : null}
        </div>
      </div>
    </SurfaceCard>
  );
};
