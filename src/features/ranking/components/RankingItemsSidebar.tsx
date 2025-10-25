"use client";

import { useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/atoms/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/ui/card";
import { Skeleton } from "@/components/atoms/ui/skeleton";
import { AlertCircle, TrendingUp } from "lucide-react";

import { RankingItemService } from "../services/ranking-item-service";
import type { RankingItem, RankingItemsSidebarProps } from "../types";
import { RankingItemCard } from "./RankingItemCard";

/**
 * ランキング項目を表示するサイドバーコンポーネント
 *
 * 利用可能なランキング項目を一覧表示し、
 * クリックでランキング詳細ページに遷移します。
 *
 * @param props - コンポーネントのProps
 * @returns ランキング項目サイドバーのJSX要素
 */
export function RankingItemsSidebar({
  category,
  subcategory,
  className,
}: RankingItemsSidebarProps) {
  const [rankingItems, setRankingItems] = useState<RankingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ランキング項目データを読み込み
  useEffect(() => {
    loadRankingItems();
  }, [category, subcategory]);

  /**
   * ランキング項目データを読み込み
   */
  const loadRankingItems = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const items = await RankingItemService.getItemsByCategory(
        category,
        subcategory
      );
      setRankingItems(items);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ランキング項目の取得に失敗しました"
      );
    } finally {
      setIsLoading(false);
    }
  };

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

  // ローディング状態の表示
  if (isLoading) {
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
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
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
                key={item.id}
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
