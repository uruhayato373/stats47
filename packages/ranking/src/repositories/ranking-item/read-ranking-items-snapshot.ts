import "server-only";

import { logger } from "@stats47/logger/server";
import { fetchFromR2AsJson } from "@stats47/r2-storage/server";
import type { AreaType } from "@stats47/types";
import { err, ok, type Result } from "@stats47/types";

import type { RankingItem } from "../../types/ranking-item";
import {
  categoryItemsKeyPath,
  homeFeaturedKeyPath,
  RANKING_ITEMS_SNAPSHOT_KEY,
  rankingItemKeyPath,
  surveyItemsKeyPath,
  type RankingItemsSnapshot,
} from "../../types/snapshot";
import type { CategoryRankingItem } from "./find-ranking-items-by-category";
import type { GroupRankingItem } from "./find-ranking-items-by-group-key";
import type { RankingConfigResponse } from "../../types/ranking-config-response";

// ────────────────────────────────────────────────────────────────────────────
// Phase 1 — URL 単位の小さい JSON を使う関数
// ────────────────────────────────────────────────────────────────────────────

interface HomeFeaturedSnapshot {
  generatedAt: string;
  count: number;
  items: RankingItem[];
}

interface CategoryItemsSnapshot {
  generatedAt: string;
  categoryKey: string;
  count: number;
  items: (CategoryRankingItem & { areaType: string })[];
}

interface RankingItemSnapshot {
  generatedAt: string;
  item: RankingItem;
}

interface SurveyItemsSnapshot {
  generatedAt: string;
  surveyId: string;
  count: number;
  items: (CategoryRankingItem & { areaType: string })[];
}

export async function readFeaturedRankingItemsFromR2(
  limit = 20,
): Promise<Result<RankingItem[], Error>> {
  try {
    const snapshot = await fetchFromR2AsJson<HomeFeaturedSnapshot>(
      homeFeaturedKeyPath(),
    );
    if (!snapshot) {
      logger.warn(
        { key: homeFeaturedKeyPath() },
        "home/featured.json が R2 に存在しません",
      );
      return ok([]);
    }
    return ok(snapshot.items.slice(0, limit));
  } catch (error) {
    logger.error({ error }, "readFeaturedRankingItemsFromR2: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

export async function readRankingItemsByCategoryFromR2(
  categoryKey: string,
): Promise<Result<CategoryRankingItem[], Error>> {
  try {
    const snapshot = await fetchFromR2AsJson<CategoryItemsSnapshot>(
      categoryItemsKeyPath(categoryKey),
    );
    if (!snapshot) {
      logger.warn(
        { key: categoryItemsKeyPath(categoryKey) },
        "category items snapshot が R2 に存在しません",
      );
      return ok([]);
    }
    return ok(snapshot.items);
  } catch (error) {
    logger.error({ error, categoryKey }, "readRankingItemsByCategoryFromR2: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

export async function readRankingItemFromR2(
  rankingKey: string,
  areaType: AreaType,
): Promise<Result<RankingItem | null, Error>> {
  try {
    const snapshot = await fetchFromR2AsJson<RankingItemSnapshot>(
      rankingItemKeyPath(rankingKey),
    );
    if (!snapshot) {
      return ok(null);
    }
    const item = snapshot.item;
    return ok(item.areaType === areaType ? item : null);
  } catch (error) {
    logger.error({ error, rankingKey, areaType }, "readRankingItemFromR2: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

export async function readRankingItemByKeyFromR2(
  rankingKey: string,
): Promise<Result<RankingItem | null, Error>> {
  try {
    const snapshot = await fetchFromR2AsJson<RankingItemSnapshot>(
      rankingItemKeyPath(rankingKey),
    );
    if (!snapshot) {
      return ok(null);
    }
    return ok(snapshot.item);
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
    const snapshot = await fetchFromR2AsJson<RankingItemSnapshot>(
      rankingItemKeyPath(rankingKey),
    );
    if (!snapshot) {
      return ok([]);
    }
    const item = snapshot.item;
    return ok(item.areaType === areaType ? [item] : []);
  } catch (error) {
    logger.error({ error, rankingKey, areaType }, "readRankingItemByKeyAndAreaTypeFromR2: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

export async function readTagsForItemFromR2(
  rankingKey: string,
  areaType: AreaType,
): Promise<Result<string[], Error>> {
  try {
    const snapshot = await fetchFromR2AsJson<RankingItemSnapshot>(
      rankingItemKeyPath(rankingKey),
    );
    if (!snapshot) {
      return ok([]);
    }
    const item = snapshot.item;
    if (item.areaType !== areaType) {
      return ok([]);
    }
    return ok((item.tags ?? []).map((t) => t.tagKey));
  } catch (error) {
    logger.error(
      { error, rankingKey, areaType },
      "readTagsForItemFromR2: failed",
    );
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

export async function readRankingItemsBySurveyFromR2(
  surveyId: string,
): Promise<Result<CategoryRankingItem[], Error>> {
  try {
    const snapshot = await fetchFromR2AsJson<SurveyItemsSnapshot>(
      surveyItemsKeyPath(surveyId),
    );
    if (!snapshot) {
      logger.warn(
        { key: surveyItemsKeyPath(surveyId) },
        "survey items snapshot が R2 に存在しません",
      );
      return ok([]);
    }
    return ok(snapshot.items);
  } catch (error) {
    logger.error({ error, surveyId }, "readRankingItemsBySurveyFromR2: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Phase 2 — all.json を直接 fetch（キャッシュなし）
// ────────────────────────────────────────────────────────────────────────────

export async function readActiveRankingKeysFromR2(
  areaType: AreaType,
): Promise<Result<{ rankingKey: string; areaType: string }[], Error>> {
  try {
    const snapshot = await fetchFromR2AsJson<RankingItemsSnapshot>(
      RANKING_ITEMS_SNAPSHOT_KEY,
    );
    if (!snapshot) {
      logger.warn(
        { key: RANKING_ITEMS_SNAPSHOT_KEY },
        "ranking_items snapshot が R2 に存在しません",
      );
      return ok([]);
    }
    const rows = snapshot.items
      .filter((it) => it.areaType === areaType && it.isActive)
      .map((it) => ({ rankingKey: it.rankingKey, areaType: it.areaType }));
    return ok(rows);
  } catch (error) {
    logger.error({ error, areaType }, "readActiveRankingKeysFromR2: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

export async function readActiveKeysForSitemapFromR2(): Promise<
  Result<{ rankingKey: string; updatedAt: string | null }[], Error>
> {
  try {
    const snapshot = await fetchFromR2AsJson<RankingItemsSnapshot>(
      RANKING_ITEMS_SNAPSHOT_KEY,
    );
    if (!snapshot) {
      logger.warn(
        { key: RANKING_ITEMS_SNAPSHOT_KEY },
        "ranking_items snapshot が R2 に存在しません",
      );
      return ok([]);
    }
    const rows = snapshot.items
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

export async function readLatestYearForAreaTypeFromR2(
  areaType: AreaType,
): Promise<Result<string | null, Error>> {
  try {
    const snapshot = await fetchFromR2AsJson<RankingItemsSnapshot>(
      RANKING_ITEMS_SNAPSHOT_KEY,
    );
    if (!snapshot) {
      logger.warn(
        { key: RANKING_ITEMS_SNAPSHOT_KEY },
        "ranking_items snapshot が R2 に存在しません",
      );
      return ok(null);
    }
    let max: string | null = null;
    for (const it of snapshot.items) {
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

export async function readRankingItemsByAreaTypeFromR2(
  areaType: AreaType,
  options?: { dataSourceId?: string; categoryKey?: string },
): Promise<Result<RankingItem[], Error>> {
  try {
    const snapshot = await fetchFromR2AsJson<RankingItemsSnapshot>(
      RANKING_ITEMS_SNAPSHOT_KEY,
    );
    if (!snapshot) {
      logger.warn(
        { key: RANKING_ITEMS_SNAPSHOT_KEY },
        "ranking_items snapshot が R2 に存在しません",
      );
      return ok([]);
    }
    const matched = snapshot.items.filter((it) => {
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

export async function readRankingItemsByGroupKeyFromR2(
  groupKey: string,
  areaType: AreaType,
): Promise<Result<GroupRankingItem[], Error>> {
  try {
    const snapshot = await fetchFromR2AsJson<RankingItemsSnapshot>(
      RANKING_ITEMS_SNAPSHOT_KEY,
    );
    if (!snapshot) {
      logger.warn(
        { key: RANKING_ITEMS_SNAPSHOT_KEY },
        "ranking_items snapshot が R2 に存在しません",
      );
      return ok([]);
    }
    const matched = snapshot.items
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

export async function readRankingItemsByTagFromR2(
  tagKey: string,
  categoryNameLookup?: (categoryKey: string) => Promise<string | null>,
): Promise<Result<RankingConfigResponse, Error>> {
  try {
    const snapshot = await fetchFromR2AsJson<RankingItemsSnapshot>(
      RANKING_ITEMS_SNAPSHOT_KEY,
    );
    if (!snapshot) {
      logger.warn(
        { key: RANKING_ITEMS_SNAPSHOT_KEY },
        "ranking_items snapshot が R2 に存在しません",
      );
      return err(new Error(`No ranking items found for tagKey: ${tagKey}`));
    }
    const matched = snapshot.items
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

export async function readFirstKeyByTagFromR2(
  tagKey: string,
): Promise<Result<string, Error>> {
  try {
    const snapshot = await fetchFromR2AsJson<RankingItemsSnapshot>(
      RANKING_ITEMS_SNAPSHOT_KEY,
    );
    if (!snapshot) {
      logger.warn(
        { key: RANKING_ITEMS_SNAPSHOT_KEY },
        "ranking_items snapshot が R2 に存在しません",
      );
      return err(new Error(`First ranking key not found for tagKey: ${tagKey}`));
    }
    const matched = snapshot.items
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
