import { redirect } from "next/navigation";

/**
 * ダッシュボードページのProps型定義
 */
interface PageProps {
  params: Promise<{
    category: string;
    subcategory: string;
  }>;
}

/**
 * ダッシュボードページ - 全国ダッシュボードにリダイレクト
 *
 * このページは、サブカテゴリのダッシュボードURLにアクセスされた際に、
 * 全国（areaCode: 00000）のダッシュボードページにリダイレクトします。
 *
 * URL構造: /[category]/[subcategory]/dashboard
 * リダイレクト先: /[category]/[subcategory]/dashboard/00000
 *
 * @param props - ページのProps
 */
export default async function DashboardPage({ params }: PageProps) {
  const { category, subcategory } = await params;
  redirect(`/${category}/${subcategory}/dashboard/00000`);
}
