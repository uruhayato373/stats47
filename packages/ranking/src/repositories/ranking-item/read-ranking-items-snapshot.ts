import "server-only";

import { logger } from "@stats47/logger/server";
import {
  fetchFromR2AsJson,
  listFromR2,
  shouldSkipRemoteR2Read,
} from "@stats47/r2-storage/server";
import type { AreaType } from "@stats47/types";
import { err, ok, type Result } from "@stats47/types";

import { KNOWN_RANKING_KEYS } from "../../config/known-ranking-keys";
import type { RankingItem } from "../../types/ranking-item";
import type { RankingItemWithTags } from "../../types/ranking-item-with-tags";
import {
  categoryItemsKeyPath,
  homeFeaturedKeyPath,
  RANKING_ITEMS_SNAPSHOT_KEY,
  rankingItemKeyPath,
  surveyItemsKeyPath,
  type RankingItemsSnapshot,
} from "../../types/snapshot";
import type { CategoryRankingItem } from "../../types/ranking-item";
import type { RankingConfigResponse } from "../../types/ranking-config-response";

// Phase 7 (2026-05-28): find-ranking-items-by-group-key.ts 削除に伴い、
// GroupRankingItem 型を本ファイルに inline 移動 (snapshot reader だけで使用)。
export interface GroupRankingItem {
  rankingKey: string;
  title: string;
  subtitle: string | null;
  unit: string;
  normalizationBasis: string | null;
}

function warnMissingR2Snapshot(bindings: Record<string, unknown>, message: string): void {
  if (!shouldSkipRemoteR2Read()) {
    logger.warn(bindings, message);
  }
}

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
      warnMissingR2Snapshot(
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
      warnMissingR2Snapshot(
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

/**
 * 全 ranking-item を R2 の per-key item.json (`app/ranking/<key>/item.json`) から走査して返す。
 * 完全DBレス (docs/01_技術設計/19): `listRankingItemsWithTags` の R2 代替。
 * item.json の `.item` は tags まで含む完全な RankingItemWithTags なのでそのまま使える。
 * 旧来の list 系 R2 リーダはモノリス `app/ranking-items/all.json` を読むが、これは廃止予定 (現在欠落)
 * のため、per-key ファイル群を直接イテレートする。
 *
 * 注: build スクリプトで使う場合、`listFromR2`/`fetchFromR2AsJson` はローカル FS (`.local/r2`) を
 * 使うため NODE_ENV=development で実行すること (S3 トークン廃止のため scripts 経路は cloud 不可)。
 */
export async function listRankingItemsWithTagsFromR2(options?: {
  areaType?: AreaType;
  isActive?: boolean;
}): Promise<Result<RankingItemWithTags[], Error>> {
  try {
    const itemKeys = await enumerateRankingItemKeys(options?.areaType);

    const items: RankingItemWithTags[] = [];
    for (const key of itemKeys) {
      const snapshot = await fetchFromR2AsJson<{ item: RankingItemWithTags }>(
        key,
      );
      const item = snapshot?.item;
      if (!item) continue;
      if (options?.areaType && item.areaType !== options.areaType) continue;
      if (options?.isActive != null && item.isActive !== options.isActive) {
        continue;
      }
      items.push({ ...item, tags: item.tags ?? [] });
    }
    return ok(items);
  } catch (error) {
    logger.error({ error }, "listRankingItemsWithTagsFromR2: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * `app/ranking/<key>/item.json` キーを列挙する。
 *  1. R2 list (SSD ローカル FS / S3 認証がある環境)
 *  2. 不可なら committed `KNOWN_RANKING_KEYS` から列挙 (公開URL専用の SSD/認証なし環境)
 *
 * KNOWN_RANKING_KEYS は prefecture & active の SSOT。list 不可環境では
 * prefecture 以外を列挙できないため、その場合は明示的にエラーにする (silent な欠落を防ぐ)。
 */
async function enumerateRankingItemKeys(areaType?: AreaType): Promise<string[]> {
  try {
    const allKeys = await listFromR2("app/ranking/");
    const itemKeys = allKeys.filter((k) =>
      /^app\/ranking\/[^/]+\/item\.json$/.test(k),
    );
    if (itemKeys.length > 0) return itemKeys;
  } catch {
    // R2 list 不可 (公開URL専用環境) → git 列挙フォールバックへ
  }

  if (areaType && areaType !== "prefecture") {
    throw new Error(
      `R2 list 不可環境では areaType=${areaType} の ranking item を列挙できません ` +
        `(KNOWN_RANKING_KEYS は prefecture のみ。SSD 接続 or S3 認証が必要)`,
    );
  }
  return [...KNOWN_RANKING_KEYS].map((key) => `app/ranking/${key}/item.json`);
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
      warnMissingR2Snapshot(
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
      warnMissingR2Snapshot(
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
      warnMissingR2Snapshot(
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
      warnMissingR2Snapshot(
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
      warnMissingR2Snapshot(
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
      warnMissingR2Snapshot(
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
      warnMissingR2Snapshot(
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
      warnMissingR2Snapshot(
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
