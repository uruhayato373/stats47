/**
 * ランキング項目データ取得関数
 * データベースからランキング設定を取得し、型安全な形式で返す
 */

export interface RankingItem {
  id: number;
  subcategoryId: string;
  rankingKey: string;
  label: string;
  statsDataId: string;
  cdCat01: string;
  unit: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubcategoryConfig {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  defaultRankingKey: string;
}

export interface RankingConfigResponse {
  subcategory: SubcategoryConfig;
  rankingItems: RankingItem[];
}
/**
 * サブカテゴリのランキング項目をデータベースから取得
 * @param subcategoryId - サブカテゴリID（例: 'land-area', 'land-use'）
 * @returns Promise<RankingConfigResponse | null>
 */
export async function fetchRankingItemsBySubcategory(
  subcategoryId: string
): Promise<RankingConfigResponse | null> {
  try {
    // APIエンドポイントを呼び出してデータベースから取得
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const url = `${baseUrl}/api/ranking-items/subcategory/${encodeURIComponent(
      subcategoryId
    )}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // キャッシュを活用
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      console.warn(
        `ランキング設定APIエラー (${subcategoryId}): ${response.status}`
      );
      return null;
    }

    const config = (await response.json()) as RankingConfigResponse;
    return config;
  } catch (error) {
    console.error(
      `ランキング設定の取得に失敗しました (${subcategoryId}):`,
      error
    );
    return null;
  }
}

/**
 * ランキング項目をタブオプション形式にマッピング
 * @param rankingItems - ランキング項目配列
 * @returns Array<{key: string, label: string}>
 */
export function mapRankingItemsToTabOptions(
  rankingItems: RankingItem[]
): Array<{ key: string; label: string }> {
  return rankingItems
    .filter((item) => item.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((item) => ({
      key: item.rankingKey,
      label: item.label,
    }));
}
