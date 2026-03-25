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
import { fetchCpiCategoriesAction, fetchCpiAllYearsAction, type CpiCategoryData, type CpiHeatmapCell } from "../actions/fetch-cpi-categories";
import { fetchIndustryStructureAction, type IndustryStructureData } from "../actions/fetch-industry-structure";
import { fetchWorkstyleDataAction, type WorkstyleBarItem } from "../actions/fetch-workstyle-data";
import { fetchPopulationCompositionAction, type AgeCompositionResult } from "../actions/fetch-population-composition";
import { AgeCompositionChart } from "./AgeCompositionChart";
import { PopulationPyramidChart } from "./PopulationPyramidChart";
import { BirthDeathRateLineChart } from "./BirthDeathRateLineChart";
import { NaturalSocialRateLineChart } from "./NaturalSocialRateLineChart";
import { ThemeChartPanel } from "./ThemeChartPanel";
import { ConfigDrivenDonutChart } from "./ConfigDrivenDonutChart";
import type { ThemeConfig } from "../types";

const HorizontalDivergingBarChart = dynamic(
  () => import("@stats47/visualization/d3").then((mod) => mod.HorizontalDivergingBarChart),
  { ssr: false, loading: () => <Skeleton className="h-[250px] w-full rounded-md" /> }
);

const CategoryHeatmap = dynamic(
  () => import("@stats47/visualization/d3").then((mod) => mod.CategoryHeatmap),
  { ssr: false, loading: () => <Skeleton className="h-[250px] w-full rounded-md" /> }
);

const DonutChart = dynamic(
  () => import("@stats47/visualization/d3").then((mod) => mod.DonutChart),
  { ssr: false, loading: () => <Skeleton className="h-[200px] w-full rounded-md" /> }
);

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
}: Props) {
  const [timeSeriesData, setTimeSeriesData] = useState<RankingValue[]>([]);
  const [isPending, startTransition] = useTransition();
  const [cpiData, setCpiData] = useState<CpiCategoryData[] | null>(null);
  const [cpiHeatmapData, setCpiHeatmapData] = useState<CpiHeatmapCell[] | null>(null);
  const [isCpiPending, startCpiTransition] = useTransition();

  const isConsumerPricesTheme = themeKey === "consumer-prices";
  const isLocalEconomyTheme = themeKey === "local-economy";
  const isPopulationDynamicsTheme = themeKey === "population-dynamics" || themeKey === "aging-society";

  // 産業構造ドーナツチャート（local-economy テーマのみ）
  const [industryData, setIndustryData] = useState<IndustryStructureData[] | null>(null);
  const [isIndustryPending, startIndustryTransition] = useTransition();

  useEffect(() => {
    if (!isLocalEconomyTheme || !selectedPrefectureCode) {
      setIndustryData(null);
      return;
    }
    startIndustryTransition(async () => {
      const result = await fetchIndustryStructureAction(selectedPrefectureCode);
      setIndustryData(result);
    });
  }, [isLocalEconomyTheme, selectedPrefectureCode]);

  // 人口構成チャート（population-dynamics / aging-society テーマのみ）
  const [popCompositionResult, setPopCompositionResult] = useState<AgeCompositionResult | null>(null);
  const [isPopCompositionPending, startPopCompositionTransition] = useTransition();

  useEffect(() => {
    if (!isPopulationDynamicsTheme) {
      setPopCompositionResult(null);
      return;
    }
    startPopCompositionTransition(async () => {
      const result = await fetchPopulationCompositionAction(selectedPrefectureCode);
      setPopCompositionResult(result);
    });
  }, [isPopulationDynamicsTheme, selectedPrefectureCode]);

  // 働き方チャート（local-economy テーマのみ）
  const [workstyleData, setWorkstyleData] = useState<WorkstyleBarItem[] | null>(null);
  const [isWorkstylePending, startWorkstyleTransition] = useTransition();

  useEffect(() => {
    if (!isLocalEconomyTheme || !selectedPrefectureCode) {
      setWorkstyleData(null);
      return;
    }
    startWorkstyleTransition(async () => {
      const result = await fetchWorkstyleDataAction(selectedPrefectureCode);
      setWorkstyleData(result);
    });
  }, [isLocalEconomyTheme, selectedPrefectureCode]);

  // CPI 品目別データ取得（最新年 + 全年分ヒートマップ）
  useEffect(() => {
    if (!isConsumerPricesTheme || !selectedPrefectureCode) {
      setCpiData(null);
      setCpiHeatmapData(null);
      return;
    }
    startCpiTransition(async () => {
      const [latest, allYears] = await Promise.all([
        fetchCpiCategoriesAction(selectedPrefectureCode),
        fetchCpiAllYearsAction(selectedPrefectureCode),
      ]);
      setCpiData(latest);
      setCpiHeatmapData(allYears);
    });
  }, [isConsumerPricesTheme, selectedPrefectureCode]);

  const areaName = useMemo(() => {
    if (!selectedPrefectureCode) return "全国";
    return lookupArea(selectedPrefectureCode)?.areaName ?? "不明";
  }, [selectedPrefectureCode]);

  // KPIカードデータ
  const kpiItems = useMemo(() => {
    return rankingKeys
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
                  };
                });
              return (
                <TabsContent key={tab.label} value={tab.label} className="mt-2 space-y-4">
                  <KpiGrid
                    items={tabKpiItems}
                    selectedPrefectureCode={selectedPrefectureCode}
                    indicatorDataMap={indicatorDataMap}
                  />
                  {tab.charts?.map((chart, i) => (
                    <div key={i}>
                      <h3 className="text-sm font-medium mb-2">{chart.label}</h3>
                      {(chart.type === "dual-line" || chart.type === "mixed") && (
                        <ThemeChartPanel
                          chartDef={chart}
                          prefCode={selectedPrefectureCode ?? "00000"}
                          prefName={areaName}
                        />
                      )}
                      {chart.type === "donut-action" && selectedPrefectureCode && (
                        <ConfigDrivenDonutChart
                          config={chart}
                          prefCode={selectedPrefectureCode}
                          prefName={areaName}
                        />
                      )}
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

        {/* CPI 品目別プロファイル（consumer-prices テーマのみ） */}
        {isConsumerPricesTheme && selectedPrefectureCode && (
          <div className="border-t border-border pt-3">
            <h3 className="text-sm font-medium mb-2">物価プロファイル</h3>
            {isCpiPending ? (
              <Skeleton className="h-[250px] w-full rounded-md" />
            ) : cpiData && cpiData.length > 0 ? (
              <>
                <HorizontalDivergingBarChart
                  data={cpiData}
                  baseline={100}
                  height={Math.max(250, cpiData.length * 30 + 40)}
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  全国平均=100 / 出典: 小売物価統計調査（構造編）
                </p>
              </>
            ) : (
              <div className="h-[100px] flex items-center justify-center text-sm text-muted-foreground">
                物価プロファイルデータがありません
              </div>
            )}
          </div>
        )}

        {/* CPI 年×品目ヒートマップ（consumer-prices テーマのみ） */}
        {isConsumerPricesTheme && selectedPrefectureCode && (
          <div className="border-t border-border pt-3">
            <h3 className="text-sm font-medium mb-2">物価推移ヒートマップ</h3>
            {isCpiPending ? (
              <Skeleton className="h-[280px] w-full rounded-md" />
            ) : cpiHeatmapData && cpiHeatmapData.length > 0 ? (
              <>
                <CategoryHeatmap
                  data={cpiHeatmapData}
                  baseline={100}
                  height={300}
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  青=全国平均より高い / オレンジ=低い（全国平均=100）
                </p>
              </>
            ) : (
              <div className="h-[80px] flex items-center justify-center text-sm text-muted-foreground">
                ヒートマップデータがありません
              </div>
            )}
          </div>
        )}

        {/* 産業構造ドーナツチャート（local-economy テーマのみ） */}
        {isLocalEconomyTheme && selectedPrefectureCode && (
          <div className="border-t border-border pt-3">
            <h3 className="text-sm font-medium mb-2">産業構造</h3>
            {isIndustryPending ? (
              <Skeleton className="h-[200px] w-full rounded-md" />
            ) : industryData && industryData.length === 3 ? (
              <>
                <div className="h-[200px]">
                  <DonutChart
                    data={industryData.map((d) => ({ ...d }))}
                    centerText={`${industryData[2].value.toFixed(1)}%`}
                  />
                </div>
                <div className="flex justify-center gap-4 mt-2">
                  {industryData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.name} {d.value.toFixed(1)}%
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[80px] flex items-center justify-center text-sm text-muted-foreground">
                産業構造データがありません
              </div>
            )}
          </div>
        )}

        {/* 新しい働き方チャート（local-economy テーマのみ） */}
        {isLocalEconomyTheme && selectedPrefectureCode && (
          <div className="border-t border-border pt-3">
            <h3 className="text-sm font-medium mb-2">新しい働き方</h3>
            {isWorkstylePending ? (
              <Skeleton className="h-[180px] w-full rounded-md" />
            ) : workstyleData && workstyleData.length > 0 ? (
              <>
                <HorizontalDivergingBarChart
                  data={workstyleData.map((d) => ({
                    label: d.label,
                    value: d.value - d.nationalAvg,
                  }))}
                  baseline={0}
                  unit="pt"
                  height={Math.max(160, workstyleData.length * 35 + 40)}
                />
                <div className="mt-2 space-y-0.5">
                  {workstyleData.map((d) => (
                    <div key={d.label} className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{d.label}</span>
                      <span>{d.value.toFixed(1)}%（全国 {d.nationalAvg.toFixed(1)}%）</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  バー=全国平均との差（ポイント）
                </p>
              </>
            ) : (
              <div className="h-[80px] flex items-center justify-center text-sm text-muted-foreground">
                働き方データがありません
              </div>
            )}
          </div>
        )}

        {/* 人口構成チャート（population-dynamics / aging-society テーマのみ） */}
        {isPopulationDynamicsTheme && (
          <div className="border-t border-border pt-3">
            <h3 className="text-sm font-medium mb-2">年齢3区分人口構成の推移</h3>
            <AgeCompositionChart
              prefData={popCompositionResult?.prefData ?? null}
              nationalData={popCompositionResult?.nationalData ?? null}
              prefName={selectedPrefectureCode ? areaName : undefined}
              loading={isPopCompositionPending}
            />
          </div>
        )}

        {/* 人口ピラミッド（population-dynamics / aging-society テーマ） */}
        {isPopulationDynamicsTheme && (
          <div className="border-t border-border pt-3">
            <h3 className="text-sm font-medium mb-2">人口ピラミッド</h3>
            <PopulationPyramidChart
              prefCode={selectedPrefectureCode ?? "00000"}
              prefName={areaName}
            />
          </div>
        )}

        {/* 出生率・死亡率の推移チャート（population-dynamics / aging-society テーマ） */}
        {isPopulationDynamicsTheme && (
          <div className="border-t border-border pt-3">
            <h3 className="text-sm font-medium mb-2">出生率・死亡率の推移</h3>
            <BirthDeathRateLineChart
              prefCode={selectedPrefectureCode ?? "00000"}
              prefName={areaName}
            />
          </div>
        )}

        {/* 自然増減率・社会増減率の推移チャート（population-dynamics / aging-society テーマ） */}
        {isPopulationDynamicsTheme && (
          <div className="border-t border-border pt-3">
            <h3 className="text-sm font-medium mb-2">自然増減率・社会増減率の推移</h3>
            <NaturalSocialRateLineChart
              prefCode={selectedPrefectureCode ?? "00000"}
              prefName={areaName}
            />
          </div>
        )}

        {/* Config-driven チャート */}
        {themeConfig?.charts?.map((chart, i) => (
          <div key={i} className="border-t border-border pt-3">
            <h3 className="text-sm font-medium mb-2">{chart.label}</h3>
            {(chart.type === "dual-line" || chart.type === "mixed") && (
              <ThemeChartPanel
                chartDef={chart}
                prefCode={selectedPrefectureCode ?? "00000"}
                prefName={areaName}
              />
            )}
            {chart.type === "donut-action" && selectedPrefectureCode && (
              <ConfigDrivenDonutChart
                config={chart}
                prefCode={selectedPrefectureCode}
                prefName={areaName}
              />
            )}
          </div>
        ))}

        {/* 推移チャート（population-dynamics / aging-society テーマでは専用チャートがあるのでスキップ） */}
        {selectedPrefectureCode && !isPopulationDynamicsTheme && (
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

// --- KPI グリッド ---

interface KpiItem {
  key: string;
  title: string;
  unit: string;
  value: number | null;
  rank: number | null;
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
          <Link
            key={item.key}
            href={`/ranking/${item.key}`}
            className="block p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors"
          >
            <div className="text-[11px] text-muted-foreground line-clamp-1 mb-1">
              {item.title}
            </div>
            <div className="text-sm font-bold">
              {item.value != null ? item.value.toLocaleString() : "-"}
              <span className="text-[10px] font-normal text-muted-foreground ml-0.5">
                {item.unit}
              </span>
            </div>
            {item.rank != null && (
              <div className="text-[10px] text-muted-foreground">
                {item.rank}位 / 47
              </div>
            )}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => {
        const data = indicatorDataMap[item.key];
        const top1 = data?.rankingValues.find((v) => v.rank === 1);
        const top1Name = top1 ? lookupArea(top1.areaCode)?.areaName : null;
        return (
          <Link
            key={item.key}
            href={`/ranking/${item.key}`}
            className="block p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors"
          >
            <div className="text-[11px] text-muted-foreground line-clamp-1 mb-1">
              {item.title}
            </div>
            {top1 && (
              <>
                <div className="text-sm font-bold">
                  {top1.value.toLocaleString()}
                  <span className="text-[10px] font-normal text-muted-foreground ml-0.5">
                    {data.rankingItem.unit}
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  1位: {top1Name}
                </div>
              </>
            )}
          </Link>
        );
      })}
    </div>
  );
}
