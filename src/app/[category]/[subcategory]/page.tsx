import React from "react";
import { notFound } from "next/navigation";
import { getSubcategoryById } from "@/lib/choropleth/category-helpers";
import { getSubcategoryComponent } from "@/components/subcategories";

/**
 * サブカテゴリページのProps型定義
 *
 * @interface PageProps
 * @property {Promise<{category: string; subcategory: string}>} params - 動的ルートパラメータ
 */
interface PageProps {
  params: Promise<{
    category: string;
    subcategory: string;
  }>;
}

/**
 * サブカテゴリ統計データ表示ページ
 *
 * このページは、特定のカテゴリとサブカテゴリの統計データを
 * 全国レベルで表示します。都道府県別の詳細データは
 * /[category]/[subcategory]/[areaCode] で表示されます。
 *
 * ルート構造: /[category]/[subcategory]
 * 例: /population/households (全国の世帯統計)
 * 例: /population/marriage (全国の婚姻統計)
 *
 * @param {PageProps} props - ページのProps
 * @param {Promise<{category: string; subcategory: string}>} props.params - 動的ルートパラメータ
 *   - category: カテゴリID (例: "population", "laborwage")
 *   - subcategory: サブカテゴリID (例: "households", "marriage")
 *
 * @returns {Promise<JSX.Element>} サブカテゴリ統計データ表示コンポーネント
 *
 * @throws {notFound} カテゴリまたはサブカテゴリが存在しない場合
 *
 * @example
 * // 全国の世帯統計を表示
 * <SubcategoryPage
 *   params={{category: "population", subcategory: "households"}}
 * />
 *
 * @example
 * // 全国の婚姻統計を表示
 * <SubcategoryPage
 *   params={{category: "population", subcategory: "marriage"}}
 * />
 *
 * @example
 * // 労働・賃金の賃金・勤労条件統計を表示
 * <SubcategoryPage
 *   params={{category: "laborwage", subcategory: "wages-working-conditions"}}
 * />
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export default async function SubcategoryPage({ params }: PageProps) {
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

  // サブカテゴリデータからカテゴリとサブカテゴリ情報を取得
  const { category, subcategory } = subcategoryData;

  // サブカテゴリーIDに対応するコンポーネントを動的に取得
  // categories.jsonの設定に基づいて適切なコンポーネントを選択
  const SubcategoryComponent = getSubcategoryComponent(
    subcategoryId,
    categoryId
  );

  // サブカテゴリ統計データ表示コンポーネントをレンダリング
  return <SubcategoryComponent category={category} subcategory={subcategory} />;
}
