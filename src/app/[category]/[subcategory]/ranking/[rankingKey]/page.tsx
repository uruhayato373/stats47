import React from "react";
import { validateSubcategoryOrThrow } from "@/lib/category/subcategory-validator";
import { normalizeCategoryData } from "@/lib/category/category-normalizer";
import { SubcategoryRankingPage } from "@/components/templates/SubcategoryRankingPage";

/**
 * ランキング統計項目ページのProps型定義
 */
interface PageProps {
  params: Promise<{
    category: string;
    subcategory: string;
    rankingKey: string;
  }>;
}

/**
 * 特定の統計項目のランキング表示ページ
 *
 * このページは、特定のカテゴリ、サブカテゴリ、統計項目の統計データを
 * 都道府県別ランキングとして表示します。
 *
 * ルート構造: /[category]/[subcategory]/ranking/[rankingKey]
 * 例: /landweather/land-area/ranking/total-area-excluding
 * 例: /landweather/land-use/ranking/agricultural-land
 *
 * @param props - ページのProps
 * @param props.params - 動的ルートパラメータ
 *   - category: カテゴリID (例: "landweather")
 *   - subcategory: サブカテゴリID (例: "land-area", "land-use")
 *   - rankingKey: 統計項目キー (例: "total-area-excluding", "agricultural-land")
 *
 * @returns ランキング統計データ表示コンポーネント
 *
 * @throws {notFound} カテゴリ、サブカテゴリ、または統計項目が存在しない場合
 *
 * @example
 * // 土地面積（除く）の都道府県ランキングを表示
 * <RankingItemPage
 *   params={{category: "landweather", subcategory: "land-area", rankingKey: "total-area-excluding"}}
 * />
 *
 * @since 2.1.0
 * @version 2.1.0
 */
export default async function RankingItemPage({ params }: PageProps) {
  // 動的ルートパラメータを取得
  const {
    category: categoryId,
    subcategory: subcategoryId,
    rankingKey,
  } = await params;

  // サブカテゴリのバリデーション（無効な場合は404エラーを発生）
  const subcategoryData = validateSubcategoryOrThrow(categoryId, subcategoryId);

  // カテゴリデータを正規化
  const normalizedCategory = normalizeCategoryData(
    subcategoryData.category as any
  );

  // サブカテゴリランキングページコンポーネントをレンダリング
  // rankingKeyをpropsとして渡す
  return (
    <SubcategoryRankingPage
      category={normalizedCategory as any}
      subcategory={subcategoryData.subcategory as any}
      rankingKey={rankingKey}
    />
  );
}
