"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import type { FeatureCollection, Geometry } from "geojson";

import { Skeleton } from "@stats47/components/atoms/ui/skeleton";
import type { TopoJSONTopology } from "@stats47/types";
import type { RankingItem, RankingValue } from "@stats47/ranking";
import type { MapVisualizationConfig, MapDataPoint } from "@stats47/visualization/d3";
import { TILE_OPTIONS_LIGHT, TILE_OPTIONS_DARK } from "@stats47/visualization/leaflet";
import { useTopoJsonToGeoJson } from "@stats47/visualization/leaflet";

const TileSwitcher = dynamic(
  () => import("@stats47/visualization/leaflet").then((mod) => mod.TileSwitcher),
  { ssr: false }
);

import { useTheme } from "@/hooks/useTheme";
import { lookupArea } from "@stats47/area";

import { fetchMunicipalityDrilldownAction } from "../actions/fetch-municipality-data";

const LeafletChoroplethMap = dynamic(
  () => import("@stats47/visualization/leaflet").then((mod) => mod.LeafletChoroplethMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full rounded-md" />,
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
  const isDark = theme === "dark";
  const tileOptions = isDark ? TILE_OPTIONS_DARK : TILE_OPTIONS_LIGHT;
  const [currentTile, setCurrentTile] = useState(tileOptions[0]);
  useEffect(() => { setCurrentTile(tileOptions[0]); }, [isDark]);

  // RankingItem → MapVisualizationConfig 変換
  const colorConfig: MapVisualizationConfig = useMemo(() => {
    const vis = rankingItem.visualization;
    if (!vis) {
      return { colorScheme: "blues", colorSchemeType: "sequential" as const, isReversed: false, minValueType: "data-min" as const };
    }
    const base = { colorScheme: vis.colorScheme, isReversed: vis.isReversed };
    if (vis.colorSchemeType === "diverging") {
      return { ...base, colorSchemeType: "diverging" as const, divergingMidpoint: vis.divergingMidpoint, divergingMidpointValue: vis.divergingMidpointValue ?? undefined, isSymmetrized: vis.isSymmetrized };
    }
    if (vis.colorSchemeType === "categorical") {
      return { ...base, colorSchemeType: "categorical" as const };
    }
    return { ...base, colorSchemeType: "sequential" as const, minValueType: vis.minValueType ?? "data-min" };
  }, [rankingItem]);

  // 全国合計を除外
  const data: MapDataPoint[] = useMemo(
    () => rankingValues.filter((v) => v.areaCode !== "00000"),
    [rankingValues]
  );

  // ドリルダウン状態
  const [municipalityTopology, setMunicipalityTopology] = useState<TopoJSONTopology | null>(null);
  const [municipalityValues, setMunicipalityValues] = useState<RankingValue[]>([]);
  const [isPending, startTransition] = useTransition();
  const [drilldownPrefCode, setDrilldownPrefCode] = useState<string | null>(null);

  const municipalityGeojson = useTopoJsonToGeoJson(municipalityTopology);

  const municipalityData: MapDataPoint[] = useMemo(
    () => municipalityValues.filter((v) => v.areaCode !== "00000"),
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
      {/* ドリルダウン時の「全国に戻る」ボタン */}
      {drilldownPrefCode && (
        <div className="absolute top-2 left-2 z-[1000] flex items-center gap-2">
          <button
            onClick={handleBackToNational}
            className="bg-background/90 backdrop-blur-sm border rounded-md px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-accent transition-colors"
          >
            ← 全国表示
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
        borderColor={isDark ? "#475569" : "#94a3b8"}
        className="h-[400px] lg:h-[500px] rounded-md overflow-hidden"
      />

      <TileSwitcher onTileChange={setCurrentTile} isDark={isDark} />
    </div>
  );
}
