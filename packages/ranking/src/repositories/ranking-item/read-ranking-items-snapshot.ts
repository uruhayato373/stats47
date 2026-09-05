import "server-only";

import { logger } from "@stats47/logger/server";
import {
  fetchFromR2AsJson,
  listFromR2,
  shouldSkipRemoteR2Read,
} from "@stats47/r2-storage/server";
import type { AreaType } from "@stats47/types";
import { err, ok, type Result } from "@stats47/types";

import { GONE_RANKING_KEYS } from "../../config/gone-ranking-keys";
import { KNOWN_RANKING_KEYS } from "../../config/known-ranking-keys";
import type { FeaturedRankingItem, RankingItem } from "../../types/ranking-item";
import type { RankingItemWithTags } from "../../types/ranking-item-with-tags";
import {
  categoryItemsKeyPath,
  homeFeaturedKeyPath,
  RANKING_ITEMS_SNAPSHOT_KEY,
  rankingItemKeyPath,
  surveyItemsKeyPath,
} from "../../types/snapshot";
import type { CategoryRankingItem } from "../../types/ranking-item";
import type { RankingConfigResponse } from "../../types/ranking-config-response";
import { compareByRepresentativeThenRecency } from "../../lib/ranking-order";
import {
  parseCategoryItemsSnapshot,
  parseHomeFeaturedSnapshot,
  parseRankingItemSnapshot,
  parseRankingItemsSnapshot,
  parseSurveyItemsSnapshot,
  parseTaggedRankingItemSnapshot,
  type CategorySourceSurvey,
  type CategoryTopic,
} from "../schemas/ranking-item.schemas";

export type { CategorySourceSurvey, CategoryTopic } from "../schemas/ranking-item.schemas";

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

function isNextProductionBuild(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

/**
 * 退役キーを一覧から落とす。**R2 snapshot より GONE_RANKING_KEYS を優先する**。
 *
 * ## なぜ R2 を信用しないか
 *
 * 退役は「config `isActive:false` → KNOWN 再生成 → GONE 登録 → デプロイ」で確定するが、
 * R2 snapshot を作る `sync-snapshots.yml` の `sync` job は **`ref: main` を checkout する**
 * (配信データは「デプロイ済みコードの姿」であるべき、という意図的な設計)。つまり
 * **config が main に乗るまで R2 から退役キーを落とせない**。順序は必ずこうなる:
 *
 *   1. デプロイ (middleware が 410 を返し始める)
 *   2. R2 再生成 (一覧からリンクが消える)
 *
 * この 1→2 の間、**一覧は 410 になったページへリンクし続ける**。R2 だけを信用する限り
 * この窓は退役のたびに構造的に生まれ、消せない (2026-07-24 にタグリンク 1,988 本が
 * 410 を指していた事故と同じクラス)。
 *
 * middleware の 410 判定はコード (GONE_RANKING_KEYS) を見ているので、**リンク生成側も
 * 同じコードを見れば窓はゼロになる**。デプロイは原子的なので、410 化とリンク消滅が同時に起きる。
 * R2 が後から追いついても結果は変わらない (冪等)。
 *
 * この定数は `KNOWN_RANKING_KEYS` と対で `@stats47/ranking/config` に置いてある。
 * GONE ∩ KNOWN = ∅ は `ranking-key-consistency.test.ts` が CI で恒久検証する。
 */
function excludeGone<T extends { rankingKey: string }>(items: T[]): T[] {
  return items.filter((it) => !GONE_RANKING_KEYS.has(it.rankingKey));
}

// ────────────────────────────────────────────────────────────────────────────
// Phase 1 — URL 単位の小さい JSON を使う関数
// ────────────────────────────────────────────────────────────────────────────

async function readValidatedSnapshot<T>(
  key: string,
  parse: (value: unknown) => T,
): Promise<T | null> {
  const value = await fetchFromR2AsJson<unknown>(key);
  return value === null ? null : parse(value);
}

export async function readFeaturedRankingItemsFromR2(
  limit = 20,
): Promise<Result<FeaturedRankingItem[], Error>> {
  try {
    const snapshot = await readValidatedSnapshot(
      homeFeaturedKeyPath(),
      parseHomeFeaturedSnapshot,
    );
    if (!snapshot) {
      warnMissingR2Snapshot(
        { key: homeFeaturedKeyPath() },
        "home/featured.json が R2 に存在しません",
      );
      return ok([]);
    }
    return ok(excludeGone(snapshot.items).slice(0, limit));
  } catch (error) {
    logger.error({ error }, "readFeaturedRankingItemsFromR2: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

export async function readRankingItemsByCategoryFromR2(
  categoryKey: string,
): Promise<Result<CategoryRankingItem[], Error>> {
  try {
    const snapshot = await readValidatedSnapshot(
      categoryItemsKeyPath(categoryKey),
      parseCategoryItemsSnapshot,
    );
    if (!snapshot) {
      warnMissingR2Snapshot(
        { key: categoryItemsKeyPath(categoryKey) },
        "category items snapshot が R2 に存在しません",
      );
      return ok([]);
    }
    return ok(excludeGone(snapshot.items));
  } catch (error) {
    logger.error({ error, categoryKey }, "readRankingItemsByCategoryFromR2: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * カテゴリ内 active item の出典調査 (焼き込み済みサマリ) を読む。
 * 旧 snapshot (sourceSurveys 未焼き込み) は空配列 → 呼び元はカードを出さない。
 * 全調査リスト (app/survey/all.json) をカテゴリページに出す旧挙動の代替 (2026-07-14)。
 */
export async function readCategorySourceSurveysFromR2(
  categoryKey: string,
): Promise<Result<CategorySourceSurvey[], Error>> {
  try {
    const snapshot = await readValidatedSnapshot(
      categoryItemsKeyPath(categoryKey),
      parseCategoryItemsSnapshot,
    );
    return ok(snapshot?.sourceSurveys ?? []);
  } catch (error) {
    logger.error({ error, categoryKey }, "readCategorySourceSurveysFromR2: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * カテゴリ内グループの表示順マニフェストを読む。
 * 旧 snapshot / カタログ未登録カテゴリは空配列 → 呼び元は平坦一覧へ縮退する。
 */
export async function readCategoryTopicsFromR2(
  categoryKey: string,
): Promise<Result<CategoryTopic[], Error>> {
  try {
    const snapshot = await readValidatedSnapshot(
      categoryItemsKeyPath(categoryKey),
      parseCategoryItemsSnapshot,
    );
    return ok(snapshot?.topics ?? []);
  } catch (error) {
    logger.error({ error, categoryKey }, "readCategoryTopicsFromR2: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

export async function readRankingItemFromR2(
  rankingKey: string,
  areaType: AreaType,
): Promise<Result<RankingItem | null, Error>> {
  if (GONE_RANKING_KEYS.has(rankingKey)) return ok(null);
  try {
    const snapshot = await readValidatedSnapshot(
      rankingItemKeyPath(rankingKey),
      parseRankingItemSnapshot,
    );
    if (!snapshot) {
      return ok(null);
    }
    const item = snapshot.item;
    return ok(item.areaType === areaType ? item : null);
  } catch (error) {
    if (isNextProductionBuild()) {
      return ok(null);
    }
    logger.error({ error, rankingKey, areaType }, "readRankingItemFromR2: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

export async function readRankingItemByKeyFromR2(
  rankingKey: string,
): Promise<Result<RankingItem | null, Error>> {
  if (GONE_RANKING_KEYS.has(rankingKey)) return ok(null);
  try {
    const snapshot = await readValidatedSnapshot(
      rankingItemKeyPath(rankingKey),
      parseRankingItemSnapshot,
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
 * 公開中の都道府県 ranking-item を R2 の per-key item.json から走査して返す。
 * 完全DBレス (docs/01_技術設計/19): `listRankingItemsWithTags` の R2 代替。
 * 列挙の正典は `KNOWN_RANKING_KEYS`。R2には退役・city/port専用の孤立itemが残り得るため、
 * list結果だけを母集団にすると公開契約外の旧schema 1件で全一覧が停止する。
 * item.json の `.item` は tags まで含む完全な RankingItemWithTags なのでそのまま使える。
 * 旧来の list 系 R2 リーダはモノリス `app/ranking-items/all.json` を読むが、これは廃止予定 (現在欠落)
 * のため、per-key ファイル群を直接イテレートする。
 *
 * 非prefecture一覧はこの関数の対象外。city/portは専用readerを使う。
 */
export async function listRankingItemsWithTagsFromR2(options?: {
  areaType?: AreaType;
  isActive?: boolean;
}): Promise<Result<RankingItemWithTags[], Error>> {
  try {
    const itemKeys = await enumerateRankingItemKeys(options?.areaType);

    const items: RankingItemWithTags[] = [];
    for (const key of itemKeys) {
      const snapshot = await readValidatedSnapshot(key, parseTaggedRankingItemSnapshot);
      const item = snapshot?.item;
      if (!item) continue;
      if (GONE_RANKING_KEYS.has(item.rankingKey)) continue;
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
 * `KNOWN_RANKING_KEYS` とR2 listの積集合を返す。list不可時も同じgit正典へfallbackする。
 * R2に残る旧itemをstrict parserへ渡さず、同時にknown keyの欠落をfallbackで隠さない。
 */
async function enumerateRankingItemKeys(areaType?: AreaType): Promise<string[]> {
  if (areaType && areaType !== "prefecture") {
    throw new Error(
      `areaType=${areaType} の ranking item 一覧はこのリーダーの対象外です ` +
        `(公開 /ranking の正典は prefecture の KNOWN_RANKING_KEYS)`,
    );
  }

  const knownItemKeys = new Set(
    [...KNOWN_RANKING_KEYS].map((key) => `app/ranking/${key}/item.json`),
  );
  try {
    const allKeys = await listFromR2("app/ranking/");
    const itemKeys = allKeys.filter((k) =>
      /^app\/ranking\/[^/]+\/item\.json$/.test(k) && knownItemKeys.has(k),
    );
    if (itemKeys.length > 0) return itemKeys;
  } catch {
    // R2 list 不可 (公開URL専用環境) → git 列挙フォールバックへ
  }

  return [...KNOWN_RANKING_KEYS].map((key) => `app/ranking/${key}/item.json`);
}

export async function readRankingItemByKeyAndAreaTypeFromR2(
  rankingKey: string,
  areaType: AreaType,
): Promise<Result<RankingItem[], Error>> {
  if (GONE_RANKING_KEYS.has(rankingKey)) return ok([]);
  try {
    const snapshot = await readValidatedSnapshot(
      rankingItemKeyPath(rankingKey),
      parseRankingItemSnapshot,
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
    const snapshot = await readValidatedSnapshot(
      rankingItemKeyPath(rankingKey),
      parseRankingItemSnapshot,
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
  if (isNextProductionBuild()) {
    return ok([]);
  }

  try {
    const snapshot = await readValidatedSnapshot(
      surveyItemsKeyPath(surveyId),
      parseSurveyItemsSnapshot,
    );
    if (!snapshot) {
      warnMissingR2Snapshot(
        { key: surveyItemsKeyPath(surveyId) },
        "survey items snapshot が R2 に存在しません",
      );
      return ok([]);
    }
    return ok(excludeGone(snapshot.items));
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
  if (isNextProductionBuild() && areaType === "prefecture") {
    return ok(
      [...KNOWN_RANKING_KEYS].map((rankingKey) => ({ rankingKey, areaType })),
    );
  }

  try {
    const snapshot = await readValidatedSnapshot(
      RANKING_ITEMS_SNAPSHOT_KEY,
      parseRankingItemsSnapshot,
    );
    if (!snapshot) {
      warnMissingR2Snapshot(
        { key: RANKING_ITEMS_SNAPSHOT_KEY },
        "ranking_items snapshot が R2 に存在しません",
      );
      return ok([]);
    }
    const rows = excludeGone(snapshot.items)
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
  if (isNextProductionBuild()) {
    return ok(
      [...KNOWN_RANKING_KEYS].map((rankingKey) => ({
        rankingKey,
        updatedAt: null,
      })),
    );
  }

  try {
    const snapshot = await readValidatedSnapshot(
      RANKING_ITEMS_SNAPSHOT_KEY,
      parseRankingItemsSnapshot,
    );
    if (!snapshot) {
      warnMissingR2Snapshot(
        { key: RANKING_ITEMS_SNAPSHOT_KEY },
        "ranking_items snapshot が R2 に存在しません",
      );
      return ok([]);
    }
    const rows = excludeGone(snapshot.items)
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
    const snapshot = await readValidatedSnapshot(
      RANKING_ITEMS_SNAPSHOT_KEY,
      parseRankingItemsSnapshot,
    );
    if (!snapshot) {
      warnMissingR2Snapshot(
        { key: RANKING_ITEMS_SNAPSHOT_KEY },
        "ranking_items snapshot が R2 に存在しません",
      );
      return ok(null);
    }
    let max: string | null = null;
    // 退役キーが最新年を押し上げると、どの現役ランキングにも無い年が既定選択になる
    for (const it of excludeGone(snapshot.items)) {
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
    const snapshot = await readValidatedSnapshot(
      RANKING_ITEMS_SNAPSHOT_KEY,
      parseRankingItemsSnapshot,
    );
    if (!snapshot) {
      warnMissingR2Snapshot(
        { key: RANKING_ITEMS_SNAPSHOT_KEY },
        "ranking_items snapshot が R2 に存在しません",
      );
      return ok([]);
    }
    const matched = excludeGone(snapshot.items).filter((it) => {
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
  if (isNextProductionBuild()) {
    return ok([]);
  }

  try {
    const snapshot = await readValidatedSnapshot(
      RANKING_ITEMS_SNAPSHOT_KEY,
      parseRankingItemsSnapshot,
    );
    if (!snapshot) {
      warnMissingR2Snapshot(
        { key: RANKING_ITEMS_SNAPSHOT_KEY },
        "ranking_items snapshot が R2 に存在しません",
      );
      return ok([]);
    }
    const matched = excludeGone(snapshot.items)
      .filter(
        (it) =>
          it.isActive && it.groupKey === groupKey && it.areaType === areaType,
      )
      .sort(compareByRepresentativeThenRecency);

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
  if (isNextProductionBuild()) {
    return err(new Error(`Skip ranking items by tag during production build: ${tagKey}`));
  }

  try {
    const snapshot = await readValidatedSnapshot(
      RANKING_ITEMS_SNAPSHOT_KEY,
      parseRankingItemsSnapshot,
    );
    if (!snapshot) {
      warnMissingR2Snapshot(
        { key: RANKING_ITEMS_SNAPSHOT_KEY },
        "ranking_items snapshot が R2 に存在しません",
      );
      return err(new Error(`No ranking items found for tagKey: ${tagKey}`));
    }
    const matched = excludeGone(snapshot.items)
      .filter(
        (it) =>
          it.isActive && (it.tags ?? []).some((t) => t.tagKey === tagKey),
      )
      .sort(compareByRepresentativeThenRecency);

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

/**
 * ブログ等の複数タグから関連ランキングを 1 回の snapshot read で選ぶ。
 *
 * RankingItem.tags は editorial 任意項目なので、呼び出し側が明示変換した categoryKeys
 * も候補に使う。タグ・カテゴリのどちらにも一致しない指標は出さず、関連性のない
 * 「最新ランキング」で空枠を埋めない。
 */
export async function readRelatedRankingItemsByTagKeysFromR2(
  tagKeys: readonly string[],
  categoryKeys: readonly string[] = [],
): Promise<Result<RankingItem[], Error>> {
  if ((tagKeys.length === 0 && categoryKeys.length === 0) || isNextProductionBuild()) return ok([]);

  try {
    const snapshot = await readValidatedSnapshot(
      RANKING_ITEMS_SNAPSHOT_KEY,
      parseRankingItemsSnapshot,
    );
    if (!snapshot) return ok([]);

    const tags = new Set(tagKeys);
    const categories = new Set(categoryKeys);
    const matched = excludeGone(snapshot.items)
      .filter(
        (item) =>
          item.isActive &&
          item.areaType === "prefecture" &&
          ((typeof item.categoryKey === "string" && categories.has(item.categoryKey)) ||
            (item.tags ?? []).some((tag) => tags.has(tag.tagKey))),
      )
      .sort(compareByRepresentativeThenRecency);

    return ok(matched);
  } catch (error) {
    logger.error(
      { error, tagKeys, categoryKeys },
      "readRelatedRankingItemsByTagKeysFromR2: failed",
    );
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

export async function readFirstKeyByTagFromR2(
  tagKey: string,
): Promise<Result<string, Error>> {
  try {
    const snapshot = await readValidatedSnapshot(
      RANKING_ITEMS_SNAPSHOT_KEY,
      parseRankingItemsSnapshot,
    );
    if (!snapshot) {
      warnMissingR2Snapshot(
        { key: RANKING_ITEMS_SNAPSHOT_KEY },
        "ranking_items snapshot が R2 に存在しません",
      );
      return err(new Error(`First ranking key not found for tagKey: ${tagKey}`));
    }
    const matched = excludeGone(snapshot.items)
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
