import "server-only";

/**
 * ランキングトップページのデータ取得・変換ロジック
 *
 * app/ranking/page.tsx から抽出。page.tsx を薄いラッパーに保つ。
 */
import {
  readFeaturedRankingItemsFromR2,
} from "@stats47/ranking/server";
import { isOk, unwrap } from "@stats47/types";

import type { CategoryGridItem } from "@/features/category";
import { listCategories } from "@/features/category/server";
import {
  normalizeRankingItemProperties,
  type RankingItem,
} from "@/features/ranking";

/** おすすめランキングの表示用データ */
export interface FeaturedRankingItemView {
  rankingKey: string;
  areaType: string;
  title: string;
  subtitle?: string | null;
  latestYear?: string;
  unit: string;
  demographicAttr?: string | null;
  normalizationBasis?: string | null;
  definition?: string | null;
  baseThumbnailUrl: string;
}

/** ランキングトップページの全データ */
export interface RankingTopPageData {
  featuredItems: FeaturedRankingItemView[];
  categories: CategoryGridItem[];
}

/**
 * ランキングトップページに必要な全データを取得・整形する
 */
export async function loadRankingTopPageData(): Promise<RankingTopPageData> {
  // 並列でデータ取得
  const featuredTask = readFeaturedRankingItemsFromR2(6).then((r) =>
    isOk(r) ? r.data : []
  );
  const allCategories = unwrap(await listCategories());
  const featuredItemsRaw = await featuredTask;

  // おすすめランキングの整形
  const featuredItems = buildFeaturedItems(featuredItemsRaw);

  // カテゴリ一覧を構築
  const categories: CategoryGridItem[] = allCategories.map((c) => ({
    categoryKey: c.categoryKey,
    categoryName: c.categoryName,
    icon: c.icon,
  }));

  return { featuredItems, categories };
}

/**
 * おすすめランキングを表示用データに変換する（重複排除含む）
 */
function buildFeaturedItems(
  rawItems: RankingItem[]
): FeaturedRankingItemView[] {
  const r2PublicUrl =
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
    "https://storage.stats47.jp";

  const seen = new Set<string>();
  return rawItems
    .filter((item) => {
      if (seen.has(item.rankingKey)) return false;
      seen.add(item.rankingKey);
      return true;
    })
    .map((item) => {
      const normalized = normalizeRankingItemProperties(item);
      const latestYear =
        item.availableYears?.[0]?.yearCode ||
        item.latestYear?.yearCode ||
        "2024";
      const areaType = "prefecture";
      return {
        rankingKey: item.rankingKey,
        areaType: item.areaType,
        title: normalized.displayTitle,
        subtitle: item.subtitle,
        latestYear:
          item.availableYears?.[0]?.yearCode ||
          item.latestYear?.yearCode ||
          undefined,
        unit: item.unit,
        demographicAttr: item.demographicAttr ?? null,
        normalizationBasis: item.normalizationBasis ?? null,
        definition: normalized.displayDescription,
        baseThumbnailUrl: `${r2PublicUrl}/ranking/${areaType}/${item.rankingKey}/${latestYear}/thumbnails/thumbnail`,
      };
    });
}

