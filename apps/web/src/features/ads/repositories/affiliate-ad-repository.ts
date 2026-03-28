
import { affiliateAds } from "@stats47/database/schema";
import { getDrizzle } from "@stats47/database/server";
import { and, desc, eq, gte, inArray, isNull, lte, or } from "drizzle-orm";

import type { AffiliateLocationCode } from "../types";

export type AffiliateAdRow = typeof affiliateAds.$inferSelect;

/** アクティブ期間フィルター */
function activeFilters() {
  const now = new Date().toISOString().slice(0, 10);
  return [
    eq(affiliateAds.isActive, true),
    or(isNull(affiliateAds.startDate), lte(affiliateAds.startDate, now)),
    or(isNull(affiliateAds.endDate), gte(affiliateAds.endDate, now)),
  ];
}

/**
 * categoryKey に対応するアクティブなテキスト広告を優先度順で取得する。
 * 期間外・非アクティブは除外する。
 */
export async function findActiveAdByCategory(
  categoryKey: string,
  locationCode: AffiliateLocationCode = "sidebar-bottom"
): Promise<AffiliateAdRow | null> {
  const db = getDrizzle();

  const result = await db
    .select()
    .from(affiliateAds)
    .where(
      and(
        eq(affiliateAds.categoryKey, categoryKey),
        eq(affiliateAds.locationCode, locationCode),
        eq(affiliateAds.adType, "text"),
        ...activeFilters()
      )
    )
    .orderBy(desc(affiliateAds.priority))
    .limit(1);

  return result[0] ?? null;
}

/**
 * categoryKey に対応するアクティブなバナー広告を優先度順で取得する。
 */
export async function findActiveBannersByCategory(
  categoryKey: string,
  limit = 2
) {
  const db = getDrizzle();

  return db
    .select()
    .from(affiliateAds)
    .where(
      and(
        eq(affiliateAds.categoryKey, categoryKey),
        eq(affiliateAds.adType, "banner"),
        ...activeFilters()
      )
    )
    .orderBy(desc(affiliateAds.priority))
    .limit(limit);
}

/**
 * 複数の categoryKey に対応するアクティブなバナー広告を一括取得する。
 */
export async function findActiveBannersByCategoryKeys(
  categoryKeys: string[],
  limit = 2
) {
  if (categoryKeys.length === 0) return [];

  const db = getDrizzle();

  return db
    .select()
    .from(affiliateAds)
    .where(
      and(
        inArray(affiliateAds.categoryKey, categoryKeys),
        eq(affiliateAds.adType, "banner"),
        ...activeFilters()
      )
    )
    .orderBy(desc(affiliateAds.priority))
    .limit(limit);
}

/**
 * locationCode に対応するアクティブなバナー広告を優先度順で全件取得する。
 * カテゴリ不問。サイドバー等のスロット向け。
 */
export async function findActiveBannersByLocation(
  locationCode: AffiliateLocationCode,
  limit = 10
) {
  const db = getDrizzle();

  return db
    .select()
    .from(affiliateAds)
    .where(
      and(
        eq(affiliateAds.locationCode, locationCode),
        eq(affiliateAds.adType, "banner"),
        ...activeFilters()
      )
    )
    .orderBy(desc(affiliateAds.priority))
    .limit(limit);
}
