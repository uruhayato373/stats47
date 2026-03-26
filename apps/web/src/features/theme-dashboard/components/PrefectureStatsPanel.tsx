"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import Link from "next/link";
import dynamic from "next/dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@stats47/components/atoms/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@stats47/components/atoms/ui/tabs";
import { Skeleton } from "@stats47/components/atoms/ui/skeleton";
import type { RankingValue } from "@stats47/ranking";
import { isOk } from "@stats47/types";
import { lookupArea } from "@stats47/area";
import { MapPin } from "lucide-react";

import { fetchAllYearsRankingValuesAction } from "@/features/ranking/actions/fetch-all-years-ranking-values";
import type { ThemeIndicatorData } from "../types";
import { ThemeDbChartRenderer } from "./ThemeDbChartRenderer";
import { KpiCardClient } from "@/features/stat-charts/components/cards/KpiCard/KpiCardClient";
import type { ThemeConfig } from "../types";

const D3LineChart = dynamic(
  () => import("@stats47/visualization/d3").then((mod) => mod.D3LineChart),
  { ssr: false, loading: () => <Skeleton className="h-[200px] w-full rounded-md" /> }
);


interface Props {
  /** 選択中の都道府県コード（null なら全国） */
  selectedPrefectureCode: string | null;
  /** 全指標のプリロード済みデータ */
  indicatorDataMap: Record<string, ThemeIndicatorData>;
  /** 表示する指標キー一覧 */
  rankingKeys: string[];
  /** 現在選択中の指標キー（推移チャート用） */
  selectedIndicatorKey: string;
  /** テーマキー（CPI プロファイル表示判定用） */
  themeKey?: string;
  /** テーマ設定（config-driven チャート用） */
  themeConfig?: ThemeConfig;
  /** DB 管理チャート（page_components） */
  pageCharts?: import("@/features/stat-charts/services/load-page-components").PageComponent[];
}

/**
 * 都道府県統計パネル（nihon-monitor風の右パネル）
 *
 * - KPIカードグリッド: 全指標の値・順位を表示
 * - 推移チャート: 選択中指標の時系列データ（LineChart）
 */
export function PrefectureStatsPanel({
  selectedPrefectureCode,
  indicatorDataMap,
  rankingKeys,
  selectedIndicatorKey,
  themeKey,
  themeConfig,
  pageCharts,
}: Props) {
  const [timeSeriesData, setTimeSeriesData] = useState<RankingValue[]>([]);
  const [isPending, startTransition] = useTransition();
  const areaName = useMemo(() => {
    if (!selectedPrefectureCode) return "全国";
    return lookupArea(selectedPrefectureCode)?.areaName ?? "不明";
  }, [selectedPrefectureCode]);

  // KPIカードデータ（前年比付き）
  const kpiItems = useMemo(() => {
    return rankingKeys
      .filter((key) => indicatorDataMap[key])
      .map((key) => {
        const data = indicatorDataMap[key];
        const latestYear = data.rankingItem.latestYear;
        const availableYears = data.rankingItem.availableYears ?? [];
        const value = selectedPrefectureCode
          ? data.rankingValues.find((v) => v.areaCode === selectedPrefectureCode)
          : null;

        // 前年比計算
        let changeRate: number | null = null;
        let changeDirection: "increase" | "decrease" | "neutral" | null = null;
        if (selectedPrefectureCode && latestYear && availableYears.length >= 2) {
          const prevYearCode = availableYears[1]?.yearCode;
          if (prevYearCode) {
            // TODO: 前年度データは indicatorDataMap に含まれていない（最新年度のみ）
            // フル対応には load-theme-data で全年度プリロードが必要
            // 現時点では null のまま（前年比は Server Action 経由で後から取得）
          }
        }

        return {
          key,
          title: data.rankingItem.title,
          unit: data.rankingItem.unit,
          value: value?.value ?? null,
          rank: value?.rank ?? null,
          changeRate,
          changeDirection,
          yearName: latestYear?.yearName ?? null,
        };
      });
  }, [selectedPrefectureCode, rankingKeys, indicatorDataMap]);

  // 推移データ取得
  useEffect(() => {
    const code = selectedPrefectureCode;
    if (!code) {
      setTimeSeriesData([]);
      return;
    }

    startTransition(async () => {
      const result = await fetchAllYearsRankingValuesAction(
        selectedIndicatorKey,
        "prefecture"
      );
      if (isOk(result)) {
        const filtered = result.data
          .filter((v) => v.areaCode === code)
          .sort((a, b) => a.yearCode.localeCompare(b.yearCode));
        setTimeSeriesData(filtered);
      }
    });
  }, [selectedIndicatorKey, selectedPrefectureCode]);

  // LineChart 用データ変換
  const chartData = useMemo(() => {
    return timeSeriesData.map((v) => ({
      category: v.yearCode,
      label: v.yearName ?? v.yearCode,
      value: v.value,
    }));
  }, [timeSeriesData]);

  const currentIndicator = indicatorDataMap[selectedIndicatorKey];
  const hasTimeSeries = chartData.length > 1;

  return (
    <Card className="border border-border shadow-sm rounded-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <CardTitle className="text-lg">{areaName}</CardTitle>
        </div>
        {!selectedPrefectureCode && (
          <p className="text-xs text-muted-foreground mt-1">
            地図で都道府県を選択してください
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KPIカードグリッド */}
        {themeConfig?.panelTabs ? (
          <Tabs defaultValue={themeConfig.panelTabs[0].label} className="w-full">
            <TabsList className="w-full flex flex-wrap h-auto gap-0.5 p-0.5">
              {themeConfig.panelTabs.map((tab) => (
                <TabsTrigger key={tab.label} value={tab.label} className="text-xs px-2 py-1 flex-1 min-w-0">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {themeConfig.panelTabs.map((tab) => {
              const tabKpiItems = tab.rankingKeys
                .filter((key) => indicatorDataMap[key])
                .map((key) => {
                  const data = indicatorDataMap[key];
                  const value = selectedPrefectureCode
                    ? data.rankingValues.find((v) => v.areaCode === selectedPrefectureCode)
                    : null;
                  return {
                    key,
                    title: data.rankingItem.title,
                    unit: data.rankingItem.unit,
                    value: value?.value ?? null,
                    rank: value?.rank ?? null,
                    changeRate: null as number | null,
                    changeDirection: null as "increase" | "decrease" | "neutral" | null,
                    yearName: data.rankingItem.latestYear?.yearName ?? null,
                  };
                });
              return (
                <TabsContent key={tab.label} value={tab.label} className="mt-2 space-y-4">
                  <KpiGrid
                    items={tabKpiItems}
                    selectedPrefectureCode={selectedPrefectureCode}
                    indicatorDataMap={indicatorDataMap}
                  />
                  {/* DB 管理チャート（chart_definitions から section でマッチ） */}
                  {pageCharts
                    ?.filter((c) => c.section === tab.label)
                    .map((chart) => (
                      <div key={chart.componentKey}>
                        <h3 className="text-sm font-medium mb-2">{chart.title}</h3>
                        <ThemeDbChartRenderer
                          chart={chart}
                          prefCode={selectedPrefectureCode ?? "00000"}
                          prefName={areaName}
                        />
                      </div>
                    ))}
                </TabsContent>
              );
            })}
          </Tabs>
        ) : selectedPrefectureCode ? (
          <KpiGrid items={kpiItems} selectedPrefectureCode={selectedPrefectureCode} indicatorDataMap={indicatorDataMap} />
        ) : (
          <KpiGrid items={kpiItems} selectedPrefectureCode={null} indicatorDataMap={indicatorDataMap} />
        )}

        {/* DB 管理チャート（section が null = トップレベル） */}
        {pageCharts
          ?.filter((c) => c.section === null)
          .map((chart) => (
            <div key={chart.componentKey} className="border-t border-border pt-3">
              <h3 className="text-sm font-medium mb-2">{chart.title}</h3>
              <ThemeDbChartRenderer
                chart={chart}
                prefCode={selectedPrefectureCode ?? "00000"}
                prefName={areaName}
              />
            </div>
          ))}

        {/* 推移チャート（DB チャートがトップレベルにある場合はスキップ） */}
        {selectedPrefectureCode && (!pageCharts || pageCharts.filter(c => c.section === null).length === 0) && (
          <div className="border-t border-border pt-3">
            <h3 className="text-sm font-medium mb-2">
              {currentIndicator?.rankingItem.title}の推移
            </h3>
            {isPending ? (
              <Skeleton className="h-[200px] w-full rounded-md" />
            ) : hasTimeSeries ? (
              <div className="h-[200px]">
                <D3LineChart
                  data={chartData}
                  categoryKey="category"
                  valueKey="value"
                  tooltipFormatter={(v) =>
                    `${v.toLocaleString()} ${currentIndicator?.rankingItem.unit ?? ""}`
                  }
                />
              </div>
            ) : (
              <div className="h-[100px] flex items-center justify-center text-sm text-muted-foreground">
                時系列データがありません
              </div>
            )}
          </div>
        )}

        {/* リンク */}
        {selectedPrefectureCode && (
          <div className="flex gap-3 pt-1">
            <Link
              href={`/areas/${selectedPrefectureCode}`}
              className="text-xs text-primary hover:underline"
            >
              {areaName}の詳細 →
            </Link>
            <Link
              href={`/ranking/${selectedIndicatorKey}`}
              className="text-xs text-primary hover:underline"
            >
              全国ランキング →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- KPI グリッド（KpiCardClient ベース — エリアページと統一デザイン） ---

interface KpiItem {
  key: string;
  title: string;
  unit: string;
  value: number | null;
  rank: number | null;
  changeRate: number | null;
  changeDirection: "increase" | "decrease" | "neutral" | null;
  yearName: string | null;
}

function KpiGrid({
  items,
  selectedPrefectureCode,
  indicatorDataMap,
}: {
  items: KpiItem[];
  selectedPrefectureCode: string | null;
  indicatorDataMap: Record<string, ThemeIndicatorData>;
}) {
  if (selectedPrefectureCode) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <Link key={item.key} href={`/ranking/${item.key}`} className="block">
            <KpiCardClient
              title={item.title}
              value={item.value}
              unit={item.unit}
              year={item.yearName}
              changeRate={item.changeRate}
              changeDirection={item.changeDirection}
            />
          </Link>
        ))}
      </div>
    );
  }

  // 全国（未選択）: 1位の都道府県を表示
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => {
        const data = indicatorDataMap[item.key];
        const top1 = data?.rankingValues.find((v) => v.rank === 1);
        const top1Name = top1 ? lookupArea(top1.areaCode)?.areaName : null;
        return (
          <Link key={item.key} href={`/ranking/${item.key}`} className="block">
            <KpiCardClient
              title={item.title}
              value={top1?.value ?? null}
              unit={data?.rankingItem.unit ?? item.unit}
              year={top1Name ? `1位: ${top1Name}` : null}
              changeRate={null}
              changeDirection={null}
            />
          </Link>
        );
      })}
    </div>
  );
}
