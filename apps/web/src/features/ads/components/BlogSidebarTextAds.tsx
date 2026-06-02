import "server-only";

import { TAG_AFFILIATE_MAP, type AffiliateCategory } from "../constants/affiliate-category";
import { resolveAffiliateTextAdsByTagKeys } from "../services";

import { AffiliateTextAdList } from "./AffiliateTextAdList";

interface BlogSidebarTextAdsProps {
  tagKeys: string[];
  /** 並べて表示するテキストリンクの最大件数 */
  limit?: number;
}

/**
 * ブログ記事サイドバー用のテキストリンク広告 (複数)。
 * 記事の tagKeys から AffiliateCategory を推定し、該当する text 広告を最大 limit 件並べる。
 * server-only (R2 snapshot reader 依存) のため barrel export せず直接 import する。
 */
export async function BlogSidebarTextAds({ tagKeys, limit = 2 }: BlogSidebarTextAdsProps) {
  const ads = await resolveAffiliateTextAdsByTagKeys(tagKeys, "sidebar-bottom", limit);
  if (ads.length === 0) return null;

  // テーマカラーは最初にマッチした AffiliateCategory を採用
  const affiliateCategory =
    (tagKeys.map((t) => TAG_AFFILIATE_MAP[t]).find(Boolean) as AffiliateCategory | undefined) ??
    null;

  return (
    <AffiliateTextAdList ads={ads} affiliateCategory={affiliateCategory} position="sidebar" />
  );
}
