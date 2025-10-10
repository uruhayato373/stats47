import React from "react";
import { notFound } from "next/navigation";
import { getSubcategoryById } from "@/lib/choropleth/category-helpers";
import { getRankingComponent } from "@/components/subcategories";

/**
 * ランキング統計項目ページのProps型定義
 */
interface PageProps {
  params: Promise<{
    category: string;
    subcategory: string;
    rankingId: string;
  }>;
}

/**
 * 特定の統計項目のランキング表示ページ
 *
 * このページは、特定のカテゴリ、サブカテゴリ、統計項目の統計データを
 * 都道府県別ランキングとして表示します。
 *
 * ルート構造: /[category]/[subcategory]/ranking/[rankingId]
 * 例: /landweather/land-area/ranking/total-area-excluding
 * 例: /landweather/land-use/ranking/agricultural-land
 *
 * @param {PageProps} props - ページのProps
 * @param {Promise<{category: string; subcategory: string; rankingId: string}>} props.params - 動的ルートパラメータ
 *   - category: カテゴリID (例: "landweather")
 *   - subcategory: サブカテゴリID (例: "land-area", "land-use")
 *   - rankingId: 統計項目ID (例: "total-area-excluding", "agricultural-land")
 *
 * @returns {Promise<JSX.Element>} ランキング統計データ表示コンポーネント
 *
 * @throws {notFound} カテゴリ、サブカテゴリ、または統計項目が存在しない場合
 *
 * @example
 * // 土地面積（除く）の都道府県ランキングを表示
 * <RankingItemPage
 *   params={{category: "landweather", subcategory: "land-area", rankingId: "total-area-excluding"}}
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
    rankingId,
  } = await params;

  // カテゴリとサブカテゴリの存在確認
  const subcategoryData = getSubcategoryById(subcategoryId);

  // カテゴリIDとサブカテゴリIDの整合性チェック
  if (!subcategoryData || subcategoryData.category.id !== categoryId) {
    notFound();
  }

  // サブカテゴリデータからカテゴリとサブカテゴリ情報を取得
  const { category, subcategory } = subcategoryData;

  // ランキングコンポーネントを動的に取得
  const RankingComponent = getRankingComponent(subcategoryId, categoryId);

  // ランキング統計データ表示コンポーネントをレンダリング
  // rankingIdをpropsとして渡す
  return (
    <RankingComponent
      category={category}
      subcategory={subcategory}
      rankingId={rankingId}
    />
  );
}
