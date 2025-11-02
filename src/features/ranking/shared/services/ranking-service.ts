/**
 * ランキングデータ管理サービス
 *
 * ランキング関連のAPI呼び出しとデータ取得を一元管理
 */

import type { RankingItem } from "../../items/types";

export interface RankingConfig {
  subcategory: {
    defaultRankingKey: string;
  };
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
 * サブカテゴリのデフォルトランキングキーを取得
 * @param subcategoryId サブカテゴリID
 * @returns デフォルトランキングキー（存在しない場合はnull）
 */
export async function fetchDefaultRankingKey(
  subcategoryId: string
): Promise<string | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const url = `${baseUrl}/api/ranking-items/${encodeURIComponent(
      subcategoryId
    )}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const config = (await response.json()) as RankingConfig;
      return config.subcategory.defaultRankingKey;
    }

    return null;
  } catch (error) {
    console.warn(
      `デフォルトランキングキーの取得に失敗しました (${subcategoryId}):`,
      error
    );
    return null;
  }
}

/**
 * ランキングアイテムの設定を取得
 * @param subcategoryId サブカテゴリID
 * @returns ランキング設定オブジェクト
 */
export async function fetchRankingConfig(
  subcategoryId: string
): Promise<RankingConfig | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const url = `${baseUrl}/api/ranking-items/${encodeURIComponent(
      subcategoryId
    )}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      return (await response.json()) as RankingConfig;
    }

    return null;
  } catch (error) {
    console.warn(
      `ランキング設定の取得に失敗しました (${subcategoryId}):`,
      error
    );
    return null;
  }
}

/**
 * サブカテゴリのランキング項目を取得（可視化設定も含む）
 * @param subcategoryId - サブカテゴリID（例: 'land-area', 'land-use'）
 * @returns Promise<RankingConfigResponse | null>
 */
export async function fetchRankingItemsBySubcategory(
  subcategoryId: string
): Promise<RankingConfigResponse | null> {
  try {
    // APIエンドポイントを呼び出してデータベースから取得
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const url = `${baseUrl}/api/rankings/items/subcategory/${encodeURIComponent(
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
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const url = `${baseUrl}/api/ranking-items/${itemId}/visualization`;

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

