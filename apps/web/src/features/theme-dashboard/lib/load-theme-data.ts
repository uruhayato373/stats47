import "server-only";

import {
  fetchFormattedStats,
  type GetStatsDataParams,
} from "@stats47/estat-api/server";
import { fetchPrefectureTopology, fetchAllCitiesTopology } from "@stats47/gis/geoshape";
import {
  fetchRankingValuesFromSource,
  filterOutNationalArea,
  filterToNational,
  rankByValue,
  readRankingItemFromR2,
  readRankingValuesFromR2,
} from "@stats47/ranking/server";
import { isOk, type AreaType, type TopoJSONTopology } from "@stats47/types";


import { getEstatCacheStorage } from "@/components/stat-charts/server";

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
): Promise<{ values: RankingValue[]; nationalValue?: number }> {
  const { sourceConfig, calculation } = rankingItem;

  // 計算型アイテムは既存ロジックに委譲（全国行は持たないため nationalValue は無し）
  if (calculation?.isCalculated) {
    const values = await fetchRankingValuesFromSource(rankingItem, yearCode);
    return { values };
  }

  if (!sourceConfig?.statsDataId) return { values: [] };

  // cdTimeFrom/cdTimeTo を指定せず全年度を一括取得し、R2 キャッシュを共有する
  const params: GetStatsDataParams = {
    ...(sourceConfig as GetStatsDataParams),
  };

  const storage = await getEstatCacheStorage();
  const rawData = await fetchFormattedStats(params, storage);

  // 全国値 (areaCode "00000") を対象年度で抽出（filterOutNationalArea の逆）
  const nationalRow = filterToNational(rawData).find(
    (d) => d.yearCode === yearCode,
  );
  const nationalValue =
    typeof nationalRow?.value === "number" ? nationalRow.value : undefined;

  const filteredData = filterOutNationalArea(rawData)
    .filter((d) => d.yearCode === yearCode);
  if (filteredData.length === 0) return { values: [], nationalValue };

  return { values: rankByValue(filteredData) as RankingValue[], nationalValue };
}

/**
 * テーマダッシュボード用のデータを一括取得
 *
 * 全指標の RankingItem 定義 + e-Stat API データ + TopoJSON を並列取得し、
 * indicatorDataMap として返す。
 * tabIndicators がある場合はそのキーもマージして取得する。
 *
 * areaType="city" 指定時:
 *   - R2 の per-key values.json を読み込み (e-Stat 直接取得はしない)
 *   - city 用 municipality topology を使用
 */
export async function loadThemeData(
  theme: ThemeConfig,
  options?: { areaType?: AreaType },
): Promise<ThemePageData | null> {
  const areaType: AreaType = options?.areaType ?? "prefecture";

  // tabIndicators のキーと rankingKeys をマージ（重複排除）
  const tabKeys = theme.tabIndicators?.map((t) => t.rankingKey) ?? [];
  const allKeys = [...new Set([...theme.rankingKeys, ...tabKeys])];

  // 1. 全指標の RankingItem 定義を並列取得
  const rankingItemResults = await Promise.all(
    allKeys.map((key) =>
      readRankingItemFromR2(key, areaType).catch((error) => {
        logger.error({ error, key, areaType }, "テーマダッシュボード: RankingItem取得失敗");
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
  const topologyPromise =
    areaType === "city"
      ? fetchAllCitiesTopology().catch((error) => {
          logger.error({ error }, "テーマダッシュボード: city topology取得失敗");
          return null;
        })
      : fetchPrefectureTopology().catch((error) => {
          logger.error({ error }, "テーマダッシュボード: topology取得失敗");
          return null;
        });

  const valuesPromises = validItems.map(({ key, item }) => {
    const yearCode = item.latestYear?.yearCode;
    if (!yearCode)
      return Promise.resolve({
        key,
        values: [] as RankingValue[],
        nationalValue: undefined as number | undefined,
      });

    // city: R2 から直接読む (e-Stat 経由しない。全国行は無いため平均にフォールバック)
    if (areaType === "city") {
      return readRankingValuesFromR2(key, "city", yearCode)
        .then((result) => {
          const values = isOk(result) ? result.data : [];
          return { key, values, nationalValue: undefined as number | undefined };
        })
        .catch((error) => {
          logger.error({ error, key, yearCode }, "テーマダッシュボード: city values 取得失敗");
          return { key, values: [] as RankingValue[], nationalValue: undefined as number | undefined };
        });
    }

    // prefecture: 既存ロジック (e-Stat fetch + ランク計算 + 全国値)
    return fetchIndicatorValues(item, yearCode)
      .then(({ values, nationalValue }) => ({ key, values, nationalValue }))
      .catch((error) => {
        logger.error({ error, key }, "テーマダッシュボード: e-Stat データ取得失敗");
        return { key, values: [] as RankingValue[], nationalValue: undefined as number | undefined };
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
        nationalValue: valResult?.nationalValue,
      };
    }
  }

  if (Object.keys(indicatorDataMap).length === 0) return null;

  return { indicatorDataMap, topology };
}
