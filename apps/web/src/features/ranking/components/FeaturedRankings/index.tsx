import Link from "next/link";

import { HOME_FEATURED_PROMINENCE } from "@stats47/data-configs/ranking-prominence";
import { buildRankingDisplayInfo, deriveFeaturedTop } from "@stats47/ranking";
import { readRankingValuesFromR2 } from "@stats47/ranking/server";
import { isOk } from "@stats47/types";
import { generateRankingThumbnailMapSvg } from "@stats47/visualization/server";

import { SHELL_WIDTH_CLASS } from "@/components/layout/PageShell";

import { logger } from "@/lib/logger";

// barrel (`../../server`) 経由にすると、ランキング詳細ページ一式と
// METRICS_REGISTRY が home の bundle に入る。
import { getFeaturedRankings } from "../../lib/get-featured-rankings";
import {
  isCurrentHomeFeaturedMapSvg,
  needsHomeFeaturedValuesFetch,
  resolveFeaturedRankingCardModel,
  type HomeFeaturedSnapshotFields,
} from "../../utils/resolve-featured-ranking-card";

import {
  FeaturedRankingGrid,
  type FeaturedRankingGridItem,
} from "./FeaturedRankingGrid";

/**
 * FeaturedRankingsのProps
 */
interface FeaturedRankingsProps {
  /** 取得件数（デフォルト: 6） */
  limit?: number;
  /** ヘッダー（見出し+もっと見るリンク）を表示するか（デフォルト: true） */
  showHeader?: boolean;
  /** home 2ペイン内へ外枠なしで埋め込む。 */
  embedded?: boolean;
  /** home 専用の impression / click 計測を有効にする。home 以外では false。 */
  trackHomeEvents?: boolean;
}

/**
 * おすすめランキングコンポーネント (Server)
 *
 * home-featured-v1 終了後の単一カード表示:
 * - data 取得と共通card modelの解決だけをここで行い、
 *   計測・描画はFeaturedRankingGridに委譲する。
 * - 新 snapshot (派生値焼き込み済み) ではランタイムの values.json 追加 fetch は 0。
 * - 旧snapshotのタイル地図はvaluesから地理地図へin-memory移行する。
 */
export async function FeaturedRankings({
  limit = 6,
  showHeader = true,
  embedded = false,
  trackHomeEvents = true,
}: FeaturedRankingsProps) {
  let gridItems: FeaturedRankingGridItem[] = [];

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
        ? new Map(HOME_FEATURED_PROMINENCE.map((d) => [d.rankingKey, d]))
        : null;

      // snapshot由来のcard model材料。devではhookをgit TS設定で補完する。
      const effectiveFields = new Map<string, HomeFeaturedSnapshotFields>(
        uniqueItems.map((item) => {
          const devDef = devConfigByKey?.get(item.rankingKey);
          // 旧世代 (タイル地図・未圧縮の巨大path) は破棄し、下で compact 版を再生成する。
          // 破棄条件は needsHomeFeaturedValuesFetch と同じ述語を使う。
          const tileMapSvg = isCurrentHomeFeaturedMapSvg(item.tileMapSvg)
            ? item.tileMapSvg
            : null;
          return [
            item.rankingKey,
            {
              homeFeatured:
                (devDef
                  ? { order: devDef.order, hook: devDef.hook }
                  : item.homeFeatured ?? null),
              featuredTop: item.featuredTop ?? null,
              tileMapSvg,
            },
          ];
        }),
      );

      // 通常は exporter が featured.json に派生値を焼き込み済みで、ここでの values.json
      // フェッチは 0 回 (needsHomeFeaturedValuesFetch が新 snapshot で false を返すことを
      // unit test で保証)。旧 snapshot の item だけランタイム生成にフォールバックする。
      const fetchTargets = uniqueItems.filter((item) =>
        needsHomeFeaturedValuesFetch(effectiveFields.get(item.rankingKey)!),
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

      gridItems = uniqueItems.flatMap((item) => {
        const latestYear = item.availableYears?.[0]?.yearCode || item.latestYear?.yearCode || "2024";
        const displayInfo = buildRankingDisplayInfo(item);
        const fields = effectiveFields.get(item.rankingKey)!;

        let tileMapSvg: string | undefined = fields.tileMapSvg ?? undefined;

        const valuesResult = fallbackValues.get(item.rankingKey);
        if (valuesResult && isOk(valuesResult) && valuesResult.data.length > 0) {
          // 旧snapshotのin-memory補完。R2へは書かない。
          fields.featuredTop =
            fields.featuredTop ?? deriveFeaturedTop(valuesResult.data);
          if (tileMapSvg == null) {
            tileMapSvg = generateRankingThumbnailMapSvg(
              valuesResult.data.flatMap((v) => v.value !== null ? [{ areaCode: v.areaCode, value: v.value, rank: v.rank ?? undefined }] : []),
              {
                colorScheme: item.visualization?.colorScheme,
                isReversed: item.visualization?.isReversed,
                idSuffix: item.rankingKey,
              },
            );
            fields.tileMapSvg = tileMapSvg;
          }
        }

        const model = resolveFeaturedRankingCardModel(
          {
            definition: fields.homeFeatured,
            featuredTop: fields.featuredTop,
            tileMapSvg: fields.tileMapSvg,
          },
          displayInfo.title,
        );
        if (!model) return [];

        return [{
          rankingKey: item.rankingKey,
          latestYear,
          unit: displayInfo.unit,
          model,
        }];
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

  const content = (
    <>
      {showHeader && (
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-lg font-bold">注目のランキング</h2>
          <Link
            href="/ranking"
            className="text-sm font-medium text-primary hover:underline"
            aria-label="すべてのランキングを見る"
          >
            もっと見る &rarr;
          </Link>
        </div>
      )}
      <FeaturedRankingGrid
        items={gridItems}
        compact={embedded}
        trackHomeEvents={trackHomeEvents}
      />
    </>
  );

  if (embedded) {
    return <div>{content}</div>;
  }

  return (
    <section className="bg-muted/30 py-8">
      {/* 背景バンドは全幅、コンテンツは shell 幅 (1280px) に整列 */}
      <div className={SHELL_WIDTH_CLASS}>{content}</div>
    </section>
  );
}
