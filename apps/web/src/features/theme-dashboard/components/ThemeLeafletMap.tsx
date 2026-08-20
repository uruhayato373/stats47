"use client";

import { useCallback, useMemo, useState, useTransition } from "react";

import dynamic from "next/dynamic";


import { lookupArea } from "@stats47/area";
import { Skeleton } from "@stats47/components/atoms/ui/skeleton";
import { useTopoJsonToGeoJson } from "@stats47/visualization/leaflet/hooks/useTopoJsonToGeoJson";

const TileSwitcher = dynamic(
  () => import("@stats47/visualization/leaflet").then((mod) => mod.TileSwitcher),
  { ssr: false }
);

import {
  filterMapDataPoints,
  getLeafletBorderColor,
  rankingItemToMapConfig,
} from "@/features/map-visualization/utils/ranking-map-adapters";
import { useThemedLeafletTile } from "@/features/map-visualization/utils/use-themed-leaflet-tile";

import { useTheme } from "@/hooks/useTheme";

import { fetchMunicipalityDrilldownAction } from "../actions";

import type { RankingItem, RankingValue } from "@stats47/ranking";
import type { TopoJSONTopology } from "@stats47/types";
import type { MapDataPoint } from "@stats47/visualization/d3";


const LeafletChoroplethMap = dynamic(
  () => import("@stats47/visualization/leaflet").then((mod) => mod.LeafletChoroplethMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[400px] lg:h-[500px] w-full rounded-md" />,
  }
);

interface ThemeLeafletMapProps {
  rankingItem: RankingItem;
  rankingValues: RankingValue[];
  topology: TopoJSONTopology | null;
  selectedPrefectureCode: string | null;
  onPrefectureClick: (code: string | null) => void;
  /** ドリルダウン時に使用する年度コード（省略時: rankingItem.latestYear.yearCode） */
  yearCode?: string;
}

/**
 * テーマダッシュボード用 Leaflet マップラッパー
 *
 * - light/dark テーマ対応
 * - 都道府県クリック → 市区町村ドリルダウン
 */
export function ThemeLeafletMap({
  rankingItem,
  rankingValues,
  topology,
  selectedPrefectureCode,
  onPrefectureClick,
  yearCode,
}: ThemeLeafletMapProps) {
  const { theme } = useTheme();
  const { currentTile, setCurrentTile, isDark } = useThemedLeafletTile(theme);

  const colorConfig = useMemo(() => rankingItemToMapConfig(rankingItem), [rankingItem]);

  // 全国合計・値なしを除外
  const data: MapDataPoint[] = useMemo(
    () => filterMapDataPoints(rankingValues),
    [rankingValues]
  );

  // ドリルダウン状態
  const [municipalityTopology, setMunicipalityTopology] = useState<TopoJSONTopology | null>(null);
  const [municipalityValues, setMunicipalityValues] = useState<RankingValue[]>([]);
  const [isPending, startTransition] = useTransition();
  const [drilldownPrefCode, setDrilldownPrefCode] = useState<string | null>(null);

  const municipalityGeojson = useTopoJsonToGeoJson(municipalityTopology);

  const municipalityData: MapDataPoint[] = useMemo(
    () => filterMapDataPoints(municipalityValues),
    [municipalityValues]
  );

  const handlePrefectureClick = useCallback(
    (code: string) => {
      // 同じ都道府県をクリック → ドリルダウン解除
      if (code === drilldownPrefCode) {
        setDrilldownPrefCode(null);
        setMunicipalityTopology(null);
        setMunicipalityValues([]);
        onPrefectureClick(null);
        return;
      }

      onPrefectureClick(code);
      setDrilldownPrefCode(code);

      const drilldownYear = yearCode ?? rankingItem.latestYear?.yearCode;
      if (!drilldownYear) return;

      startTransition(async () => {
        const result = await fetchMunicipalityDrilldownAction(
          rankingItem.rankingKey,
          code,
          drilldownYear
        );
        if (result) {
          setMunicipalityTopology(result.topology);
          setMunicipalityValues(result.values);
        } else {
          setMunicipalityTopology(null);
          setMunicipalityValues([]);
        }
      });
    },
    [drilldownPrefCode, onPrefectureClick, rankingItem, yearCode]
  );

  const handleBackToNational = useCallback(() => {
    setDrilldownPrefCode(null);
    setMunicipalityTopology(null);
    setMunicipalityValues([]);
    onPrefectureClick(null);
  }, [onPrefectureClick]);

  const prefName = drilldownPrefCode
    ? lookupArea(drilldownPrefCode)?.areaName
    : null;

  return (
    <div className="relative">
      {/* ドリルダウン時の「47都道府県表示に戻る」ボタン (GEO-SCOPE-SEPARATION-01 WP2) */}
      {drilldownPrefCode && (
        <div className="absolute top-2 left-2 z-[1000] flex items-center gap-2">
          <button
            onClick={handleBackToNational}
            className="bg-background/90 backdrop-blur-sm border rounded-md px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-accent transition-colors"
          >
            ← 47都道府県表示
          </button>
          {prefName && (
            <span className="bg-background/90 backdrop-blur-sm border rounded-md px-3 py-1.5 text-xs shadow-sm">
              {prefName}
              {municipalityData.length > 0
                ? `（${municipalityData.length}市区町村）`
                : isPending
                  ? "（読み込み中...）"
                  : "（市区町村データなし）"}
            </span>
          )}
        </div>
      )}

      <LeafletChoroplethMap
        key={currentTile.url}
        topology={topology}
        data={data}
        colorConfig={colorConfig}
        tileUrl={currentTile.url}
        attribution={currentTile.attribution}
        unit={rankingItem.unit}
        onPrefectureClick={handlePrefectureClick}
        selectedPrefectureCode={selectedPrefectureCode}
        municipalityGeojson={municipalityGeojson}
        municipalityData={municipalityData}
        municipalityColorConfig={colorConfig}
        borderColor={getLeafletBorderColor(theme)}
        className="h-[400px] lg:h-[500px] rounded-md overflow-hidden"
      />

      <TileSwitcher onTileChange={setCurrentTile} isDark={isDark} />
    </div>
  );
}
