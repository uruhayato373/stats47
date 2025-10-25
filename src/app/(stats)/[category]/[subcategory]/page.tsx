import Link from "next/link";

import { MapPin, TrendingUp } from "lucide-react";
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

import { listCategories } from "@/features/category";


/**
 * サブカテゴリページのプロパティ
 */
interface PageProps {
  params: Promise<{
    category: string;
    subcategory: string;
  }>;
}

/**
 * サブカテゴリページのメタデータを生成
 * SEO対応のためのタイトルと説明を動的に生成
 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category, subcategory } = await params;
  const categories = listCategories();
  const categoryData = categories.find((cat) => cat.id === category);
  const subcategoryData = categoryData?.subcategories?.find(
    (sub) => sub.id === subcategory
  );

  return {
    title: `${subcategoryData?.name || subcategory} - ${
      categoryData?.name || category
    }`,
    description: `${categoryData?.name || category}の${
      subcategoryData?.name || subcategory
    }に関する統計データを表示`,
    openGraph: {
      title: `${subcategoryData?.name || subcategory} - ${
        categoryData?.name || category
      }`,
      description: `${categoryData?.name || category}の${
        subcategoryData?.name || subcategory
      }に関する統計データを表示`,
      type: "article",
    },
  };
}

/**
 * サブカテゴリページコンポーネント
 * 統計カテゴリのサブカテゴリ詳細ページを表示
 * ランキングや地域別ダッシュボードなどの機能へのリンクを提供
 */
export default async function SubcategoryPage({ params }: PageProps) {
  const { category, subcategory } = await params;
  const categories = listCategories();
  const categoryData = categories.find((cat) => cat.id === category);
  const subcategoryData = categoryData?.subcategories?.find(
    (sub) => sub.id === subcategory
  );

  // カテゴリまたはサブカテゴリが見つからない場合は404ページを表示
  if (!categoryData || !subcategoryData) {
    return (
      <NotFoundMessage
        title="ページが見つかりません"
        message="指定されたページは存在しません。"
        buttonText="トップページに戻る"
        buttonHref="/"
      />
    );
  }

  // サブカテゴリで利用可能な機能一覧
  const features = [
    {
      title: "ランキング",
      description: "都道府県別のランキングを表示",
      icon: TrendingUp,
      href: `/${category}/${subcategory}/ranking`,
    },
    {
      title: "地域別ダッシュボード",
      description: "全国および各都道府県の詳細データ",
      icon: MapPin,
      href: `/${category}/${subcategory}/area`,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ページヘッダー */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          {subcategoryData.name}
        </h1>
        <p className="text-xl text-muted-foreground">
          {categoryData.name}
          に関する統計データを様々な角度から分析・可視化できます
        </p>
      </div>

      {/* 機能カード一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card
              key={feature.title}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </div>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href={feature.href}>詳細を見る</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
