"use client";

/**
 * ランキングマップ表示コンポーネント
 * Leaflet コロプレスマップで都道府県別 / 市区町村別ヒートマップを表示
 *
 * 都道府県 / 市区町村とも TopoJSON はクライアントでオンデマンド取得する。
 *
 * 都道府県 TopoJSON をサーバーから props で受け取っていた頃は、1,015,004 bytes が
 * RSC payload へ直列化され ranking HTML 1,232,628 bytes の約 82% を占めていた
 * (2026-08-05 実測)。地図本体は `next/dynamic` の ssr:false なのでサーバーでは
 * 一度も描画されず、この 1MB は hydration まで使われない純粋な無駄だった。
 * 同一 origin の静的アセット `/prefecture.topojson` を fetch する形へ移す
 * (前例: theme-dashboard の MetricYoyChoroplethSection)。
 */

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import dynamic from "next/dynamic";

import { Skeleton } from "@stats47/components/atoms/ui/skeleton";


import { ChartPanel } from "@/components/charts/ChartPanel";

import type { AreaType } from "@/features/area";
import {
  filterMapDataPoints,
  getLeafletBorderColor,
  MapFallback,
  rankingItemToMapConfig,
  useThemedLeafletTile,
} from "@/features/map-visualization/client";

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

/** 同一 origin の静的アセット (apps/web/public/prefecture.topojson) */
const PREFECTURE_TOPOJSON_URL = "/prefecture.topojson";

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

  // --- 都道府県 TopoJSON のオンデマンド取得 ---
  // 同一 origin の静的アセット。ETag による 304 が効くので 2 回目以降は実体を運ばない。
  const [prefTopology, setPrefTopology] = useState<TopoJSONTopology | null>(null);
  const [prefTopologyError, setPrefTopologyError] = useState(false);

  useEffect(() => {
    if (prefTopology || prefTopologyError) return;
    let cancelled = false;
    fetch(PREFECTURE_TOPOJSON_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<TopoJSONTopology>;
      })
      .then((data) => {
        if (!cancelled) setPrefTopology(data);
      })
      .catch(() => {
        if (!cancelled) setPrefTopologyError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [prefTopology, prefTopologyError]);

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
  const activeTopology = areaType === "city" ? cityTopology : prefTopology;
  // 取得中に「読み込めませんでした」を出さない。失敗が確定して初めて fallback へ落とす
  const isMapLoading =
    (areaType === "city" && isCityTopologyLoading) ||
    (areaType !== "city" && !prefTopology && !prefTopologyError);

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
              : "地図データを読み込めませんでした"
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
