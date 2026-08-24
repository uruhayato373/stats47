"use client";

import { useCallback, useMemo, useState, useTransition } from "react";

import dynamic from "next/dynamic";
import Link from "next/link";

import { fetchPrefectures, lookupArea } from "@stats47/area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@stats47/components/atoms/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@stats47/components/atoms/ui/tabs";
import { Map as MapIcon, Table as TableIcon, BarChart3, MapPin } from "lucide-react";

import { SurfaceLinkCard, getSurfaceCardClassName } from "@/components/surface";

import { RankingYearSelector } from "@/features/ranking";

import { useBreakpoint } from "@/hooks/useBreakpoint";

import { fetchIndicatorForYearAction } from "../actions";
import { PREFECTURE_SET_LABEL, type ThemeDashboardClientProps } from "../types";

import { ChartLoading } from "./ChartState";
import { ScrollableTabsList } from "./ScrollableTabsList";
import { ThemeMetricsDashboard } from "./ThemeMetricsDashboard";
import { useThemePrefecture } from "./ThemePrefectureContext";

import type { RankingValue } from "@stats47/ranking";

function chartLoading(props: { height?: number; className?: string }) {
  const ChartLoadingFallback = () => <ChartLoading {...props} />;
  ChartLoadingFallback.displayName = "ChartLoadingFallback";
  return ChartLoadingFallback;
}

const RankingDataTable = dynamic(
  () => import("@/features/ranking/components/RankingDataTable").then((mod) => mod.RankingDataTable),
  { ssr: false, loading: chartLoading({ height: 360 }) },
);

const ThemeLeafletMap = dynamic(
  () => import("./ThemeLeafletMap").then((mod) => mod.ThemeLeafletMap),
  { ssr: false, loading: chartLoading({ className: "h-[400px] lg:h-[500px]" }) },
);

const MetricFocusCharts = dynamic(
  () => import("./MetricFocusCharts").then((mod) => mod.MetricFocusCharts),
  { ssr: false, loading: chartLoading({ height: 420 }) },
);

const ThemeYoyCharts = dynamic(
  () => import("./ThemeYoyCharts").then((mod) => mod.ThemeYoyCharts),
  { ssr: false, loading: chartLoading({ height: 420 }) },
);

const PopulationScatterSection = dynamic(
  () => import("./PopulationScatterSection").then((mod) => mod.PopulationScatterSection),
  { ssr: false, loading: chartLoading({ height: 360 }) },
);

/**
 * タブ型テーマダッシュボード Client Component
 *
 * tabIndicators がある場合に使用。
 * - デスクトップ: 左(タブ+年度セレクタ+地図) / 右(KPI+チャート)
 * - モバイル: タブ+年度セレクタ → 3タブ切替（地図/統計/テーブル）
 */
export function ThemeDashboardTabbed({
  themeConfig,
  metricGroups,
  indicatorDataMap,
  topology,
  pageCharts,
  highlightAreaCode,
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

  // 選択中の都道府県は ThemePrefectureContext を単一ソースとして共有する
  // (H1・セレクタ・ダッシュボードで同期、URL ?pref= も context が同期)。
  const { selectedPrefectureCode, setSelected: setSelectedPrefectureCode } =
    useThemePrefecture();

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

  // 選択中の都道府県名（セレクタ・H1バナー用）
  const selectedAreaName = useMemo(() => {
    if (!selectedPrefectureCode) return null;
    return lookupArea(selectedPrefectureCode)?.areaName ?? null;
  }, [selectedPrefectureCode]);

  // 都道府県セレクタ（47都道府県一覧 + 個別選択）
  const prefectureSelector = (
    <PrefectureSelector
      value={selectedPrefectureCode}
      onChange={setSelectedPrefectureCode}
    />
  );

  // 選択エリアをH1直下に反映するバナー（client-side表示、SSG不変）
  const areaBanner = selectedAreaName && (
    <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
      <MapPin className="h-4 w-4 text-primary shrink-0" />
      <span className="font-medium text-primary">{selectedAreaName}の視点</span>
      <span className="text-muted-foreground text-xs">— データを{selectedAreaName}でフィルタ表示中</span>
      <Link
        href={`/areas/${selectedPrefectureCode}`}
        className="ml-auto text-xs text-primary hover:underline shrink-0"
      >
        {selectedAreaName}プロフィール →
      </Link>
    </div>
  );

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

  const metricFocusSection = currentRankingItem && (
    <MetricFocusCharts
      metricKey={selectedTabKey}
      selectedPrefectureCode={selectedPrefectureCode}
      rankingItem={currentRankingItem}
      currentValues={currentValues}
    />
  );

  // フル幅ダッシュボード (KPI カード + 時系列チャート + 考察) — areas スタイル。
  // cardsOnly は付けない: hideMap テーマでも page-components チャート + 考察を出す
  // = カタログ情報の完全ダッシュボード化 (2026-07-04)。
  const metricsDashboardSection = (
    <ThemeMetricsDashboard
      themeConfig={themeConfig}
      metricGroups={metricGroups}
      indicatorDataMap={indicatorDataMap}
      pageCharts={pageCharts}
      selectedPrefectureCode={selectedPrefectureCode}
    />
  );

  // --- レイアウト ---

  // hideMap: 地図タブ UI (コロプレス/指標タブ/年度セレクタ) は出さず、KPI カード +
  // page-components チャート + 考察のフル幅ダッシュボードを描画する。
  // 都道府県セレクタは同時に 1 つだけ見える状態にする (2026-08-04):
  // 992px 以上 = 左レール ThemeSideNav の地域ブロック / 992px 未満 = ThemePageLayout の
  // 上部代替 UI。本体側 prefectureSelector はここでは出さない。
  // 選択エリアは H1 に反映される。
  if (themeConfig.hideMap) {
    return (
      <div className="space-y-4 overflow-hidden">
        {metricsDashboardSection}
      </div>
    );
  }

  if (isBelowLg) {
    return (
      <div className="space-y-3 min-w-0 overflow-hidden">
        {indicatorTabs}
        <div className="flex flex-wrap items-center gap-2">
          {yearSelector}
          {prefectureSelector}
        </div>
        {areaBanner}

        <DeferredTabs
          mapSection={mapSection}
          statsSection={
            <div className="space-y-3">
              {/* フル幅ダッシュボード (KPI カード + 時系列チャート + 考察) */}
              {metricsDashboardSection}
              {/* 県選択時: 選択指標のトレンドを常時可視 */}
              {selectedPrefectureCode && metricFocusSection}
              {/* 県未選択時の単独詳細は折りたたみで */}
              {!selectedPrefectureCode && (
                <DeferredDetails summary="選択指標の単独詳細を表示 (時系列ライン・上下位 5 県)">
                  {metricFocusSection}
                </DeferredDetails>
              )}
            </div>
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

        <ThemeYoyCharts themeKey={themeConfig.themeKey} highlightAreaCode={highlightAreaCode} />

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
      <div className="space-y-3">
        {indicatorTabs}
        <div className="flex flex-wrap items-center gap-3">
          {yearSelector}
          {prefectureSelector}
        </div>
        {areaBanner}
        {mapSection}
        {/* 県選択時: 選択指標のトレンドを常時可視。未選択時は折りたたみ */}
        {selectedPrefectureCode ? (
          metricFocusSection
        ) : (
          <DeferredDetails summary="選択指標の単独詳細を表示 (時系列ライン・上下位 5 県)">
            {metricFocusSection}
          </DeferredDetails>
        )}
        <IndicatorGrid
          rankingKeys={themeConfig.rankingKeys}
          indicatorDataMap={indicatorDataMap}
        />
      </div>

      {/* フル幅ダッシュボード (KPI カード + 時系列チャート + 考察) */}
      {metricsDashboardSection}

      <ThemeYoyCharts themeKey={themeConfig.themeKey} />

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
              <SurfaceLinkCard
                key={key}
                href={`/ranking/${key}`}
                className="block p-3"
              >
                <div className="text-sm font-medium mb-2 line-clamp-2">
                  {data.rankingItem.readerLabel ?? data.rankingItem.title}
                </div>
                {top1 && top1Name && (
                  <div className="text-xs text-muted-foreground">
                    1位: {top1Name}
                    <span className="ml-1">
                      ({top1.value?.toLocaleString()} {data.rankingItem.unit})
                    </span>
                  </div>
                )}
              </SurfaceLinkCard>
            );
          })}
      </div>
    </section>
  );
}

function DeferredDetails({
  summary,
  children,
}: {
  summary: string;
  children: React.ReactNode;
}) {
  const [hasOpened, setHasOpened] = useState(false);

  return (
    <details
      className={getSurfaceCardClassName({ className: "p-0" })}
      onToggle={(event) => {
        if (event.currentTarget.open) {
          setHasOpened(true);
        }
      }}
    >
      <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground">
        {summary}
      </summary>
      <div className="p-2">
        {hasOpened ? children : null}
      </div>
    </details>
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
  // デフォルト stats: Leaflet タイルを LCP 要素から除外し、モバイル LCP を改善
  const [activeTab, setActiveTab] = useState("stats");
  const [mountedTabs, setMountedTabs] = useState<Set<string>>(
    () => new Set(["stats"]),
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

// --- 都道府県セレクタ ---

/** 47 都道府県の選択肢（モジュールレベルで一度だけ計算） */
const PREFECTURE_OPTIONS = fetchPrefectures().map((p) => ({
  value: p.prefCode,
  label: p.prefName,
}));

/**
 * 都道府県セレクタ
 *
 * value=null のとき「47都道府県」を表示し、県選択で5桁コードを返す
 * (GEO-SCOPE-SEPARATION-01 WP2。e-Stat の "00000" を UI の既定状態にしない)。
 * 「47都道府県に戻す」は value="all" の SelectItem で表現し、onChange に null を返す。
 */
function PrefectureSelector({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (code: string | null) => void;
}) {
  return (
    <Select
      value={value ?? "all"}
      onValueChange={(v) => onChange(v === "all" ? null : v)}
    >
      <SelectTrigger className="w-[140px] h-8 text-xs">
        <SelectValue placeholder="都道府県を選択" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{PREFECTURE_SET_LABEL}</SelectItem>
        {PREFECTURE_OPTIONS.map((p) => (
          <SelectItem key={p.value} value={p.value}>
            {p.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
