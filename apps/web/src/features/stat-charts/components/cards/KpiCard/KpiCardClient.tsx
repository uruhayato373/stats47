"use client";

import React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@stats47/components";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@stats47/components/atoms/ui/card";
import { Badge } from "@stats47/components/atoms/ui/badge";
import { parseTitle } from "../../../utils/parseTitle";

export interface KpiCardClientProps {
  title: string;
  value: number | string | null;
  unit: string | null;
  year: string | null;
  changeRate?: number | null;
  changeDirection?: "increase" | "decrease" | "neutral" | null;
}

export const KpiCardClient: React.FC<KpiCardClientProps> = ({
  title,
  value,
  unit,
  year,
  changeRate,
  changeDirection,
}) => {
  const formattedValue = value !== null && value !== undefined
    ? typeof value === "number" ? value.toLocaleString() : value
    : "---";

  const trendColor =
    changeDirection === "increase"
      ? "text-emerald-600 dark:text-emerald-400"
      : changeDirection === "decrease"
        ? "text-rose-600 dark:text-rose-400"
        : "text-muted-foreground";

  const TrendIcon =
    changeDirection === "increase"
      ? TrendingUp
      : changeDirection === "decrease"
        ? TrendingDown
        : null;

  const { main, sub } = parseTitle(title);

  return (
    <Card className="@container/kpi">
      <CardHeader className="border-b-0 pb-0">
        <CardDescription className="min-w-0">
          {main}
          {sub && (
            <span className="block text-xs text-muted-foreground/70 mt-0.5">{sub}</span>
          )}
        </CardDescription>
        <div className="flex-1" />
        {year && (
          <Badge variant="outline" size="sm" className="shrink-0 whitespace-nowrap text-[9px] rounded-md">
            {year}
          </Badge>
        )}
      </CardHeader>
      <div className="px-4 pb-2">
        <CardTitle className="text-2xl @[200px]/kpi:text-3xl tabular-nums">
          {formattedValue}
          {unit && (
            <span className="text-sm font-normal text-muted-foreground ml-1">
              {unit}
            </span>
          )}
        </CardTitle>
      </div>
      <CardFooter className="px-4 pb-3 pt-0">
        {changeRate !== null && changeRate !== undefined && changeDirection ? (
          <div className={cn("flex items-center gap-1 text-sm", trendColor)}>
            {TrendIcon && <TrendIcon className="h-4 w-4" />}
            <span className="font-medium">{changeRate > 0 ? "+" : ""}{changeRate}%</span>
          </div>
        ) : (
          <div className="h-5" />
        )}
      </CardFooter>
    </Card>
  );
};
