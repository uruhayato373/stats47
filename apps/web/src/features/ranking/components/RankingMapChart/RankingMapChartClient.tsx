"use client";

/**
 * ランキングマップ表示コンポーネント
 * Leaflet コロプレスマップで都道府県別 / 市区町村別ヒートマップを表示
 *
 * 市区町村モード時は全国市区町村 TopoJSON をオンデマンド取得し、
 * 都道府県マップと同じ日本地図上で切り替えて表示する。
 */

import { Map as MapIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@stats47/components/atoms/ui/card";
import { Skeleton } from "@stats47/components/atoms/ui/skeleton";

import type { AreaType } from "@/features/area";
import type { RankingItem, RankingValue } from "@stats47/ranking";
import type { StatsSchema, TopoJSONTopology } from "@stats47/types";
import type { MapVisualizationConfig } from "@stats47/visualization/d3";
import { TILE_OPTIONS_LIGHT, TILE_OPTIONS_DARK, type TileProvider } from "@stats47/visualization/leaflet/constants";
import dynamic from "next/dynamic";

import { useTheme } from "@/hooks/useTheme";
import { fetchCityTopologyAction } from "../../actions/fetch-city-topology";

const LeafletChoroplethMap = dynamic(
  () => import("@stats47/visualization/leaflet").then((mod) => mod.LeafletChoroplethMap),
  { ssr: false, loading: () => <Skeleton className="h-[500px] w-full rounded-md" /> }
);

const TileSwitcher = dynamic(
  () => import("@stats47/visualization/leaflet").then((mod) => mod.TileSwitcher),
  { ssr: false }
);

/**
 * RankingMapCardのProps型定義
 */
export interface Props {
  /** ランキング項目情報（色スキーム設定を含む） */
  rankingItem: RankingItem;
  /** ランキングデータ */
  rankingValues: (StatsSchema | RankingValue)[];
  /** 地域タイプ */
  areaType: AreaType;
  /** TopoJSONトポロジーデータ（都道府県）。取得失敗時は null */
  topology: TopoJSONTopology | null;
  /** 選択中の都道府県コード */
  selectedPrefectureCode?: string | null;
  /** 都道府県クリック時のコールバック */
  onPrefectureClick?: (code: string | null) => void;
  /** CardHeader右側に表示するアクション要素 */
  headerActions?: React.ReactNode;
}

/**
 * ランキングマップ表示コンポーネント
 *
 * areaType に応じて都道府県 / 市区町村の TopoJSON を切り替えて描画する。
 * 市区町村 TopoJSON は初回切替時にオンデマンドで取得しキャッシュする。
 */
export function RankingMapChartClient({
  rankingItem,
  rankingValues,
  areaType,
  topology,
  selectedPrefectureCode,
  onPrefectureClick,
  headerActions,
}: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const tileOptions = isDark ? TILE_OPTIONS_DARK : TILE_OPTIONS_LIGHT;
  const [currentTile, setCurrentTile] = useState<TileProvider>(tileOptions[0]);
  useEffect(() => { setCurrentTile(tileOptions[0]); }, [isDark]);

  // RankingItemからMapVisualizationConfigへの変換
  const mapConfig: MapVisualizationConfig = useMemo(() => {
    const vis = rankingItem.visualization;

    if (!vis) {
      return {
        colorScheme: "blues",
        colorSchemeType: "sequential" as const,
        isReversed: false,
        minValueType: "data-min" as const,
      };
    }

    const baseConfig = {
      colorScheme: vis.colorScheme,
      colorSchemeType: vis.colorSchemeType,
      isReversed: vis.isReversed,
    };

    if (vis.colorSchemeType === "sequential") {
      return {
        ...baseConfig,
        colorSchemeType: "sequential" as const,
        minValueType: vis.minValueType ?? "data-min",
      };
    } else if (vis.colorSchemeType === "diverging") {
      return {
        ...baseConfig,
        colorSchemeType: "diverging" as const,
        divergingMidpoint: vis.divergingMidpoint,
        divergingMidpointValue: vis.divergingMidpointValue ?? undefined,
        isSymmetrized: vis.isSymmetrized,
      };
    } else {
      return {
        ...baseConfig,
        colorSchemeType: "categorical" as const,
      };
    }
  }, [rankingItem]);

  // areaCode=00000（全国合計）のデータを除外
  const filteredData = useMemo(() => {
    return rankingValues.filter((item) => item.areaCode !== "00000");
  }, [rankingValues]);

  // --- 市区町村 TopoJSON のオンデマンド取得・キャッシュ ---
  const [cityTopology, setCityTopology] = useState<TopoJSONTopology | null>(null);
  const [isCityTopologyLoading, startCityTopologyTransition] = useTransition();
  const [cityTopologyError, setCityTopologyError] = useState(false);

  useEffect(() => {
    if (areaType === "city" && !cityTopology && !cityTopologyError) {
      startCityTopologyTransition(async () => {
        const result = await fetchCityTopologyAction();
        if (result) {
          setCityTopology(result);
        } else {
          setCityTopologyError(true);
        }
      });
    }
  }, [areaType, cityTopology, cityTopologyError]);

  // 現在の areaType に応じた TopoJSON を選択
  const activeTopology = areaType === "city" ? cityTopology : topology;
  const isMapLoading = areaType === "city" && isCityTopologyLoading;

  // 都道府県クリック時のトグル動作
  const handlePrefectureClick = useCallback((code: string) => {
    onPrefectureClick?.(code === selectedPrefectureCode ? null : code);
  }, [onPrefectureClick, selectedPrefectureCode]);

  return (
    <Card className="w-full border border-border shadow-sm rounded-sm">
      <CardHeader>
        <MapIcon className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="flex-1">コロプレスマップ</CardTitle>
        {headerActions}
      </CardHeader>
      <CardContent className="p-4">
        <div className="relative w-full overflow-hidden rounded-md">
          {isMapLoading ? (
            <Skeleton className="h-[500px] w-full rounded-md" />
          ) : activeTopology === null ? (
            <div
              className="flex items-center justify-center min-h-[200px] rounded-md bg-muted/50 text-muted-foreground text-sm"
              role="status"
              aria-live="polite"
            >
              {areaType === "city" && cityTopologyError
                ? "市区町村の地図データを読み込めませんでした"
                : "地図を読み込めませんでした"}
            </div>
          ) : (
            <>
              <LeafletChoroplethMap
                key={`${areaType}-${currentTile.url}`}
                topology={activeTopology}
                data={filteredData}
                colorConfig={mapConfig}
                tileUrl={currentTile.url}
                attribution={currentTile.attribution}
                unit={rankingItem.unit}
                onPrefectureClick={areaType === "prefecture" ? handlePrefectureClick : undefined}
                selectedPrefectureCode={areaType === "prefecture" ? selectedPrefectureCode : undefined}
                borderColor={isDark ? "#475569" : "#94a3b8"}
                className="h-[500px]"
              />
              <TileSwitcher onTileChange={setCurrentTile} isDark={isDark} />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
