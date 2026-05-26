"use client";

import { useMemo } from "react";

import Link from "next/link";

import { lookupArea } from "@stats47/area";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@stats47/components/atoms/ui/card";
import { ArrowRight, BarChart3, MapPin } from "lucide-react";

import type { ThemeConfig, ThemeIndicatorData } from "../types";

interface Props {
  themeConfig: ThemeConfig;
  indicatorDataMap: Record<string, ThemeIndicatorData>;
  selectedPrefectureCode: string | null;
}

interface KpiTileData {
  metricKey: string;
  title: string;
  unit: string;
  value: number | null;
  rank: number | null;
  total: number;
  nationalAverage: number | null;
  diffFromAvgPct: number | null;
}

/**
 * テーマ × 選択都道府県 の主要 KPI サマリ
 *
 * 県選択時に、テーマ内の主要指標 (最大 3 件) について
 * 「値 / 全国順位 / 全国平均比」をカードで一覧表示。
 *
 * 県未選択時は何も描画しない (combination analysis 側で全国比較を見せる)。
 *
 * /areas-style の「1 県深掘り」要素をテーマページに統合するための主役コンポーネント。
 */
export function ThemePrefectureSummary({
  themeConfig,
  indicatorDataMap,
  selectedPrefectureCode,
}: Props) {
  const tiles = useMemo<KpiTileData[]>(() => {
    if (!selectedPrefectureCode) return [];

    const keysWithData = themeConfig.rankingKeys.filter(
      (k) => indicatorDataMap[k] && indicatorDataMap[k].rankingValues.length >= 10,
    );
    // 主要指標として先頭 3 件を採用 (将来 D1 theme_metrics.role='primary' で絞り込み可)
    const primaryKeys = keysWithData.slice(0, 3);

    return primaryKeys.map((key) => {
      const d = indicatorDataMap[key];
      const target = d.rankingValues.find((v) => v.areaCode === selectedPrefectureCode);
      const values = d.rankingValues
        .map((v) => v.value)
        .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
      const total = d.rankingValues.length;
      const nationalAverage =
        values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
      const value = typeof target?.value === "number" ? target.value : null;
      const rank = target?.rank ?? null;
      const diffFromAvgPct =
        value !== null && nationalAverage !== null && nationalAverage !== 0
          ? ((value - nationalAverage) / nationalAverage) * 100
          : null;

      return {
        metricKey: key,
        title: d.rankingItem.title,
        unit: d.rankingItem.unit ?? "",
        value,
        rank,
        total,
        nationalAverage,
        diffFromAvgPct,
      };
    });
  }, [themeConfig.rankingKeys, indicatorDataMap, selectedPrefectureCode]);

  if (!selectedPrefectureCode || tiles.length === 0) return null;

  const areaName = lookupArea(selectedPrefectureCode)?.areaName ?? selectedPrefectureCode;

  return (
    <Card className="border border-border shadow-sm rounded-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">{areaName} の {themeConfig.title}</CardTitle>
          </div>
          <Link
            href={`/areas/${selectedPrefectureCode}`}
            className="text-xs text-primary hover:underline inline-flex items-center gap-0.5"
          >
            {areaName} プロフィール <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          主要 {tiles.length} 指標について {areaName} の値・全国順位・平均比を表示
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {tiles.map((t) => (
            <KpiTile key={t.metricKey} data={t} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function KpiTile({ data }: { data: KpiTileData }) {
  const { metricKey, title, unit, value, rank, total, diffFromAvgPct } = data;
  const isTopHalf = rank !== null && rank <= Math.ceil(total / 2);
  const rankBadgeColor = !rank
    ? "bg-muted text-muted-foreground"
    : rank <= 5
      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200"
      : rank >= total - 4
        ? "bg-slate-200 text-slate-700 dark:bg-slate-700/40 dark:text-slate-200"
        : "bg-muted text-foreground";

  return (
    <Link
      href={`/ranking/${metricKey}`}
      className="block rounded-md border border-border p-2.5 hover:bg-muted/50 transition-colors"
    >
      <div className="text-xs text-muted-foreground line-clamp-2 mb-1.5 min-h-[2rem]">
        {title}
      </div>
      <div className="flex items-baseline gap-1 mb-1.5">
        <span className="text-xl font-bold tabular-nums">
          {value !== null ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}
        </span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
      <div className="flex items-center justify-between gap-1 text-[11px]">
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded ${rankBadgeColor}`}>
          <BarChart3 className="h-2.5 w-2.5 mr-0.5" />
          {rank !== null ? `${rank} / ${total} 位` : "順位なし"}
        </span>
        {diffFromAvgPct !== null && (
          <span
            className={`tabular-nums ${
              isTopHalf ? "text-blue-600 dark:text-blue-300" : "text-slate-500"
            }`}
          >
            全国平均比 {diffFromAvgPct >= 0 ? "+" : ""}
            {diffFromAvgPct.toFixed(1)}%
          </span>
        )}
      </div>
    </Link>
  );
}
