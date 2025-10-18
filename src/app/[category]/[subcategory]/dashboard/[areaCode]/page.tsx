import React from "react";
import { notFound } from "next/navigation";
import { getSubcategoryById } from "@/lib/category";
// import { getDashboardComponentByArea } from "@/components/subcategories";

/**
 * ダッシュボードページのProps型定義
 */
interface PageProps {
  params: Promise<{
    category: string;
    subcategory: string;
    areaCode: string;
  }>;
}

/**
 * ダッシュボード統計データ表示ページ
 *
 * このページは、特定のカテゴリとサブカテゴリの統計データを
 * 全国（areaCode="00000"）または都道府県別で表示します。
 *
 * ルート構造: /[category]/[subcategory]/dashboard/[areaCode]
 * 例: /population/basic-population/dashboard/00000 (全国の総人口ダッシュボード)
 * 例: /population/basic-population/dashboard/13000 (東京都の総人口ダッシュボード)
 *
 * @param {PageProps} props - ページのProps
 * @param {Promise<{category: string; subcategory: string; areaCode: string}>} props.params - 動的ルートパラメータ
 *   - category: カテゴリID (例: "population", "laborwage")
 *   - subcategory: サブカテゴリID (例: "basic-population", "households")
 *   - areaCode: 地域コード (例: "00000"=全国, "13000"=東京都)
 *
 * @returns {Promise<JSX.Element>} ダッシュボード統計データ表示コンポーネント
 *
 * @throws {notFound} カテゴリまたはサブカテゴリが存在しない場合
 *
 * @example
 * // 全国の総人口ダッシュボードを表示
 * <DashboardPage
 *   params={{category: "population", subcategory: "basic-population", areaCode: "00000"}}
 * />
 *
 * @example
 * // 東京都の総人口ダッシュボードを表示
 * <DashboardPage
 *   params={{category: "population", subcategory: "basic-population", areaCode: "13000"}}
 * />
 *
 * @since 2.0.0
 * @version 2.0.0
 */
export default async function DashboardPage({ params }: PageProps) {
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

  // ダッシュボードコンポーネントを動的に取得
  // categories.jsonの設定に基づいて適切なコンポーネントを選択
  // const DashboardComponent = getDashboardComponentByArea(
  //   subcategoryId,
  //   areaCode,
  //   categoryId
  // );

  // 一時的にプレースホルダーを表示
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">ダッシュボード</h1>
      <p>カテゴリ: {categoryId}</p>
      <p>サブカテゴリ: {subcategoryId}</p>
      <p>地域コード: {areaCode}</p>
    </div>
  );
}
