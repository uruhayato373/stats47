import { Metadata } from "next";

import { AreaPageClient } from "./AreaPageClient";

/**
 * 地域別ダッシュボードページのProps型定義
 */
interface PageProps {
  params: Promise<{
    category: string;
    subcategory: string;
  }>;
}

/**
 * 地域別ダッシュボードページのメタデータを生成
 * SEO対応のためのタイトルと説明を動的に生成
 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category, subcategory } = await params;

  return {
    title: `${subcategory} 地域別ダッシュボード - ${category}`,
    description: `${category}の${subcategory}に関する地域別統計ダッシュボード`,
  };
}

/**
 * 地域別ダッシュボードページのメインコンポーネント（サーバーコンポーネント）
 *
 * 指定されたカテゴリとサブカテゴリの地域別統計データを表示するページです。
 * 地域選択機能とダッシュボード表示機能を提供します。
 *
 * @returns 地域別ダッシュボードページのJSX要素
 */
export default function AreaPage() {
  return <AreaPageClient />;
}
