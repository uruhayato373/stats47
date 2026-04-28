import "server-only";

import {
  fetchFormattedStats,
  type GetStatsDataParams,
} from "@stats47/estat-api/server";
import { fetchPrefectureTopology } from "@stats47/gis/geoshape";
import {
  fetchRankingValuesFromSource,
  filterOutNationalArea,
  rankByValue,
  readRankingItemFromR2,
} from "@stats47/ranking/server";
import { isOk, type TopoJSONTopology } from "@stats47/types";


import { getEstatCacheStorage } from "@/features/stat-charts/server";

import { logger } from "@/lib/logger";

import type { ThemeConfig, ThemeIndicatorData } from "../types";
import type { RankingItem, RankingValue } from "@stats47/ranking";

export interface ThemePageData {
  indicatorDataMap: Record<string, ThemeIndicatorData>;
  topology: TopoJSONTopology | null;
}

/**
 * e-Stat API（R2キャッシュ優先）から指標データを取得する。
 * cdArea/cdTime 指定なしで全都道府県・全年度を一括取得し、キャッシュ効率を最大化する。
 *
 * 計算型アイテムは fetchRankingValuesFromSource に委譲する。
 */
async function fetchIndicatorValues(
  rankingItem: RankingItem,
  yearCode: string,
): Promise<RankingValue[]> {
  const { sourceConfig, calculation } = rankingItem;

  // 計算型アイテムは既存ロジックに委譲
  if (calculation?.isCalculated) {
    return fetchRankingValuesFromSource(rankingItem, yearCode);
  }

  if (!sourceConfig?.statsDataId) return [];

  // cdTimeFrom/cdTimeTo を指定せず全年度を一括取得し、R2 キャッシュを共有する
  const params: GetStatsDataParams = {
    ...(sourceConfig as GetStatsDataParams),
  };

  const storage = await getEstatCacheStorage();
  const rawData = await fetchFormattedStats(params, storage);
  const filteredData = filterOutNationalArea(rawData)
    .filter((d) => d.yearCode === yearCode);
  if (filteredData.length === 0) return [];

  return rankByValue(filteredData) as RankingValue[];
}

/**
 * テーマダッシュボード用のデータを一括取得
 *
 * 全指標の RankingItem 定義 + e-Stat API データ + TopoJSON を並列取得し、
 * indicatorDataMap として返す。
 * tabIndicators がある場合はそのキーもマージして取得する。
 */
export async function loadThemeData(
  theme: ThemeConfig
): Promise<ThemePageData | null> {
  // tabIndicators のキーと rankingKeys をマージ（重複排除）
  const tabKeys = theme.tabIndicators?.map((t) => t.rankingKey) ?? [];
  const allKeys = [...new Set([...theme.rankingKeys, ...tabKeys])];

  // 1. 全指標の RankingItem 定義を並列取得
  const rankingItemResults = await Promise.all(
    allKeys.map((key) =>
      readRankingItemFromR2(key, "prefecture").catch((error) => {
        logger.error({ error, key }, "テーマダッシュボード: RankingItem取得失敗");
        return null;
      })
    )
  );

  const validItems: { key: string; item: RankingItem }[] = [];
  for (let i = 0; i < allKeys.length; i++) {
    const result = rankingItemResults[i];
    if (result && isOk(result) && result.data) {
      validItems.push({ key: allKeys[i], item: result.data });
    }
  }

  if (validItems.length === 0) return null;

  // 2. 全指標のデータ + TopoJSON を並列取得
  const topologyPromise = fetchPrefectureTopology().catch((error) => {
    logger.error({ error }, "テーマダッシュボード: topology取得失敗");
    return null;
  });

  const valuesPromises = validItems.map(({ key, item }) => {
    const yearCode = item.latestYear?.yearCode;
    if (!yearCode)
      return Promise.resolve({ key, values: [] as RankingValue[] });
    return fetchIndicatorValues(item, yearCode)
      .then((values) => ({ key, values }))
      .catch((error) => {
        logger.error({ error, key }, "テーマダッシュボード: e-Stat データ取得失敗");
        return { key, values: [] as RankingValue[] };
      });
  });

  const [topology, ...valuesResults] = await Promise.all([
    topologyPromise,
    ...valuesPromises,
  ]);

  // 3. indicatorDataMap を構築（availableYears を含む）
  const indicatorDataMap: Record<string, ThemeIndicatorData> = {};
  for (const { key, item } of validItems) {
    const valResult = valuesResults.find((v) => v.key === key);
    const values = valResult?.values ?? [];
    if (values.length > 0) {
      indicatorDataMap[key] = {
        rankingItem: item,
        rankingValues: values,
        availableYears: item.availableYears ?? [],
      };
    }
  }

  if (Object.keys(indicatorDataMap).length === 0) return null;

  return { indicatorDataMap, topology };
}
