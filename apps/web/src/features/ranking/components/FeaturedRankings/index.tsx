import Link from "next/link";

import { buildRankingDisplayInfo } from "@stats47/ranking";
import { listTopRankingValuesBatch } from "@stats47/ranking/server";
import { isOk } from "@stats47/types";

import { logger } from "@/lib/logger";

import { getFeaturedRankings } from "../../server";
import { FeaturedRankingCard } from "../FeaturedRankingCard";

/**
 * FeaturedRankingsのProps
 */
interface FeaturedRankingsProps {
  /** 取得件数（デフォルト: 6） */
  limit?: number;
}

/**
 * おすすめランキングコンポーネント
 *
 * おすすめランキングをカード形式で表示するサーバーコンポーネント。
 * 各ランキングの1位データを取得してカードに表示する。
 */
export async function FeaturedRankings({ limit = 6 }: FeaturedRankingsProps) {
  let items: {
    rankingKey: string;
    title: string;
    latestYear: string;
    unit: string;
    topAreaName?: string;
    topValue?: string;
    demographicAttr?: string;
    normalizationBasis?: string;
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

      // 1位データをバッチ取得（N個の個別クエリ → 1クエリ）
      const batchItems = uniqueItems.map((item) => ({
        rankingKey: item.rankingKey,
        yearCode: item.availableYears?.[0]?.yearCode || item.latestYear?.yearCode || "2024",
      }));
      const batchResult = await listTopRankingValuesBatch(batchItems, "prefecture");
      const topMap = isOk(batchResult) ? batchResult.data : new Map();

      items = uniqueItems.map((item) => {
        const latestYear = item.availableYears?.[0]?.yearCode || item.latestYear?.yearCode || "2024";
        const displayInfo = buildRankingDisplayInfo(item);
        const top = topMap.get(item.rankingKey);

        return {
          rankingKey: item.rankingKey,
          title: displayInfo.title,
          latestYear,
          unit: displayInfo.unit,
          topAreaName: top?.areaName,
          topValue: top ? top.value.toLocaleString("ja-JP") : undefined,
          demographicAttr: displayInfo.demographicAttr || undefined,
          normalizationBasis: displayInfo.normalizationBasis || undefined,
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
    <section className="py-14 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="bg-primary/10 p-2 rounded-lg text-primary">🏆</span>
            注目のランキング
          </h2>
          <Link href="/ranking" className="text-sm text-primary hover:underline font-medium">
            もっと見る &rarr;
          </Link>
        </div>
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
            />
          ))}
        </div>
      </div>
    </section>
  );
}
