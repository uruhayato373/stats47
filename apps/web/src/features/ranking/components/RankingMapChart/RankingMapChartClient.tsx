"use client";

/**
 * ランキングマップ表示コンポーネント
 * Leaflet コロプレスマップで都道府県別 / 市区町村別ヒートマップを表示
 *
 * 市区町村モード時は全国市区町村 TopoJSON をオンデマンド取得し、
 * 都道府県マップと同じ日本地図上で切り替えて表示する。
 */

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import dynamic from "next/dynamic";

import { Skeleton } from "@stats47/components/atoms/ui/skeleton";


import { ChartPanel } from "@/components/charts/ChartPanel";

import type { AreaType } from "@/features/area";
import { MapFallback } from "@/features/map-visualization/components/MapFallback";
import {
  filterMapDataPoints,
  getLeafletBorderColor,
  rankingItemToMapConfig,
} from "@/features/map-visualization/utils/ranking-map-adapters";
import { useThemedLeafletTile } from "@/features/map-visualization/utils/use-themed-leaflet-tile";

import { useTheme } from "@/hooks/useTheme";

import { fetchCityTopologyAction } from "../../actions/fetch-city-topology";

import type { RankingItem, RankingValue } from "@stats47/ranking";
import type { StatsSchema, TopoJSONTopology } from "@stats47/types";

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
interface Props {
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
  /** カードタイトル（省略時: コロプレスマップ） */
  cardTitle?: string;
  /** カードサブタイトル（出典等） */
  cardSubtitle?: string;
  /** カード下部に表示するコンテンツ（出典等） */
  cardFooter?: React.ReactNode;
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
  cardTitle,
  cardSubtitle,
  cardFooter,
  onPrefectureClick,
  headerActions,
}: Props) {
  const { theme } = useTheme();
  const { currentTile, setCurrentTile, isDark } = useThemedLeafletTile(theme);

  const mapConfig = useMemo(() => rankingItemToMapConfig(rankingItem), [rankingItem]);

  // areaCode=00000（全国合計）と value=null を除外（型ガードで MapDataPoint[] に絞り込む）
  const filteredData = useMemo(() => {
    return filterMapDataPoints(rankingValues);
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
    <ChartPanel
      title={cardTitle}
      description={cardSubtitle}
      action={headerActions}
      footer={cardFooter}
    >
      <div className="relative w-full overflow-hidden rounded-md">
        {isMapLoading ? (
          <Skeleton className="h-[500px] w-full rounded-md" />
        ) : activeTopology === null ? (
          <MapFallback
            message={
              areaType === "city" && cityTopologyError
              ? "市区町村の地図データを読み込めませんでした"
              : "地図を読み込めませんでした"
            }
          />
        ) : (
          <>
            {/* SR-only summary: 地図の代替テキスト (a11y + SEO) */}
            <p className="sr-only">
              {rankingItem.title}の{areaType === "city" ? "市区町村別" : "都道府県別"}カラーマップ。
              値が高いほど濃い色で表示されます。詳細データは下のテーブルを参照してください。
            </p>
            <div
              role="img"
              aria-label={`${rankingItem.title}の${areaType === "city" ? "市区町村" : "都道府県"}別カラーマップ`}
            >
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
                borderColor={getLeafletBorderColor(theme)}
                className="h-[500px]"
                valueDisplay={rankingItem.valueDisplay ?? undefined}
                showNoDataLabel={areaType === "prefecture" && filteredData.length < 47}
              />
            </div>
            <TileSwitcher onTileChange={setCurrentTile} isDark={isDark} />
          </>
        )}
      </div>
    </ChartPanel>
  );
}
