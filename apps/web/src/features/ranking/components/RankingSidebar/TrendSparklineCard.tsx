"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@stats47/components/atoms/ui/card";
import { Skeleton } from "@stats47/components/atoms/ui/skeleton";
import { isOk } from "@stats47/types";
import { formatValueWithPrecision } from "@stats47/utils";
import { TrendingUp } from "lucide-react";

import type { AreaType } from "@/features/area";

import { fetchAllYearsRankingValuesAction } from "../../actions/fetch-all-years-ranking-values";

import type { RankingValue } from "@stats47/ranking";

interface TrendSparklineCardProps {
  rankingKey: string;
  areaType: AreaType;
  unit: string;
  decimalPlaces: number;
}

interface YearlyAverage {
  yearCode: string;
  yearName: string;
  average: number;
}

function computeYearlyAverages(values: RankingValue[]): YearlyAverage[] {
  const byYear = new Map<string, { yearName: string; sum: number; count: number }>();
  for (const v of values) {
    if (v.areaCode === "00000") continue;
    const entry = byYear.get(v.yearCode);
    if (entry) {
      entry.sum += v.value;
      entry.count++;
    } else {
      byYear.set(v.yearCode, { yearName: v.yearName, sum: v.value, count: 1 });
    }
  }
  return [...byYear.entries()]
    .map(([yearCode, { yearName, sum, count }]) => ({
      yearCode,
      yearName,
      average: sum / count,
    }))
    .sort((a, b) => a.yearCode.localeCompare(b.yearCode));
}

function Sparkline({ data, width, height }: { data: number[]; width: number; height: number }) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;
  const chartH = height - padding * 2;
  const chartW = width - padding * 2;

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * chartW;
    const y = padding + chartH - ((v - min) / range) * chartH;
    return `${x},${y}`;
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p}`).join(" ");

  // Fill area
  const firstX = padding;
  const lastX = padding + chartW;
  const fillD = `${pathD} L${lastX},${height - padding} L${firstX},${height - padding} Z`;

  return (
    <svg width={width} height={height} className="block" role="img" aria-label="全国平均の推移スパークライン">
      <path d={fillD} fill="hsl(var(--primary) / 0.1)" />
      <path
        d={pathD}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TrendSparklineCard({
  rankingKey,
  areaType,
  unit,
  decimalPlaces,
}: TrendSparklineCardProps) {
  const [yearlyAverages, setYearlyAverages] = useState<YearlyAverage[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await fetchAllYearsRankingValuesAction(rankingKey, areaType);
      if (cancelled) return;
      if (isOk(result) && result.data.length > 0) {
        setYearlyAverages(computeYearlyAverages(result.data));
      }
      setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [rankingKey, areaType]);

  const trend = useMemo(() => {
    if (!yearlyAverages || yearlyAverages.length < 2) return null;
    const first = yearlyAverages[0];
    const last = yearlyAverages[yearlyAverages.length - 1];
    const change = last.average - first.average;
    const pct = (change / first.average) * 100;
    return { first, last, change, pct };
  }, [yearlyAverages]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="py-3 px-4">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium text-muted-foreground">
            全国平均の推移
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <Skeleton className="h-[60px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!yearlyAverages || yearlyAverages.length < 2) return null;

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-sm font-medium text-muted-foreground">
          全国平均の推移
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <Sparkline
          data={yearlyAverages.map((y) => y.average)}
          width={232}
          height={60}
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>{yearlyAverages[0].yearName}</span>
          <span>{yearlyAverages[yearlyAverages.length - 1].yearName}</span>
        </div>
        {trend && (
          <div className="mt-2 text-xs text-muted-foreground">
            <span>
              {formatValueWithPrecision(trend.last.average, decimalPlaces)}
              {unit}
            </span>
            <span
              className={`ml-1 ${trend.change >= 0 ? "text-red-500" : "text-blue-500"}`}
            >
              ({trend.pct >= 0 ? "+" : ""}
              {trend.pct.toFixed(1)}%)
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
