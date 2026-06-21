import "server-only";

import { readActiveRankingKeysFromR2 } from "@stats47/ranking/server";
import { isOk } from "@stats47/types";

import { logger } from "@/lib/logger";

import { cachedFindRankingItem } from "../lib/cached-ranking-item";
import { generateRankingPageMetaData } from "../utils";

const AREA_TYPE = "prefecture" as const;

export async function getRankingStaticParams() {
  try {
    const result = await readActiveRankingKeysFromR2(AREA_TYPE);
    if (!isOk(result)) return [];

    return result.data.map(({ rankingKey }) => ({ rankingKey }));
  } catch {
    // CI ビルド時など R2 が読めない場合は事前生成をスキップし、ISR で再生成
    return [];
  }
}

export async function getRankingPageMetadata(rankingKey: string) {
  try {
    const rankingItemResult = await cachedFindRankingItem(rankingKey, AREA_TYPE);
    const rankingItem = isOk(rankingItemResult) ? rankingItemResult.data : null;

    if (!rankingItem) {
      return {
        title: "ランキングが見つかりません",
        description: "指定されたランキングは存在しません",
        alternates: { canonical: "/ranking" },
      };
    }

    const availableYears = rankingItem.availableYears || [];
    const selectedYear = availableYears[0]?.yearCode || "";

    return generateRankingPageMetaData({
      rankingItem,
      selectedYear,
      areaType: AREA_TYPE,
    });
  } catch (error) {
    logger.error({ error }, "メタデータ生成エラー");
    return {
      title: "ランキング",
      description: "ランキング詳細ページ",
    };
  }
}
