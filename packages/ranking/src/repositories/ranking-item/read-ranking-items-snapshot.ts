import "server-only";

import { logger } from "@stats47/logger/server";
import { fetchFromR2AsJson } from "@stats47/r2-storage/server";
import type { AreaType } from "@stats47/types";
import { err, ok, type Result } from "@stats47/types";

import type { RankingItem } from "../../types/ranking-item";
import {
  RANKING_ITEMS_SNAPSHOT_KEY,
  type RankingItemsSnapshot,
} from "../../types/snapshot";
import type { CategoryRankingItem } from "./find-ranking-items-by-category";
import type { GroupRankingItem } from "./find-ranking-items-by-group-key";
import type { RankingConfigResponse } from "../../types/ranking-config-response";

const STALE_AFTER_DAYS = 7;

let cached: { fetchedAt: number; items: RankingItem[] } | null = null;

function warnIfStale(generatedAt: string): void {
  const ageDays = (Date.now() - new Date(generatedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays > STALE_AFTER_DAYS) {
    logger.warn(
      { generatedAt, ageDays: Math.round(ageDays) },
      `ranking_items snapshot が ${STALE_AFTER_DAYS} 日以上古い`,
    );
  }
}

async function loadAll(): Promise<RankingItem[]> {
  if (cached) return cached.items;
  const snapshot = await fetchFromR2AsJson<RankingItemsSnapshot>(
    RANKING_ITEMS_SNAPSHOT_KEY,
  );
  if (!snapshot) {
    logger.warn(
      { key: RANKING_ITEMS_SNAPSHOT_KEY },
      "ranking_items snapshot が R2 に存在しません",
    );
    cached = { fetchedAt: Date.now(), items: [] };
    return [];
  }
  warnIfStale(snapshot.generatedAt);
  cached = { fetchedAt: Date.now(), items: snapshot.items };
  return snapshot.items;
}

export async function readActiveRankingKeysFromR2(
  areaType: AreaType,
): Promise<Result<{ rankingKey: string; areaType: string }[], Error>> {
  try {
    const items = await loadAll();
    const rows = items
      .filter((it) => it.areaType === areaType && it.isActive)
      .map((it) => ({ rankingKey: it.rankingKey, areaType: it.areaType }));
    return ok(rows);
  } catch (error) {
    logger.error({ error, areaType }, "readActiveRankingKeysFromR2: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

export async function readRankingItemFromR2(
  rankingKey: string,
  areaType: AreaType,
): Promise<Result<RankingItem | null, Error>> {
  try {
    const items = await loadAll();
    const found = items.find(
      (it) => it.rankingKey === rankingKey && it.areaType === areaType,
    );
    return ok(found ?? null);
  } catch (error) {
    logger.error({ error, rankingKey, areaType }, "readRankingItemFromR2: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

export async function readRankingItemByKeyFromR2(
  rankingKey: string,
): Promise<Result<RankingItem | null, Error>> {
  try {
    const items = await loadAll();
    const found = items.find((it) => it.rankingKey === rankingKey);
    return ok(found ?? null);
  } catch (error) {
    logger.error({ error, rankingKey }, "readRankingItemByKeyFromR2: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

export async function readRankingItemByKeyAndAreaTypeFromR2(
  rankingKey: string,
  areaType: AreaType,
): Promise<Result<RankingItem[], Error>> {
  try {
    const items = await loadAll();
    const matched = items.filter(
      (it) => it.rankingKey === rankingKey && it.areaType === areaType,
    );
    return ok(matched);
  } catch (error) {
    logger.error({ error, rankingKey, areaType }, "readRankingItemByKeyAndAreaTypeFromR2: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

export async function readRankingItemsByCategoryFromR2(
  categoryKey: string,
): Promise<Result<CategoryRankingItem[], Error>> {
  try {
    const items = await loadAll();
    const matched = items.filter((it) => {
      if (!it.isActive) return false;
      if (it.categoryKey === categoryKey) return true;
      if (Array.isArray(it.additionalCategories)) {
        return it.additionalCategories.includes(categoryKey);
      }
      return false;
    });

    matched.sort((a, b) => {
      const fa = a.featuredOrder ?? 0;
      const fb = b.featuredOrder ?? 0;
      if (fa !== fb) return fa - fb;
      return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
    });

    const rows: CategoryRankingItem[] = matched.map((r) => ({
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
    return ok(rows);
  } catch (error) {
    logger.error({ error, categoryKey }, "readRankingItemsByCategoryFromR2: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

export async function readRankingItemsBySurveyFromR2(
  surveyId: string,
): Promise<Result<CategoryRankingItem[], Error>> {
  try {
    const items = await loadAll();
    const matched = items
      .filter((it) => it.isActive && it.surveyId === surveyId)
      .sort((a, b) => {
        const fa = a.featuredOrder ?? 0;
        const fb = b.featuredOrder ?? 0;
        if (fa !== fb) return fa - fb;
        return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
      });

    const rows: CategoryRankingItem[] = matched.map((r) => ({
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
    return ok(rows);
  } catch (error) {
    logger.error({ error, surveyId }, "readRankingItemsBySurveyFromR2: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

export async function readRankingItemsByGroupKeyFromR2(
  groupKey: string,
  areaType: AreaType,
): Promise<Result<GroupRankingItem[], Error>> {
  try {
    const items = await loadAll();
    const matched = items
      .filter(
        (it) =>
          it.isActive && it.groupKey === groupKey && it.areaType === areaType,
      )
      .sort((a, b) => (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0));

    const rows: GroupRankingItem[] = matched.map((r) => ({
      rankingKey: r.rankingKey,
      title: r.title,
      subtitle: r.subtitle ?? null,
      unit: r.unit,
      normalizationBasis: r.normalizationBasis ?? null,
    }));
    return ok(rows);
  } catch (error) {
    logger.error({ error, groupKey, areaType }, "readRankingItemsByGroupKeyFromR2: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

export async function readFeaturedRankingItemsFromR2(
  limit = 20,
): Promise<Result<RankingItem[], Error>> {
  try {
    const items = await loadAll();
    const matched = items
      .filter(
        (it) => it.isActive && it.isFeatured && it.areaType === "prefecture",
      )
      .sort((a, b) => (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0))
      .slice(0, limit);
    return ok(matched);
  } catch (error) {
    logger.error({ error }, "readFeaturedRankingItemsFromR2: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

export async function readActiveKeysForSitemapFromR2(): Promise<
  Result<{ rankingKey: string; updatedAt: string | null }[], Error>
> {
  try {
    const items = await loadAll();
    const rows = items
      .filter((it) => it.isActive)
      .map((it) => ({
        rankingKey: it.rankingKey,
        updatedAt: it.updatedAt ?? null,
      }));
    return ok(rows);
  } catch (error) {
    logger.error({ error }, "readActiveKeysForSitemapFromR2: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

export async function readFirstKeyByTagFromR2(
  tagKey: string,
): Promise<Result<string, Error>> {
  try {
    const items = await loadAll();
    const matched = items
      .filter(
        (it) =>
          it.isActive &&
          it.areaType === "prefecture" &&
          (it.tags ?? []).some((t) => t.tagKey === tagKey),
      )
      .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
    if (matched.length === 0) {
      return err(new Error(`First ranking key not found for tagKey: ${tagKey}`));
    }
    return ok(matched[0].rankingKey);
  } catch (error) {
    logger.error({ error, tagKey }, "readFirstKeyByTagFromR2: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

export async function readRankingItemsByTagFromR2(
  tagKey: string,
  categoryNameLookup?: (categoryKey: string) => Promise<string | null>,
): Promise<Result<RankingConfigResponse, Error>> {
  try {
    const items = await loadAll();
    const matched = items
      .filter(
        (it) =>
          it.isActive && (it.tags ?? []).some((t) => t.tagKey === tagKey),
      )
      .sort((a, b) => {
        const fa = a.featuredOrder ?? 0;
        const fb = b.featuredOrder ?? 0;
        if (fa !== fb) return fa - fb;
        return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
      });

    if (matched.length === 0) {
      return err(new Error(`No ranking items found for tagKey: ${tagKey}`));
    }

    const firstItem = matched[0];
    let categoryName = firstItem.categoryKey ?? "";
    if (firstItem.categoryKey && categoryNameLookup) {
      const looked = await categoryNameLookup(firstItem.categoryKey);
      if (looked) categoryName = looked;
    }

    return ok({
      category: {
        categoryKey: firstItem.categoryKey ?? "",
        categoryName,
        defaultRankingKey: firstItem.rankingKey,
      },
      rankingItems: matched,
    });
  } catch (error) {
    logger.error({ error, tagKey }, "readRankingItemsByTagFromR2: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

export async function readTagsForItemFromR2(
  rankingKey: string,
  areaType: AreaType,
): Promise<Result<string[], Error>> {
  try {
    const items = await loadAll();
    const found = items.find(
      (it) => it.rankingKey === rankingKey && it.areaType === areaType,
    );
    return ok((found?.tags ?? []).map((t) => t.tagKey));
  } catch (error) {
    logger.error(
      { error, rankingKey, areaType },
      "readTagsForItemFromR2: failed",
    );
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

export async function readRankingItemsByAreaTypeFromR2(
  areaType: AreaType,
  options?: { dataSourceId?: string; categoryKey?: string },
): Promise<Result<RankingItem[], Error>> {
  try {
    const all = await loadAll();
    const matched = all.filter((it) => {
      if (it.areaType !== areaType || !it.isActive) return false;
      if (options?.dataSourceId && it.dataSourceId !== options.dataSourceId)
        return false;
      if (options?.categoryKey && it.categoryKey !== options.categoryKey)
        return false;
      return true;
    });
    matched.sort((a, b) => a.title.localeCompare(b.title));
    return ok(matched);
  } catch (error) {
    logger.error(
      { error, areaType, options },
      "readRankingItemsByAreaTypeFromR2: failed",
    );
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

export async function readLatestYearForAreaTypeFromR2(
  areaType: AreaType,
): Promise<Result<string | null, Error>> {
  try {
    const all = await loadAll();
    let max: string | null = null;
    for (const it of all) {
      if (it.areaType !== areaType) continue;
      const yc = it.latestYear?.yearCode;
      if (yc && (max === null || yc > max)) max = yc;
    }
    return ok(max);
  } catch (error) {
    logger.error({ error, areaType }, "readLatestYearForAreaTypeFromR2: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
