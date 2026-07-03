import Link from "next/link";

import { buildRankingDisplayInfo } from "@stats47/ranking";
import { readRankingValuesFromR2 } from "@stats47/ranking/server";
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
 *
 * 最適化: 全47行データは tile map と rank=1 の両方で必要なため、
 * 各ランキングで1回だけ fetch し rank=1 を自前で抽出する（旧実装は
 * readTopRankingValuesBatchFromR2 で内部的に同じ fetch を重複させていた）。
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

      // 全47行データを並列で一括取得（rank=1 抽出 + tile map 生成の両用途を1フェッチで賄う）
      const allValuesResults = await Promise.all(
        uniqueItems.map((item) => {
          const yearCode = item.availableYears?.[0]?.yearCode || item.latestYear?.yearCode || "2024";
          return readRankingValuesFromR2(item.rankingKey, "prefecture", yearCode);
        }),
      );

      items = uniqueItems.map((item, idx) => {
        const latestYear = item.availableYears?.[0]?.yearCode || item.latestYear?.yearCode || "2024";
        const displayInfo = buildRankingDisplayInfo(item);
        const valuesResult = allValuesResults[idx];

        let topAreaName: string | undefined;
        let topValue: string | undefined;
        let tileMapSvg: string | undefined;

        if (isOk(valuesResult) && valuesResult.data.length > 0) {
          const top = valuesResult.data.find((v) => v.rank === 1);
          if (top) {
            topAreaName = top.areaName;
            topValue = top.value !== null ? top.value.toLocaleString("ja-JP") : undefined;
          }
          tileMapSvg = generateMiniTileSvg(
            valuesResult.data.flatMap((v) => v.value !== null ? [{ areaCode: v.areaCode, value: v.value }] : []),
            item.visualization?.colorScheme,
            item.visualization?.isReversed,
          );
        }

        return {
          rankingKey: item.rankingKey,
          title: displayInfo.title,
          latestYear,
          unit: displayInfo.unit,
          topAreaName,
          topValue,
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
    <section className="bg-muted/30 px-4 py-8 sm:px-6">
      <div>
        {showHeader && (
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold">注目のランキング</h2>
            <Link href="/ranking" className="text-sm text-primary hover:underline font-medium" aria-label="すべてのランキングを見る">
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
