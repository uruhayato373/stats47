"use client";

/**
 * ランキングの地図。都道府県・全国の市区町村・県内の市区町村・市の行政区を同じ SVG の部品で描く。
 * 形データは同一 origin の静的ファイルを client で取る (RSC payload に載せない)。
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

import { ChartPanel } from "@stats47/components";
import { Skeleton } from "@stats47/components/atoms/ui/skeleton";
import { formatUnitForDisplay } from "@stats47/data-configs/unit";
import { colorViewOf, colorViewsFor, withColorView, type StatsSchema, type TopoJSONTopology } from "@stats47/types";
import { Map as MapIcon } from "lucide-react";


import { ChartEmptyState } from "@/components/charts/ChartState";
import { fetchTopology } from "@/components/charts/geo-topology";
import { SingleSelectToggleGroup } from "@/components/molecules/SingleSelectToggleGroup";

import type { AreaType } from "@/features/area";
import {
  filterMapDataPoints,
  getLeafletBorderColor,
  rankingItemToMapConfig,
} from "@/features/map-visualization/client";

import { trackNavClick, trackUiInteraction, type NavSurface } from "@/lib/analytics/events";

import { useTheme } from "@/hooks/useTheme";


import { buildMapShapes } from "./map-shapes";

import type { RankingItem, RankingValue } from "@stats47/ranking";
import type { Topology } from "topojson-specification";


import { NATIONAL_CITY_TOPOJSON_PATH, PREFECTURE_SVG_TOPOJSON_PATH } from "@/constants/static-assets";
import { TOKYO_ISLAND_EXCLUDE_CODES } from "@/constants/tokyo-islands";

// 地図に要る d3-zoom をページの初期の JS に載せない
const RankingSvgMap = dynamic(() => import("./RankingSvgMap").then((mod) => mod.RankingSvgMap), {
  ssr: false,
  loading: () => <Skeleton className="h-full min-h-[200px] w-full rounded-none" />,
});

/**
 * RankingMapCardのProps型定義
 */
interface Props {
  /** ランキング項目情報（色スキーム設定を含む）。題名・単位・表示設定・値の表示だけを使う */
  rankingItem: Pick<RankingItem, "title" | "unit" | "visualization" | "valueDisplay">;
  /** ランキングデータ (地域コード・値・名前があればよい。市区町村のランキングの値もそのまま渡せる) */
  rankingValues: ReadonlyArray<Pick<StatsSchema | RankingValue, "areaCode" | "value"> & { areaName?: string }>;
  /** 地域タイプ */
  areaType: AreaType;
  /** 選択中の都道府県コード */
  selectedPrefectureCode?: string | null;
  /** 都道府県クリック時のコールバック */
  onPrefectureClick?: (code: string | null) => void;
  /** CardHeader右側に表示するアクション要素 */
  headerActions?: React.ReactNode;
  /** カードタイトル（省略時は見出しなし） */
  cardTitle?: string;
  /** カードサブタイトル（出典等） */
  cardSubtitle?: string;
  /** カード下部に表示するコンテンツ（出典等） */
  cardFooter?: React.ReactNode;
  /** カードの枠を付けずに地図だけを描く (表と 1 枚の枠に並べるランキングページ用) */
  bare?: boolean;
  /** 渡した形 (topology) が全国の形。沖縄を日本海側へ移す */
  fitNationwide?: boolean;
  /** 地図の見方 (連続 / 分布) の切り替えを出す。形が少ない行政区の地図には出さない */
  colorViewSwitch?: boolean;
  /** 地図の高さのクラス。既定は 500px 固定 (枠の中の高さは親に合わせる)。bare で並べるときは親の高さに合わせる (h-full) */
  mapClassName?: string;
  /**
   * 地図の形を外から渡す (1 県の市区町村・1 市の行政区)。渡すと取得はしない。範囲はこの形に合わせる。
   * 市区町村の地図と表をランキングと同じ部品で描くため (2026-10-30。旧: 市区町村専用の D3 の地図)
   */
  topology?: TopoJSONTopology | null;
  /** 描かない地域のコード (東京の島しょ部など遠い島) */
  fitExcludeCodes?: readonly string[];
  /** 地域を押したときに移る先 (コード → URL)。無い地域は押しても移らない */
  areaHrefs?: Readonly<Record<string, string>>;
  /** 移るときのクリック計測の導線名 */
  navSurface?: NavSurface;
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
  bare = false,
  fitNationwide = false,
  colorViewSwitch = false,
  mapClassName = "h-[500px]",
  topology: providedTopology,
  fitExcludeCodes,
  areaHrefs,
  navSurface,
}: Props) {
  const router = useRouter();
  const { theme } = useTheme();

  const baseConfig = useMemo(() => rankingItemToMapConfig(rankingItem), [rankingItem]);
  // 読者が選ぶまでは配色の台帳の判定で塗る
  const [chosenView, setChosenView] = useState<string | null>(null);
  const mapConfig = useMemo(() => withColorView(baseConfig, chosenView), [baseConfig, chosenView]);
  const colorViews = colorViewSwitch ? colorViewsFor(baseConfig) : [];

  // areaCode=00000（全国合計）と value=null を除外（型ガードで MapDataPoint[] に絞り込む）
  const filteredData = useMemo(() => {
    return filterMapDataPoints([...rankingValues]);
  }, [rankingValues]);

  // 形データは外から渡されなければ自分で取る。市区町村の形は切り替えられたときに初めて読む
  const fallbackPath = areaType === "city" ? NATIONAL_CITY_TOPOJSON_PATH : PREFECTURE_SVG_TOPOJSON_PATH;
  const [fetched, setFetched] = useState<{ path: string; topology: Topology | null } | null>(null);

  useEffect(() => {
    if (providedTopology !== undefined || fetched?.path === fallbackPath) return;
    let cancelled = false;
    fetchTopology(fallbackPath)
      .then((topology) => {
        if (!cancelled) setFetched({ path: fallbackPath, topology });
      })
      .catch(() => {
        if (!cancelled) setFetched({ path: fallbackPath, topology: null });
      });
    return () => {
      cancelled = true;
    };
  }, [providedTopology, fallbackPath, fetched]);

  const activeTopology =
    providedTopology !== undefined
      ? (providedTopology as unknown as Topology | null)
      : fetched?.path === fallbackPath
        ? fetched.topology
        : undefined;
  const showFallback = activeTopology === null;
  const mapShapes = useMemo(
    () =>
      activeTopology
        ? buildMapShapes(activeTopology, {
            level: areaType === "city" ? "city" : "prefecture",
            // 渡された形は県や市の地図。取得した形か全国の形だけ、沖縄を日本海側へ移す
            national: providedTopology === undefined || fitNationwide,
            excludeCodes: fitExcludeCodes ?? (areaType === "city" ? TOKYO_ISLAND_EXCLUDE_CODES : undefined),
          })
        : null,
    [activeTopology, areaType, providedTopology, fitNationwide, fitExcludeCodes],
  );

  // 都道府県クリック時のトグル動作
  const handlePrefectureClick = useCallback((code: string) => {
    onPrefectureClick?.(code === selectedPrefectureCode ? null : code);
  }, [onPrefectureClick, selectedPrefectureCode]);

  // 地域を押したら移る (市区町村の地図から市区町村のページへ)。計測に失敗しても移る
  const handleAreaNavigate = useCallback((code: string) => {
    const href = areaHrefs?.[code];
    if (!href) return;
    if (navSurface) {
      try {
        trackNavClick({
          label: filteredData.find((point) => point.areaCode === code)?.areaName ?? code,
          href,
          surface: navSurface,
        });
      } catch {
        // 計測の失敗で遷移を止めない
      }
    }
    router.push(href);
  }, [areaHrefs, navSurface, filteredData, router]);

  const body = (
      // isolate で地図の上の操作部品の重なりをこの枠の中に閉じ込める
      <div className="relative isolate z-0 h-full w-full overflow-hidden">
        {showFallback ? (
          <ChartEmptyState
            height={null}
            className="min-h-[200px]"
            message={
              areaType === "city"
              ? "市区町村の地図データを読み込めませんでした"
              : "地図データを読み込めませんでした"
            }
          />
        ) : (
          <>
            {/* SR-only summary: 地図の代替テキスト (a11y + SEO) */}
            <p className="sr-only">
              {rankingItem.title}の{areaType === "city" ? "市区町村別" : "都道府県別"}カラーマップ。
              値が高いほど濃い色で表示されます。詳細データは表を参照してください。
            </p>
            {/* role="img" は子を装飾扱いにするため、操作できる地図 (ズーム・県クリック) を
                包むと axe nested-interactive になる。操作可能な図は figure で名前だけ与える。 */}
            <div
              role="figure"
              className={mapClassName}
              aria-label={`${rankingItem.title}の${areaType === "city" ? "市区町村" : "都道府県"}別カラーマップ`}
            >
              {mapShapes ? (
                <RankingSvgMap
                  {...mapShapes}
                  data={filteredData}
                  colorConfig={mapConfig}
                  unit={formatUnitForDisplay(rankingItem.unit)}
                  decimalPlaces={rankingItem.valueDisplay?.decimalPlaces}
                  borderColor={getLeafletBorderColor(theme)}
                  selectedCode={areaType === "prefecture" ? selectedPrefectureCode : undefined}
                  onAreaClick={areaHrefs ? handleAreaNavigate : areaType === "prefecture" ? handlePrefectureClick : undefined}
                />
              ) : (
                <Skeleton className="h-full min-h-[200px] w-full rounded-none" />
              )}
            </div>
            {colorViews.length > 0 && (
              <SingleSelectToggleGroup
                aria-label="地図の塗り方"
                value={colorViewOf(mapConfig)?.id ?? ""}
                options={colorViews.map(view => ({ value: view.id, label: view.label, title: view.description }))}
                onValueChange={(next) => {
                  setChosenView(next);
                  trackUiInteraction({ action: "color_view_change", target: "map" });
                }}
                className="absolute left-2 top-2 z-500 bg-background/90 backdrop-blur-xs"
              />
            )}
          </>
        )}
      </div>
  );

  if (bare) return body;

  return (
    <ChartPanel
      title={cardTitle}
      icon={cardTitle ? <MapIcon /> : undefined}
      description={cardSubtitle}
      action={headerActions}
      footer={cardFooter}
      // 地図は本文の四辺とも端まで描く: 横は px-0!、上下は Card の gap-4 / pb-4 を外して見出しの下線と
      // 出典の上線 (無ければカードの下端) に接する (lyra の .cn-card はレイヤーの外なので ! で上書きする)
      className="gap-0! pb-0!"
      contentClassName="px-0!"
    >
      {body}
    </ChartPanel>
  );
}
