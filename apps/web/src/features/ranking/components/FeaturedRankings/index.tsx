import Link from "next/link";

import { buildRankingDisplayInfo } from "@stats47/ranking";
import { listTopRankingValuesBatch, listRankingValues } from "@stats47/ranking/server";
import { isOk } from "@stats47/types";
import { generateMiniTileSvg } from "@stats47/visualization/server";

import { logger } from "@/lib/logger";

import { getFeaturedRankings } from "../../server";
import { FeaturedRankingCard } from "../FeaturedRankingCard";

/**
 * FeaturedRankingsのProps
 */
interface FeaturedRankingsProps {
  /** 取得件数（デフォルト: 6） */
  limit?: number;
  /** ヘッダー（見出し+もっと見るリンク）を表示するか（デフォルト: true） */
  showHeader?: boolean;
}

/**
 * おすすめランキングコンポーネント
 *
 * おすすめランキングをカード形式で表示するサーバーコンポーネント。
 * 各ランキングの1位データとタイルマップSVGを生成してカードに表示する。
 */
export async function FeaturedRankings({ limit = 6, showHeader = true }: FeaturedRankingsProps) {
  let items: {
    rankingKey: string;
    title: string;
    latestYear: string;
    unit: string;
    topAreaName?: string;
    topValue?: string;
    demographicAttr?: string;
    normalizationBasis?: string;
    tileMapSvg?: string;
  }[] = [];

  try {
    const featuredResult = await getFeaturedRankings(limit);
    if (isOk(featuredResult) && featuredResult.data) {
      const seenKeys = new Set<string>();
      const uniqueItems = featuredResult.data.filter((item) => {
        if (seenKeys.has(item.rankingKey)) return false;
        seenKeys.add(item.rankingKey);
        return true;
      });

      // 1位データ + 全47件データを並列取得
      const batchItems = uniqueItems.map((item) => ({
        rankingKey: item.rankingKey,
        yearCode: item.availableYears?.[0]?.yearCode || item.latestYear?.yearCode || "2024",
      }));

      const [batchResult, ...allValuesResults] = await Promise.all([
        listTopRankingValuesBatch(batchItems, "prefecture"),
        ...uniqueItems.map((item) => {
          const yearCode = item.availableYears?.[0]?.yearCode || item.latestYear?.yearCode || "2024";
          return listRankingValues(item.rankingKey, "prefecture", yearCode);
        }),
      ]);
      const topMap = isOk(batchResult) ? batchResult.data : new Map();

      items = uniqueItems.map((item, idx) => {
        const latestYear = item.availableYears?.[0]?.yearCode || item.latestYear?.yearCode || "2024";
        const displayInfo = buildRankingDisplayInfo(item);
        const top = topMap.get(item.rankingKey);

        // タイルマップSVG生成
        const valuesResult = allValuesResults[idx];
        let tileMapSvg: string | undefined;
        if (isOk(valuesResult) && valuesResult.data.length > 0) {
          tileMapSvg = generateMiniTileSvg(
            valuesResult.data.map((v) => ({ areaCode: v.areaCode, value: v.value })),
            item.visualization?.colorScheme,
            item.visualization?.isReversed,
          );
        }

        return {
          rankingKey: item.rankingKey,
          title: displayInfo.title,
          latestYear,
          unit: displayInfo.unit,
          topAreaName: top?.areaName,
          topValue: top ? top.value.toLocaleString("ja-JP") : undefined,
          demographicAttr: displayInfo.demographicAttr || undefined,
          normalizationBasis: displayInfo.normalizationBasis || undefined,
          tileMapSvg,
        };
      });
    }
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      },
      "おすすめランキング取得エラー"
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="py-8 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        {showHeader && (
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold">注目のランキング</h2>
            <Link href="/ranking" className="text-sm text-primary hover:underline font-medium" aria-label="注目のランキングをもっと見る">
              もっと見る &rarr;
            </Link>
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {items.map((item, idx) => (
            <FeaturedRankingCard
              key={`${item.rankingKey}-${idx}`}
              rankingKey={item.rankingKey}
              title={item.title}
              latestYear={item.latestYear}
              unit={item.unit}
              topAreaName={item.topAreaName}
              topValue={item.topValue}
              demographicAttr={item.demographicAttr}
              normalizationBasis={item.normalizationBasis}
              tileMapSvg={item.tileMapSvg}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
