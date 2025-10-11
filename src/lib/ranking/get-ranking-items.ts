/**
 * ランキング項目データ取得関数
 * データベースからランキング設定を取得し、型安全な形式で返す
 */

export interface RankingItem {
  id: number;
  rankingKey: string;
  label: string;
  statsDataId: string;
  cdCat01: string;
  unit: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
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
 * サブカテゴリのランキング設定を取得
 * @param subcategoryId - サブカテゴリID（例: 'land-area', 'land-use'）
 * @returns Promise<RankingConfigResponse | null>
 */
export async function getRankingConfig(
  subcategoryId: string
): Promise<RankingConfigResponse | null> {
  try {
    // ランキングAPIが一時的に無効化されているため、nullを返す
    console.warn(`ランキングAPIが無効化されています: ${subcategoryId}`);
    return null;
  } catch (error) {
    console.error(
      `ランキング設定の取得に失敗しました (${subcategoryId}):`,
      error
    );
    return null;
  }
}

/**
 * ランキング項目をランキングデータ形式に変換
 * @param rankingItems - ランキング項目配列
 * @returns Record<string, RankingData>
 */
export function convertToRankingData(
  rankingItems: RankingItem[]
): Record<
  string,
  { statsDataId: string; cdCat01: string; unit: string; name: string }
> {
  const rankingData: Record<
    string,
    { statsDataId: string; cdCat01: string; unit: string; name: string }
  > = {};

  rankingItems.forEach((item) => {
    rankingData[item.rankingKey] = {
      statsDataId: item.statsDataId,
      cdCat01: item.cdCat01,
      unit: item.unit,
      name: item.name,
    };
  });

  return rankingData;
}

/**
 * ランキング項目をタブオプション形式に変換
 * @param rankingItems - ランキング項目配列
 * @returns Array<{key: string, label: string}>
 */
export function convertToTabOptions(
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

// フォールバック設定を別ファイルからインポート
export { FALLBACK_CONFIGS } from "./fallback-configs";
