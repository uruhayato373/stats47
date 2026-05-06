import "server-only";

import { getDrizzle, metrics } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { saveToR2 } from "@stats47/r2-storage/server";

import { parseRankingItemDB } from "../repositories/schemas/ranking-items.schemas";
import { metricAsRankingItemSelection } from "../repositories/shared/metric-as-ranking-item-selection";
import type { CategoryRankingItem } from "../repositories/ranking-item/find-ranking-items-by-category";
import type { RankingItem } from "../types/ranking-item";
import {
  categoryItemsKeyPath,
  homeFeaturedKeyPath,
  rankingItemKeyPath,
  surveyItemsKeyPath,
} from "../types/snapshot";

/** CategoryRankingItem に areaType を追加したローカル型 */
interface CategoryRankingItemWithAreaType extends CategoryRankingItem {
  areaType: string;
}

export interface ExportRankingItemsPerUrlResult {
  home: { count: number };
  categories: { count: number; files: number };
  items: { count: number; files: number };
  surveys: { count: number; files: number };
  totalSizeBytes: number;
  durationMs: number;
}

/**
 * metrics テーブルを 1 回クエリし、URL 単位の小さい JSON を R2 に生成・保存する。
 *
 * 生成ファイル:
 *   home/featured.json
 *   category/{categoryKey}/items.json
 *   ranking/{rankingKey}/item.json
 *   survey/{surveyId}/items.json
 */
export async function exportRankingItemsPerUrl(
  options: {
    db?: ReturnType<typeof getDrizzle>;
  } = {},
): Promise<ExportRankingItemsPerUrlResult> {
  const startedAt = Date.now();
  const drizzleDb = options.db ?? getDrizzle();

  // 1. 全 metrics を 1 回クエリ
  const rows = await drizzleDb
    .select({ ...metricAsRankingItemSelection, tags: metrics.tags })
    .from(metrics);

  const items: RankingItem[] = [];
  for (const row of rows) {
    try {
      const parsed = parseRankingItemDB({
        ...row,
        data_source_id: "estat",
      });
      const tagKeys = JSON.parse(row.tags ?? "[]") as string[];
      if (tagKeys.length > 0) {
        parsed.tags = tagKeys.map((tagKey) => ({ tagKey }));
      }
      items.push(parsed);
    } catch (error) {
      logger.warn(
        {
          rankingKey: row.ranking_key,
          error: error instanceof Error ? error.message : String(error),
        },
        "exportRankingItemsPerUrl: parseRankingItemDB が失敗。スキップ",
      );
    }
  }

  // 2. categoryKey の列挙 (categoryKey + additionalCategories の union)
  const categoryKeySet = new Set<string>();
  for (const item of items) {
    if (item.categoryKey) categoryKeySet.add(item.categoryKey);
    if (Array.isArray(item.additionalCategories)) {
      for (const ck of item.additionalCategories) {
        categoryKeySet.add(ck);
      }
    }
  }

  // 3. surveyId の列挙
  const surveyIdSet = new Set<string>();
  for (const item of items) {
    if (item.surveyId) surveyIdSet.add(item.surveyId);
  }

  const generatedAt = new Date().toISOString();
  const uploads: Promise<{ key: string; size: number }>[] = [];

  // ── home/featured.json ──────────────────────────────────────────────────────
  const featuredItems = items
    .filter((it) => it.isFeatured && it.isActive && it.areaType === "prefecture")
    .sort((a, b) => (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0));

  const featuredBody = JSON.stringify({
    generatedAt,
    count: featuredItems.length,
    items: featuredItems,
  });
  uploads.push(
    saveToR2(homeFeaturedKeyPath(), featuredBody, {
      contentType: "application/json; charset=utf-8",
    }),
  );

  // ── category/{categoryKey}/items.json ────────────────────────────────────────
  for (const categoryKey of categoryKeySet) {
    const matched = items
      .filter((it) => {
        if (!it.isActive) return false;
        if (it.categoryKey === categoryKey) return true;
        if (Array.isArray(it.additionalCategories)) {
          return it.additionalCategories.includes(categoryKey);
        }
        return false;
      })
      .sort((a, b) => {
        const fa = a.featuredOrder ?? 0;
        const fb = b.featuredOrder ?? 0;
        if (fa !== fb) return fa - fb;
        return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
      });

    const categoryItems: CategoryRankingItemWithAreaType[] = matched.map((r) => ({
      rankingKey: r.rankingKey,
      areaType: r.areaType,
      title: r.title,
      subtitle: r.subtitle ?? null,
      unit: r.unit,
      latestYear: r.latestYear ?? null,
      availableYears: r.availableYears ?? null,
      description: r.description ?? null,
      demographicAttr: r.demographicAttr ?? null,
      normalizationBasis: r.normalizationBasis ?? null,
      groupKey: r.groupKey ?? null,
      isFeatured: r.isFeatured ?? false,
    }));

    const body = JSON.stringify({
      generatedAt,
      categoryKey,
      count: categoryItems.length,
      items: categoryItems,
    });
    uploads.push(
      saveToR2(categoryItemsKeyPath(categoryKey), body, {
        contentType: "application/json; charset=utf-8",
      }),
    );
  }

  // ── ranking/{rankingKey}/item.json ───────────────────────────────────────────
  // Group by rankingKey (a rankingKey may span multiple areaTypes → array)
  const byRankingKey = new Map<string, RankingItem[]>();
  for (const item of items) {
    const existing = byRankingKey.get(item.rankingKey);
    if (existing) {
      existing.push(item);
    } else {
      byRankingKey.set(item.rankingKey, [item]);
    }
  }

  for (const [rankingKey, keyItems] of byRankingKey) {
    // Use the first item as the canonical item for the file
    const item = keyItems[0];
    const body = JSON.stringify({
      generatedAt,
      item,
    });
    uploads.push(
      saveToR2(rankingItemKeyPath(rankingKey), body, {
        contentType: "application/json; charset=utf-8",
      }),
    );
  }

  // ── survey/{surveyId}/items.json ─────────────────────────────────────────────
  for (const surveyId of surveyIdSet) {
    const matched = items
      .filter((it) => it.isActive && it.surveyId === surveyId)
      .sort((a, b) => {
        const fa = a.featuredOrder ?? 0;
        const fb = b.featuredOrder ?? 0;
        if (fa !== fb) return fa - fb;
        return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
      });

    const surveyItems: CategoryRankingItemWithAreaType[] = matched.map((r) => ({
      rankingKey: r.rankingKey,
      areaType: r.areaType,
      title: r.title,
      subtitle: r.subtitle ?? null,
      unit: r.unit,
      latestYear: r.latestYear ?? null,
      availableYears: r.availableYears ?? null,
      description: r.description ?? null,
      demographicAttr: r.demographicAttr ?? null,
      normalizationBasis: r.normalizationBasis ?? null,
      groupKey: r.groupKey ?? null,
      isFeatured: r.isFeatured ?? false,
    }));

    const body = JSON.stringify({
      generatedAt,
      surveyId,
      count: surveyItems.length,
      items: surveyItems,
    });
    uploads.push(
      saveToR2(surveyItemsKeyPath(surveyId), body, {
        contentType: "application/json; charset=utf-8",
      }),
    );
  }

  // 4. 並列アップロード
  const results = await Promise.all(uploads);
  const totalSizeBytes = results.reduce((sum, r) => sum + r.size, 0);
  const durationMs = Date.now() - startedAt;

  const categoriesFiles = categoryKeySet.size;
  const itemsFiles = byRankingKey.size;
  const surveysFiles = surveyIdSet.size;

  // category アイテム数合計（全カテゴリの matched 合計は重複あるため items.length を代替とする）
  const categoriesCount = items.filter((it) => it.isActive && it.categoryKey).length;
  const surveysCount = items.filter((it) => it.isActive && it.surveyId).length;

  logger.info(
    {
      home: featuredItems.length,
      categories: { count: categoriesCount, files: categoriesFiles },
      items: { count: items.length, files: itemsFiles },
      surveys: { count: surveysCount, files: surveysFiles },
      totalSizeBytes,
      durationMs,
    },
    "ranking_items per-URL snapshots を R2 に保存しました",
  );

  return {
    home: { count: featuredItems.length },
    categories: { count: categoriesCount, files: categoriesFiles },
    items: { count: items.length, files: itemsFiles },
    surveys: { count: surveysCount, files: surveysFiles },
    totalSizeBytes,
    durationMs,
  };
}
