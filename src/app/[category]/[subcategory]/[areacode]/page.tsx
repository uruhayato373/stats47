import React from "react";
import { notFound } from "next/navigation";
import { getSubcategoryById } from "@/lib/choropleth/category-helpers";
import { getAreaPageComponent } from "@/components/subcategories";

/**
 * 都道府県別ページのProps型定義
 *
 * @interface PageProps
 * @property {Promise<{category: string; subcategory: string; areaCode: string}>} params - 動的ルートパラメータ
 */
interface PageProps {
  params: Promise<{
    category: string;
    subcategory: string;
    areaCode: string;
  }>;
}

/**
 * 都道府県別統計データ表示ページ
 *
 * このページは、特定のカテゴリとサブカテゴリの統計データを
 * 指定された都道府県（areaCode）について表示します。
 *
 * ルート構造: /[category]/[subcategory]/[areaCode]
 * 例: /population/households/13000 (東京都の世帯統計)
 *
 * @param {PageProps} props - ページのProps
 * @param {Promise<{category: string; subcategory: string; areaCode: string}>} props.params - 動的ルートパラメータ
 *   - category: カテゴリID (例: "population", "laborwage")
 *   - subcategory: サブカテゴリID (例: "households", "marriage")
 *   - areaCode: 都道府県コード (例: "13000"=東京都, "27000"=大阪府)
 *
 * @returns {Promise<JSX.Element>} 都道府県別統計データ表示コンポーネント
 *
 * @throws {notFound} カテゴリまたはサブカテゴリが存在しない場合
 *
 * @example
 * // 東京都の世帯統計を表示
 * <AreaPage
 *   params={{category: "population", subcategory: "households", areaCode: "13000"}}
 * />
 *
 * @example
 * // 大阪府の婚姻統計を表示
 * <AreaPage
 *   params={{category: "population", subcategory: "marriage", areaCode: "27000"}}
 * />
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export default async function AreaPage({ params }: PageProps) {
  // 動的ルートパラメータを取得
  const {
    category: categoryId,
    subcategory: subcategoryId,
    areaCode,
  } = await params;

  // カテゴリとサブカテゴリの存在確認
  // 指定されたサブカテゴリIDが存在するかチェック
  const subcategoryData = getSubcategoryById(subcategoryId);

  // カテゴリIDとサブカテゴリIDの整合性チェック
  // サブカテゴリが存在しない、または指定されたカテゴリに属していない場合は404を返す
  if (!subcategoryData || subcategoryData.category.id !== categoryId) {
    notFound();
  }

  // サブカテゴリデータからカテゴリとサブカテゴリ情報を取得
  const { category, subcategory } = subcategoryData;

  // 都道府県別ページコンポーネントを動的に取得
  // categories.jsonの設定に基づいて適切なコンポーネントを選択
  const AreaPageComponent = getAreaPageComponent(subcategoryId);

  // 都道府県別統計データ表示コンポーネントをレンダリング
  return (
    <AreaPageComponent
      category={category}
      subcategory={subcategory}
      areaCode={areaCode}
    />
  );
}
