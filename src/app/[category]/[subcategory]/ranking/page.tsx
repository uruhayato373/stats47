import React from "react";
import { notFound, redirect } from "next/navigation";
import { getSubcategoryById } from "@/lib/choropleth/category-helpers";
import { GenericRanking } from "@/components/ranking/GenericRanking";

/**
 * ランキングページのProps型定義
 */
interface PageProps {
  params: Promise<{
    category: string;
    subcategory: string;
  }>;
}

/**
 * ランキング統計データ表示ページ
 *
 * このページは、特定のカテゴリとサブカテゴリの統計データを
 * 都道府県別ランキングとして表示します。
 *
 * ルート構造: /[category]/[subcategory]/ranking
 * 例: /population/basic-population/ranking (総人口の都道府県ランキング)
 * 例: /laborwage/wages-working-conditions/ranking (賃金の都道府県ランキング)
 *
 * land-areaとland-useの場合は最初の統計項目にリダイレクトします。
 *
 * @param {PageProps} props - ページのProps
 * @param {Promise<{category: string; subcategory: string}>} props.params - 動的ルートパラメータ
 *   - category: カテゴリID (例: "population", "laborwage")
 *   - subcategory: サブカテゴリID (例: "basic-population", "wages-working-conditions")
 *
 * @returns {Promise<JSX.Element>} ランキング統計データ表示コンポーネント
 *
 * @throws {notFound} カテゴリまたはサブカテゴリが存在しない場合
 *
 * @example
 * // 総人口の都道府県ランキングを表示
 * <RankingPage
 *   params={{category: "population", subcategory: "basic-population"}}
 * />
 *
 * @example
 * // 賃金の都道府県ランキングを表示
 * <RankingPage
 *   params={{category: "laborwage", subcategory: "wages-working-conditions"}}
 * />
 *
 * @since 2.0.0
 * @version 2.1.0
 */
export default async function RankingPage({ params }: PageProps) {
  // 動的ルートパラメータを取得
  const { category: categoryId, subcategory: subcategoryId } = await params;

  // カテゴリとサブカテゴリの存在確認
  // 指定されたサブカテゴリIDが存在するかチェック
  const subcategoryData = getSubcategoryById(subcategoryId);

  // カテゴリIDとサブカテゴリIDの整合性チェック
  // サブカテゴリが存在しない、または指定されたカテゴリに属していない場合は404を返す
  if (!subcategoryData || subcategoryData.category.id !== categoryId) {
    notFound();
  }

  // land-areaとland-useの場合は最初の統計項目にリダイレクト
  if (subcategoryId === "land-area") {
    redirect(`/${categoryId}/${subcategoryId}/ranking/total-area-excluding`);
  }

  if (subcategoryId === "land-use") {
    redirect(`/${categoryId}/${subcategoryId}/ranking/agricultural-land`);
  }

  // サブカテゴリデータからカテゴリとサブカテゴリ情報を取得
  const { category, subcategory } = subcategoryData;

  // 汎用ランキングコンポーネントをレンダリング
  return <GenericRanking category={category} subcategory={subcategory} />;
}
