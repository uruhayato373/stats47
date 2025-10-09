import { redirect } from "next/navigation";

/**
 * サブカテゴリページのProps型定義
 */
interface PageProps {
  params: Promise<{
    category: string;
    subcategory: string;
  }>;
}

/**
 * サブカテゴリページ - ランキングにリダイレクト
 *
 * 旧URL構造: /[category]/[subcategory]
 * 新URL構造: /[category]/[subcategory]/ranking
 *
 * @param {PageProps} props - ページのProps
 */
export default async function SubcategoryPage({ params }: PageProps) {
  const { category, subcategory } = await params;
  redirect(`/${category}/${subcategory}/ranking`);
}
