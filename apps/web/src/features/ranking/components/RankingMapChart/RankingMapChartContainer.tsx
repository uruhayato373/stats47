/**
 * RankingMapChartContainer - Server Component
 *
 * TopoJSONデータをサーバー側で取得し、RankingMapChartClientに渡すコンテナコンポーネント
 * Composition Patternを採用: Server Componentでデータ取得、Client ComponentでUI表示
 * 取得失敗時は topology を null で渡し、地図ブロックのみエラー表示する（ページ全体は表示したまま）
 */

import { fetchPrefectureTopology } from "@stats47/gis/geoshape";

import type { AreaType } from "@/features/area";

import { RankingMapChartClient } from "./RankingMapChartClient";

import type { RankingItem, RankingValue } from "@stats47/ranking";
import type { StatsSchema, TopoJSONTopology } from "@stats47/types";


interface RankingMapChartContainerProps {
  /** ランキング項目情報（色スキーム設定を含む） */
  rankingItem: RankingItem;
  /** ランキングデータ */
  rankingValues: (StatsSchema | RankingValue)[];
  /** 地域タイプ */
  areaType: AreaType;
}

/**
 * RankingMapChartContainer
 *
 * サーバー側でTopoJSONデータを取得し、RankingMapChartClientに渡す。
 * R2 → 外部 API のフォールバックは fetchPrefectureTopology 内で実施。取得失敗時は topology を null にしてエラー表示のみ行う。
 */
export async function RankingMapChartContainer({
  rankingItem,
  rankingValues,
  areaType,
}: RankingMapChartContainerProps) {
  let topology: TopoJSONTopology | null = null;
  try {
    topology = await fetchPrefectureTopology();
  } catch {
    topology = null;
  }

  return (
    <RankingMapChartClient
      rankingItem={rankingItem}
      rankingValues={rankingValues}
      areaType={areaType}
      topology={topology}
    />
  );
}
