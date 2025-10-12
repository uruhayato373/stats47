/**
 * ランキング項目データ取得関数
 * データベースからランキング設定を取得し、型安全な形式で返す
 */

import { RankingItem } from "@/types/models/ranking";

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
