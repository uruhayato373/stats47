import Link from "next/link";

import { ChevronRight } from "lucide-react";
import { Metadata } from "next";

import { Button } from "@/components/atoms/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/ui/card";
import { NotFoundMessage } from "@/components/molecules/errors/NotFoundMessage";

import { listCategories } from "@/features/category/repositories/category-repository";

/**
 * カテゴリページのProps型定義
 */
interface PageProps {
  params: Promise<{
    category: string;
  }>;
}

/**
 * カテゴリページのメタデータを生成
 * SEOとOGPタグの設定を行う
 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category } = await params;
  const categories = await listCategories();
  const categoryData = categories.find((cat) => cat.categoryKey === category);

  return {
    title: categoryData?.categoryName || category,
    description: `${categoryData?.categoryName || category}に関する統計データを表示`,
    openGraph: {
      title: categoryData?.categoryName || category,
      description: `${categoryData?.categoryName || category}に関する統計データを表示`,
      type: "article",
    },
  };
}

/**
 * カテゴリページのメインコンポーネント
 *
 * 指定されたカテゴリの統計データ一覧を表示するページです。
 * カテゴリが存在しない場合は404エラーメッセージを表示します。
 *
 * @param params - URLパラメータ（カテゴリID）
 * @returns カテゴリページのJSX要素
 */
export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params;
  const categories = await listCategories();
  const categoryData = categories.find((cat) => cat.categoryKey === category);

  // カテゴリが存在しない場合のエラーハンドリング
  if (!categoryData) {
    return (
      <NotFoundMessage
        title="カテゴリが見つかりません"
        message={`指定されたカテゴリ「${category}」は存在しません。`}
        buttonText="トップページに戻る"
        buttonHref="/"
      />
    );
  }

  return (
    <div>
      {/* サブカテゴリ一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categoryData.subcategories.map((subcategory) => (
          <Card
            key={subcategory.subcategoryName}
            className="hover:shadow-lg transition-shadow"
          >
            <CardHeader>
              <CardTitle className="text-xl">{subcategory.subcategoryName}</CardTitle>
              <CardDescription>
                {subcategory.subcategoryName}に関する詳細な統計データを表示
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href={`/${category}/${subcategory.subcategoryKey}`}>
                  詳細を見る
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
