"use client";

import { useCallback, useMemo, useState, useTransition } from "react";

import Link from "next/link";

import { lookupArea } from "@stats47/area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@stats47/components/atoms/ui/tabs";
import { Map as MapIcon, Table as TableIcon, BarChart3 } from "lucide-react";

import { RankingDataTable, RankingYearSelector } from "@/features/ranking";

import { useBreakpoint } from "@/hooks/useBreakpoint";

import { fetchIndicatorForYearAction } from "../actions";

import { PopulationScatterSection } from "./PopulationScatterSection";
import { PrefectureStatsPanel } from "./PrefectureStatsPanel";
import { ScrollableTabsList } from "./ScrollableTabsList";
import { ThemeLeafletMap } from "./ThemeLeafletMap";

import type { ThemeDashboardClientProps } from "../types";
import type { RankingValue } from "@stats47/ranking";

/**
 * タブ型テーマダッシュボード Client Component
 *
 * tabIndicators がある場合に使用。
 * - デスクトップ: 左(タブ+年度セレクタ+地図) / 右(KPI+チャート)
 * - モバイル: タブ+年度セレクタ → 3タブ切替（地図/統計/テーブル）
 */
export function ThemeDashboardTabbed({
  themeConfig,
  indicatorDataMap,
  topology,
  pageCharts,
}: ThemeDashboardClientProps) {
  const tabIndicators = themeConfig.tabIndicators;
  const isBelowLg = useBreakpoint("belowLg");

  // 選択中のタブ指標
  const [selectedTabKey, setSelectedTabKey] = useState(
    themeConfig.defaultRankingKey
  );

  // 指標ごとの選択年度（初期値: 各指標の latestYear）
  const [selectedYearMap, setSelectedYearMap] = useState<Record<string, string>>(
    () => {
      const map: Record<string, string> = {};
      for (const tab of tabIndicators) {
        const data = indicatorDataMap[tab.rankingKey];
        if (data?.rankingItem.latestYear) {
          map[tab.rankingKey] = data.rankingItem.latestYear.yearCode;
        }
      }
      return map;
    }
  );

  // 年度変更で取得したデータのオーバーライド
  const [yearDataOverrides, setYearDataOverrides] = useState<
    Record<string, Record<string, RankingValue[]>>
  >({});

  const [isYearPending, startYearTransition] = useTransition();

  // 選択中の都道府県
  const [selectedPrefectureCode, setSelectedPrefectureCode] = useState<
    string | null
  >(null);

  // 現在のタブのデータ
  const currentYear = selectedYearMap[selectedTabKey];
  const currentData = indicatorDataMap[selectedTabKey];
  const currentValues =
    yearDataOverrides[selectedTabKey]?.[currentYear] ??
    currentData?.rankingValues ??
    [];
  const currentRankingItem = currentData?.rankingItem;

  // 現在のタブの利用可能年度
  const currentAvailableYears = useMemo(() => {
    return currentData?.availableYears ?? [];
  }, [currentData]);

  // 年度変更ハンドラ
  const handleYearChange = useCallback(
    (yearCode: string) => {
      setSelectedYearMap((prev) => ({ ...prev, [selectedTabKey]: yearCode }));

      // latestYear と同じ場合はプリロード済みデータを使う
      if (yearCode === currentData?.rankingItem.latestYear?.yearCode) return;

      // キャッシュ済みならスキップ
      if (yearDataOverrides[selectedTabKey]?.[yearCode]) return;

      startYearTransition(async () => {
        const values = await fetchIndicatorForYearAction(
          selectedTabKey,
          yearCode
        );
        if (values.length > 0) {
          setYearDataOverrides((prev) => ({
            ...prev,
            [selectedTabKey]: {
              ...prev[selectedTabKey],
              [yearCode]: values,
            },
          }));
        }
      });
    },
    [selectedTabKey, currentData, yearDataOverrides]
  );

  // 年度表示ラベル
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for future year label display
  const _currentYearName = useMemo(() => {
    const year = currentAvailableYears.find((y) => y.yearCode === currentYear);
    return year?.yearName ?? currentYear;
  }, [currentAvailableYears, currentYear]);

  // --- 共通パーツ ---

  const indicatorTabs = (
    <Tabs value={selectedTabKey} onValueChange={setSelectedTabKey}>
      <ScrollableTabsList tabs={tabIndicators} />
    </Tabs>
  );

  const yearSelector = currentAvailableYears.length > 0 && currentYear && (
    <div className="flex items-center gap-2">
      <RankingYearSelector
        times={currentAvailableYears}
        value={currentYear}
        onChange={handleYearChange}
      />
      {isYearPending && (
        <span className="text-xs text-muted-foreground animate-pulse">
          読込中...
        </span>
      )}
    </div>
  );

  const mapSection = currentRankingItem && (
    <ThemeLeafletMap
      rankingItem={currentRankingItem}
      rankingValues={currentValues}
      topology={topology}
      selectedPrefectureCode={selectedPrefectureCode}
      onPrefectureClick={setSelectedPrefectureCode}
      yearCode={currentYear}
    />
  );

  // --- レイアウト ---

  if (isBelowLg) {
    return (
      <div className="space-y-3 min-w-0 overflow-hidden">
        {indicatorTabs}
        {yearSelector}

        <DeferredTabs
          mapSection={mapSection}
          statsSection={
            <PrefectureStatsPanel
              selectedPrefectureCode={selectedPrefectureCode}
              indicatorDataMap={indicatorDataMap}
              rankingKeys={themeConfig.rankingKeys}
              selectedIndicatorKey={selectedTabKey}
              themeKey={themeConfig.themeKey}
              themeConfig={themeConfig}
              pageCharts={pageCharts}
            />
          }
          tableSection={
            currentRankingItem ? (
              <RankingDataTable
                rankingValues={currentValues}
                rankingItem={currentRankingItem}
              />
            ) : null
          }
        />

        {themeConfig.themeKey === "population-dynamics" && (
          <PopulationScatterSection
            indicatorDataMap={indicatorDataMap}
            selectedPrefectureCode={selectedPrefectureCode}
          />
        )}

        <IndicatorGrid
          rankingKeys={themeConfig.rankingKeys}
          indicatorDataMap={indicatorDataMap}
        />
      </div>
    );
  }

  // デスクトップ
  return (
    <div className="space-y-4 overflow-hidden">
      <div className="grid grid-cols-[1fr_380px] gap-4 items-start">
        {/* 左カラム: タブ + 年度 + 地図 + 指標一覧 */}
        <div className="space-y-3 min-w-0">
          {indicatorTabs}
          {yearSelector}
          <div className="sticky top-20">{mapSection}</div>
          <IndicatorGrid
            rankingKeys={themeConfig.rankingKeys}
            indicatorDataMap={indicatorDataMap}
          />
        </div>

        {/* 右カラム: KPI + チャート */}
        <div>
          <PrefectureStatsPanel
            selectedPrefectureCode={selectedPrefectureCode}
            indicatorDataMap={indicatorDataMap}
            rankingKeys={themeConfig.rankingKeys}
            selectedIndicatorKey={selectedTabKey}
            themeKey={themeConfig.themeKey}
            themeConfig={themeConfig}
            pageCharts={pageCharts}
          />
        </div>
      </div>

      {themeConfig.themeKey === "population-dynamics" && (
        <PopulationScatterSection
          indicatorDataMap={indicatorDataMap}
          selectedPrefectureCode={selectedPrefectureCode}
        />
      )}
    </div>
  );
}

// --- 指標一覧グリッド ---

function IndicatorGrid({
  rankingKeys,
  indicatorDataMap,
}: {
  rankingKeys: string[];
  indicatorDataMap: ThemeDashboardClientProps["indicatorDataMap"];
}) {
  return (
    <section>
      <h2 className="text-xl font-bold mb-4">このテーマの指標一覧</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {rankingKeys
          .filter((key) => indicatorDataMap[key])
          .map((key) => {
            const data = indicatorDataMap[key];
            const top1 = data.rankingValues.find((v) => v.rank === 1);
            const top1Name = top1
              ? lookupArea(top1.areaCode)?.areaName
              : null;
            return (
              <Link
                key={key}
                href={`/ranking/${key}`}
                className="block p-3 rounded-lg border border-border hover:bg-muted/50 hover:shadow-md transition-all"
              >
                <div className="text-sm font-medium mb-2 line-clamp-2">
                  {data.rankingItem.title}
                </div>
                {top1 && top1Name && (
                  <div className="text-xs text-muted-foreground">
                    1位: {top1Name}
                    <span className="ml-1">
                      ({top1.value?.toLocaleString()} {data.rankingItem.unit})
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
      </div>
    </section>
  );
}

/**
 * 遅延マウント付きタブ — 選択されるまで stats/table タブのコンテンツをレンダリングしない。
 * 一度表示したタブは mountedTabs で保持し、再マウントを防止する。
 */
function DeferredTabs({
  mapSection,
  statsSection,
  tableSection,
}: {
  mapSection: React.ReactNode;
  statsSection: React.ReactNode;
  tableSection: React.ReactNode | null;
}) {
  const [activeTab, setActiveTab] = useState("map");
  const [mountedTabs, setMountedTabs] = useState<Set<string>>(
    () => new Set(["map"]),
  );

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setMountedTabs((prev) => {
      if (prev.has(value)) return prev;
      return new Set(prev).add(value);
    });
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="w-full grid grid-cols-3">
        <TabsTrigger value="map" className="flex items-center gap-1">
          <MapIcon className="w-3.5 h-3.5" />
          地図
        </TabsTrigger>
        <TabsTrigger value="stats" className="flex items-center gap-1">
          <BarChart3 className="w-3.5 h-3.5" />
          統計
        </TabsTrigger>
        <TabsTrigger value="table" className="flex items-center gap-1">
          <TableIcon className="w-3.5 h-3.5" />
          テーブル
        </TabsTrigger>
      </TabsList>
      <TabsContent value="map" className="mt-3">
        {mountedTabs.has("map") && mapSection}
      </TabsContent>
      <TabsContent value="stats" className="mt-3">
        {mountedTabs.has("stats") && statsSection}
      </TabsContent>
      <TabsContent value="table" className="mt-3">
        {mountedTabs.has("table") && tableSection}
      </TabsContent>
    </Tabs>
  );
}
