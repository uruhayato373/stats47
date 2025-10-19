/**
 * ランキング項目データ取得関数
 * データベースからランキング設定を取得し、型安全な形式で返す
 * （可視化設定も含む）
 */

import { RankingItem } from "@/lib/ranking/types";

export interface SubcategoryConfig {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  defaultRankingKey: string;
}

export interface RankingConfigResponse {
  subcategory: SubcategoryConfig;
  rankingItems: RankingItem[]; // 可視化設定も含む
}

/**
 * サブカテゴリのランキング項目をデータベースから取得
 * （可視化設定も含む）
 * @param subcategoryId - サブカテゴリID（例: 'land-area', 'land-use'）
 * @returns Promise<RankingConfigResponse | null>
 */
export async function fetchRankingItemsBySubcategory(
  subcategoryId: string
): Promise<RankingConfigResponse | null> {
  try {
    // APIエンドポイントを呼び出してデータベースから取得
    const url = `/api/rankings/items/subcategory/${encodeURIComponent(
      subcategoryId
    )}`;

    console.log(`Fetching ranking items for subcategory: ${subcategoryId}`);
    console.log(`API URL: ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // キャッシュを活用
      next: { revalidate: 300 },
    });

    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
      console.warn(
        `ランキング設定APIエラー (${subcategoryId}): ${response.status}`
      );
      return null;
    }

    const config = (await response.json()) as RankingConfigResponse;
    console.log(`Fetched config:`, config);
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
 * 可視化設定を更新
 * @param itemId - ランキング項目のID
 * @param settings - 更新する可視化設定
 * @returns Promise<{ success: boolean; error?: string }>
 */
export async function updateVisualizationSettings(
  itemId: number,
  settings: {
    mapColorScheme?: string;
    mapDivergingMidpoint?: string;
    rankingDirection?: "asc" | "desc";
    conversionFactor?: number;
    decimalPlaces?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = `/api/ranking-items/${itemId}/visualization`;

    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as { error?: string };
      return { success: false, error: errorData.error || "Update failed" };
    }

    return { success: true };
  } catch (error) {
    console.error("可視化設定の更新に失敗しました:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
