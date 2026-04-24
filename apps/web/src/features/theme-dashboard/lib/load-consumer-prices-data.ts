import "server-only";

import { fetchFormattedStats, type GetStatsDataParams } from "@stats47/estat-api/server";
import { fetchPrefectureTopology } from "@stats47/gis/geoshape";


import { logger } from "@/lib/logger";

import type { ThemeConfig, ThemeIndicatorData } from "../types";
import type { ThemePageData } from "./load-theme-data";
import type { RankingItem, RankingValue } from "@stats47/ranking";
import type { StatsSchema } from "@stats47/types";

/** e-Stat statsDataId: 10大費目別消費者物価地域差指数（全国平均=100） */
const STATS_DATA_ID = "0003441258";

/** テーマで使用する品目定義 */
const CPI_INDICATORS = [
  {
    key: "cpi-overall",
    catCode: "00010",
    title: "消費者物価地域差指数（総合）",
  },
  {
    key: "cpi-overall-excl-rent",
    catCode: "00120",
    title: "消費者物価地域差指数（家賃を除く総合）",
  },
] as const;

/**
 * consumer-prices テーマ専用データローダー
 *
 * DB を使わず e-Stat API `0003441258` から直接データを取得する。
 * 返す型は `ThemePageData` で、他テーマと同じインターフェースを維持。
 */
export async function loadConsumerPricesData(
  theme: ThemeConfig
): Promise<ThemePageData | null> {
  try {
    // 1. e-Stat API から全都道府県 × 最新年 × 全品目を一括取得
    const params: GetStatsDataParams = {
      statsDataId: STATS_DATA_ID,
      cdTime: "2024000000",
    };

    const [rawData, topology] = await Promise.all([
      fetchFormattedStats(params).catch((error) => {
        logger.error({ error }, "CPI テーマ: e-Stat データ取得失敗");
        return [] as StatsSchema[];
      }),
      fetchPrefectureTopology().catch((error) => {
        logger.error({ error }, "CPI テーマ: topology取得失敗");
        return null;
      }),
    ]);

    if (rawData.length === 0) return null;

    // 2. 都道府県データのみ抽出（地方ブロック・市区町村を除外）
    const prefData = rawData.filter((d) => {
      const code = d.areaCode;
      return code !== "00000" && code.length === 5 && code.endsWith("000")
        && Number(code.slice(0, 2)) >= 1 && Number(code.slice(0, 2)) <= 47;
    });

    // 3. 品目別に indicatorDataMap を構築
    const indicatorDataMap: Record<string, ThemeIndicatorData> = {};

    for (const indicator of CPI_INDICATORS) {
      if (!theme.rankingKeys.includes(indicator.key)) continue;

      const categoryData = prefData.filter((d) => d.categoryCode === indicator.catCode);
      if (categoryData.length === 0) continue;

      // 値の降順でソートし rank を割り当て
      const sorted = [...categoryData].sort((a, b) => b.value - a.value);
      const rankingValues: RankingValue[] = sorted.map((d, i) => ({
        areaType: "prefecture" as const,
        areaCode: d.areaCode,
        areaName: d.areaName,
        yearCode: d.yearCode,
        yearName: d.yearName,
        categoryCode: indicator.key,
        categoryName: indicator.title,
        value: d.value,
        unit: "",
        rank: i + 1,
      }));

      const rankingItem = {
        rankingKey: indicator.key,
        areaType: "prefecture",
        rankingName: indicator.title,
        title: indicator.title,
        unit: "",
        isActive: true,
        dataSourceId: "estat",
        latestYear: {
          yearCode: categoryData[0].yearCode,
          yearName: categoryData[0].yearName,
        },
        sourceConfig: {
          statsDataId: STATS_DATA_ID,
          cdCat01: indicator.catCode,
        },
        visualization: {
          colorScheme: "interpolateRdYlBu",
          colorSchemeType: "diverging",
          isReversed: true,
          divergingMidpoint: 100,
          divergingMidpointValue: 100,
        },
      } as RankingItem;

      indicatorDataMap[indicator.key] = { rankingItem, rankingValues };
    }

    if (Object.keys(indicatorDataMap).length === 0) return null;

    return { indicatorDataMap, topology };
  } catch (error) {
    logger.error({ error }, "CPI テーマ: データ構築失敗");
    return null;
  }
}
