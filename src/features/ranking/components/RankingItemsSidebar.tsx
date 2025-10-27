import { AlertCircle, TrendingUp } from "lucide-react";

import { Alert, AlertDescription } from "@/components/atoms/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/ui/card";

import { fetchRankingItemsBySubcategory } from "../ranking-items";

import { RankingItemCard } from "./RankingItemCard";

import type { RankingItem, RankingItemsSidebarProps } from "../types";

/**
 * ランキング項目を表示するサイドバーコンポーネント
 *
 * 利用可能なランキング項目を一覧表示し、
 * クリックでランキング詳細ページに遷移します。
 *
 * @param props - コンポーネントのProps
 * @returns ランキング項目サイドバーのJSX要素
 */
export async function RankingItemsSidebar({
  category,
  subcategory,
  className,
}: RankingItemsSidebarProps) {
  let rankingItems: RankingItem[] = [];
  let error: string | null = null;

  try {
    const config = await fetchRankingItemsBySubcategory(subcategory);
    if (config) {
      rankingItems = config.rankingItems;
    }
  } catch (err) {
    error =
      err instanceof Error
        ? err.message
        : "ランキング項目の取得に失敗しました";
  }

  // エラー状態の表示
  if (error) {
    return (
      <div className={className}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            ランキング項目の読み込みに失敗しました: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // データが空の場合
  if (rankingItems.length === 0) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              ランキング項目
            </CardTitle>
            <CardDescription>
              利用可能なランキング項目を選択してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                ランキング項目が見つかりません
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            ランキング項目
          </CardTitle>
          <CardDescription>
            利用可能なランキング項目を選択してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rankingItems.map((item) => (
              <RankingItemCard
                key={item.rankingKey}
                item={item}
                category={category}
                subcategory={subcategory}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
