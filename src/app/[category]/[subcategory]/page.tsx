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
 * このページは、サブカテゴリのルートURLにアクセスされた際に、
 * デフォルトのランキングページにリダイレクトします。
 *
 * URL構造: /[category]/[subcategory]
 * リダイレクト先: /[category]/[subcategory]/ranking
 *
 * @param props - ページのProps
 */
export default async function SubcategoryPage({ params }: PageProps) {
  const { category, subcategory } = await params;
  redirect(`/${category}/${subcategory}/ranking`);
}
