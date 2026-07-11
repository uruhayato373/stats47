import "server-only";

import { isOk } from "@stats47/types";

import { logger } from "@/lib/logger";

import { cachedFindRankingItem } from "../lib/cached-ranking-item";
import { generateRankingPageMetaData } from "../utils";

const AREA_TYPE = "prefecture" as const;

// NOTE: getRankingStaticParams は 2026-07-11 (DR-AUDIT-07) に削除した。
// R2 依存の動的 route に generateStaticParams を付けると build 時 R2 不可で
// notFound prerender が永久固着する (.claude/rules/nextjs-ssg-preservation.md)。
// ranking は ƒ オンデマンド ISR (revalidate のみ) が正。

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
