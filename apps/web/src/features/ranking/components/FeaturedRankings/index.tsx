import Link from "next/link";

import { getMetricConfig, type RankingThumbnailVariant } from "@stats47/data-configs";
import { buildRankingDisplayInfo } from "@stats47/ranking";
import { readRankingValuesFromR2 } from "@stats47/ranking/server";
import { isOk } from "@stats47/types";
import { generateMiniTileSvg } from "@stats47/visualization/server";

import { SHELL_WIDTH_CLASS } from "@/components/layout/PageShell";

import { logger } from "@/lib/logger";

import { getFeaturedRankings } from "../../server";
import { resolveRankingThumbnailVariant } from "../../utils/resolve-thumbnail-variant";
import { FeaturedRankingCard } from "../FeaturedRankingCard";

/**
 * FeaturedRankingsのProps
 */
interface FeaturedRankingsProps {
  /** 取得件数（デフォルト: 6） */
  limit?: number;
  /** ヘッダー（見出し+もっと見るリンク）を表示するか（デフォルト: true） */
  showHeader?: boolean;
  /**
   * この表示場所のサムネイル既定バリアント。home 注目ランキングは "number"（数値型）。
   * metric config の thumbnailVariant がある指標はそちらが優先される。
   * 正典(A/B解決規則): apps/web/src/features/ranking/utils/resolve-thumbnail-variant.ts
   */
  thumbnailVariantDefault?: RankingThumbnailVariant;
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
export async function FeaturedRankings({
  limit = 6,
  showHeader = true,
  thumbnailVariantDefault = "number",
}: FeaturedRankingsProps) {
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
    variant?: RankingThumbnailVariant;
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

      // 通常は exporter が featured.json に「1位」表示とタイルマップ SVG を焼き込み済み
      // (item.tileMapSvg あり) なので、ここでの values.json フェッチ・SVG 生成は 0 回。
      // 旧 featured.json (未焼き込み) の item だけランタイム生成にフォールバックする。
      const unbakedItems = uniqueItems.filter((item) => item.tileMapSvg == null);
      const fallbackValues = new Map<string, Awaited<ReturnType<typeof readRankingValuesFromR2>>>();
      if (unbakedItems.length > 0) {
        const results = await Promise.all(
          unbakedItems.map((item) => {
            const yearCode = item.availableYears?.[0]?.yearCode || item.latestYear?.yearCode || "2024";
            return readRankingValuesFromR2(item.rankingKey, "prefecture", yearCode);
          }),
        );
        unbakedItems.forEach((item, idx) => fallbackValues.set(item.rankingKey, results[idx]));
      }

      items = uniqueItems.map((item) => {
        const latestYear = item.availableYears?.[0]?.yearCode || item.latestYear?.yearCode || "2024";
        const displayInfo = buildRankingDisplayInfo(item);

        let topAreaName: string | undefined;
        let topValue: string | undefined;
        let tileMapSvg: string | undefined;

        if (item.tileMapSvg != null) {
          // ビルド時に焼き込み済み: ランタイムフェッチ・SVG 生成なし
          topAreaName = item.featuredTop?.areaName;
          topValue = item.featuredTop?.value ?? undefined;
          tileMapSvg = item.tileMapSvg;
        } else {
          // 後方互換フォールバック: 旧 featured.json はランタイムで生成
          const valuesResult = fallbackValues.get(item.rankingKey);
          if (valuesResult && isOk(valuesResult) && valuesResult.data.length > 0) {
            const top = valuesResult.data.find((v) => v.rank === 1);
            if (top) {
              topAreaName = top.areaName;
              topValue = top.value !== null ? top.value.toLocaleString("ja-JP") : undefined;
            }
            tileMapSvg = generateMiniTileSvg(
              valuesResult.data.flatMap((v) => v.value !== null ? [{ areaCode: v.areaCode, value: v.value, rank: v.rank ?? undefined }] : []),
              item.visualization?.colorScheme,
              item.visualization?.isReversed,
              item.rankingKey,
            );
          }
        }

        // A/B バリアント解決 (config > 表示場所既定 > map、データ欠損/長すぎは A へ戻す)。
        const variant = resolveRankingThumbnailVariant({
          configVariant: getMetricConfig(item.rankingKey)?.thumbnailVariant,
          locationDefault: thumbnailVariantDefault,
          topAreaName,
          topValue,
        });

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
          variant,
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
    <section className="bg-muted/30 py-8">
      {/* 背景バンドは全幅、コンテンツは shell 幅 (1280px) に整列 */}
      <div className={SHELL_WIDTH_CLASS}>
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
              variant={item.variant}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
