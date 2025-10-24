import { Button } from "@/components/atoms/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/ui/card";
import { listCategories } from "@/features/category";
import { getCategoryIcon } from "@/lib/utils/get-category-icon";
import { ChevronRight } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

interface PageProps {
  params: Promise<{
    category: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category } = await params;
  const categories = listCategories();
  const categoryData = categories.find((cat) => cat.id === category);

  return {
    title: categoryData?.name || category,
    description: `${categoryData?.name || category}に関する統計データを表示`,
    openGraph: {
      title: categoryData?.name || category,
      description: `${categoryData?.name || category}に関する統計データを表示`,
      type: "article",
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params;
  const categories = listCategories();
  const categoryData = categories.find((cat) => cat.id === category);

  if (!categoryData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            カテゴリが見つかりません
          </h1>
          <p className="text-muted-foreground mb-6">
            指定されたカテゴリ「{category}」は存在しません。
          </p>
          <Button asChild>
            <Link href="/">トップページに戻る</Link>
          </Button>
        </div>
      </div>
    );
  }

  const Icon = getCategoryIcon(categoryData.icon);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">
            {categoryData.name}
          </h1>
        </div>
        <p className="text-xl text-muted-foreground">
          {categoryData.name}
          に関する統計データを様々な角度から分析・可視化できます
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categoryData.subcategories.map((subcategory) => (
          <Card
            key={subcategory.id}
            className="hover:shadow-lg transition-shadow"
          >
            <CardHeader>
              <CardTitle className="text-xl">{subcategory.name}</CardTitle>
              <CardDescription>
                {subcategory.name}に関する詳細な統計データを表示
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href={`/${category}/${subcategory.id}`}>
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
