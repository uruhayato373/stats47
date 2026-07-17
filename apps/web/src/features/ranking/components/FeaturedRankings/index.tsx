import Link from "next/link";

import { getMetricConfig, HOME_FEATURED_RANKINGS, type RankingThumbnailVariant } from "@stats47/data-configs";
import { buildRankingDisplayInfo, deriveHomeFeaturedValues } from "@stats47/ranking";
import { readRankingValuesFromR2 } from "@stats47/ranking/server";
import { isOk } from "@stats47/types";
import { generateMiniTileSvg } from "@stats47/visualization/server";

import { SHELL_WIDTH_CLASS } from "@/components/layout/PageShell";

import { logger } from "@/lib/logger";

import { getFeaturedRankings } from "../../server";
import {
  needsHomeFeaturedValuesFetch,
  resolveHomeFeaturedEditorial,
  type HomeFeaturedSnapshotFields,
} from "../../utils/resolve-home-featured-card";
import { resolveRankingThumbnailVariant } from "../../utils/resolve-thumbnail-variant";
import {
  FeaturedRankingExperimentGrid,
  type HomeFeaturedGridItem,
} from "./FeaturedRankingExperimentGrid";

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
 * おすすめランキングコンポーネント (Server)
 *
 * home-featured-v1 実験 (仕様 doc 28):
 * - data 取得と control/editorial payload の解決だけをここで行い、
 *   sticky 割当・計測・描画は Client の FeaturedRankingExperimentGrid に委譲する。
 * - 新 snapshot (派生値焼き込み済み) ではランタイムの values.json 追加 fetch は 0。
 * - 旧 snapshot: 現行どおり control 用のランタイム生成にフォールバックし、editorial は
 *   payload 不足 → control 表示 (§5.4)。development のみ git TS 設定 + values fetch で
 *   in-memory 補完し editorial を QA できる (production では補完しない)。
 */
export async function FeaturedRankings({
  limit = 6,
  showHeader = true,
  thumbnailVariantDefault = "number",
}: FeaturedRankingsProps) {
  let gridItems: HomeFeaturedGridItem[] = [];

  try {
    const featuredResult = await getFeaturedRankings(limit);
    if (isOk(featuredResult) && featuredResult.data) {
      const seenKeys = new Set<string>();
      const uniqueItems = featuredResult.data.filter((item) => {
        if (seenKeys.has(item.rankingKey)) return false;
        seenKeys.add(item.rankingKey);
        return true;
      });

      const isDevelopment = process.env.NODE_ENV === "development";
      const devConfigByKey = isDevelopment
        ? new Map(HOME_FEATURED_RANKINGS.map((d) => [d.rankingKey, d]))
        : null;

      // snapshot 由来の editorial 判定材料。dev では homeFeatured を git TS 設定で補完し、
      // 旧 snapshot でも editorial variant を QA できるようにする (§5.4 の localhost 補完)。
      const effectiveFields = new Map<string, HomeFeaturedSnapshotFields>(
        uniqueItems.map((item) => {
          const devDef = devConfigByKey?.get(item.rankingKey);
          return [
            item.rankingKey,
            {
              homeFeatured:
                item.homeFeatured ??
                (devDef
                  ? { order: devDef.order, hook: devDef.hook, variant: devDef.variant }
                  : null),
              featuredTop: item.featuredTop ?? null,
              featuredBottom: item.featuredBottom ?? null,
              featuredTopThree: item.featuredTopThree ?? null,
              tileMapSvg: item.tileMapSvg ?? null,
            },
          ];
        }),
      );

      // 通常は exporter が featured.json に派生値を焼き込み済みで、ここでの values.json
      // フェッチは 0 回 (needsHomeFeaturedValuesFetch が新 snapshot で false を返すことを
      // unit test で保証)。旧 snapshot の item だけランタイム生成にフォールバックする。
      const fetchTargets = uniqueItems.filter((item) =>
        needsHomeFeaturedValuesFetch(effectiveFields.get(item.rankingKey)!, { isDevelopment }),
      );
      const fallbackValues = new Map<string, Awaited<ReturnType<typeof readRankingValuesFromR2>>>();
      if (fetchTargets.length > 0) {
        const results = await Promise.all(
          fetchTargets.map((item) => {
            const yearCode = item.availableYears?.[0]?.yearCode || item.latestYear?.yearCode || "2024";
            return readRankingValuesFromR2(item.rankingKey, "prefecture", yearCode);
          }),
        );
        fetchTargets.forEach((item, idx) => fallbackValues.set(item.rankingKey, results[idx]));
      }

      gridItems = uniqueItems.map((item) => {
        const latestYear = item.availableYears?.[0]?.yearCode || item.latestYear?.yearCode || "2024";
        const displayInfo = buildRankingDisplayInfo(item);
        const fields = effectiveFields.get(item.rankingKey)!;

        let topAreaName: string | undefined = fields.featuredTop?.areaName;
        let topValue: string | undefined = fields.featuredTop?.value ?? undefined;
        let tileMapSvg: string | undefined = fields.tileMapSvg ?? undefined;

        const valuesResult = fallbackValues.get(item.rankingKey);
        if (valuesResult && isOk(valuesResult) && valuesResult.data.length > 0) {
          // in-memory 補完 (旧 snapshot の control 用 + dev の editorial 用)。R2 へ書かない。
          const derived = deriveHomeFeaturedValues(valuesResult.data);
          fields.featuredTop = fields.featuredTop ?? derived.featuredTop;
          fields.featuredBottom = fields.featuredBottom ?? derived.featuredBottom;
          if (!fields.featuredTopThree || fields.featuredTopThree.length === 0) {
            fields.featuredTopThree = derived.featuredTopThree;
          }
          topAreaName = topAreaName ?? derived.featuredTop?.areaName;
          topValue = topValue ?? derived.featuredTop?.value ?? undefined;
          if (tileMapSvg == null) {
            tileMapSvg = generateMiniTileSvg(
              valuesResult.data.flatMap((v) => v.value !== null ? [{ areaCode: v.areaCode, value: v.value, rank: v.rank ?? undefined }] : []),
              item.visualization?.colorScheme,
              item.visualization?.isReversed,
              item.rankingKey,
            );
            fields.tileMapSvg = tileMapSvg;
          }
        }

        // control の A/B バリアント解決 (config > 表示場所既定 > map、データ欠損/長すぎは A へ戻す)。
        const controlVariant = resolveRankingThumbnailVariant({
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
          control: {
            variant: controlVariant,
            topAreaName,
            topValue,
            demographicAttr: displayInfo.demographicAttr || undefined,
            normalizationBasis: displayInfo.normalizationBasis || undefined,
            tileMapSvg,
          },
          editorial: resolveHomeFeaturedEditorial(fields),
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

  if (gridItems.length === 0) {
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
        <FeaturedRankingExperimentGrid items={gridItems} />
      </div>
    </section>
  );
}
