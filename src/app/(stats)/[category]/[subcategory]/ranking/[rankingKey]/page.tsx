import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeft, TrendingUp } from "lucide-react";
import { Metadata } from "next";

import { Badge } from "@/components/atoms/ui/badge";
import { Button } from "@/components/atoms/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/ui/card";

import { getRankingItemByKey } from "@/data/mock/ranking-items";

/**
 * ランキング詳細ページのProps型定義
 */
interface PageProps {
  params: Promise<{
    category: string;
    subcategory: string;
    rankingKey: string;
  }>;
}

/**
 * ランキング詳細ページのメタデータを生成
 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category, subcategory, rankingKey } = await params;

  // ランキング項目情報を取得
  const rankingItem = getRankingItemByKey(rankingKey);

  const title = rankingItem
    ? `${rankingItem.label} ランキング - ${subcategory} - ${category}`
    : `${rankingKey} ランキング - ${subcategory} - ${category}`;

  const description = rankingItem
    ? `${category}の${subcategory}に関する${rankingItem.label}の都道府県ランキング`
    : `${category}の${subcategory}に関する${rankingKey}の都道府県ランキング`;

  return {
    title,
    description,
  };
}

/**
 * ランキング詳細ページのメインコンポーネント
 */
export default async function RankingKeyPage({ params }: PageProps) {
  const { category, subcategory, rankingKey } = await params;

  // ランキング項目情報を取得
  const rankingItem = getRankingItemByKey(rankingKey);

  // ランキング項目が見つからない場合は404ページを表示
  if (!rankingItem) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/${category}/${subcategory}/ranking`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              ランキング一覧に戻る
            </Link>
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {rankingItem.label}
          </h1>
          <p className="text-muted-foreground">
            {category}の{subcategory}に関する都道府県ランキング
          </p>
        </div>
      </div>

      {/* ランキング項目情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            ランキング項目情報
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">
                項目名
              </h4>
              <p className="text-sm">{rankingItem.name}</p>
            </div>

            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">
                単位
              </h4>
              <Badge variant="secondary">{rankingItem.unit}</Badge>
            </div>

            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">
                ランキング方向
              </h4>
              <p className="text-sm">
                {rankingItem.ranking_direction === "desc"
                  ? "降順（大きい順）"
                  : "昇順（小さい順）"}
              </p>
            </div>

            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">
                データソース
              </h4>
              <p className="text-sm">{rankingItem.data_source_id}</p>
            </div>
          </div>

          {rankingItem.description && rankingItem.description !== "null" && (
            <div className="mt-4">
              <h4 className="font-medium text-sm text-muted-foreground mb-1">
                説明
              </h4>
              <p className="text-sm">{rankingItem.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ランキングデータ表示エリア */}
      <Card>
        <CardHeader>
          <CardTitle>ランキングデータ</CardTitle>
          <CardDescription>
            都道府県別のランキングデータを表示します
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              ランキングデータの表示機能は準備中です
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              ランキングキー: {rankingKey}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
