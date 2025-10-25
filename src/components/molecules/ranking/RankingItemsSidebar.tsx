"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/atoms/ui/alert";
import { Badge } from "@/components/atoms/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/ui/card";
import { Skeleton } from "@/components/atoms/ui/skeleton";
import { getActiveRankingItems, RankingItem } from "@/data/mock/ranking-items";
import { AlertCircle, TrendingUp } from "lucide-react";

/**
 * RankingItemsSidebar の Props
 */
interface RankingItemsSidebarProps {
  /** カテゴリID */
  category: string;
  /** サブカテゴリID */
  subcategory: string;
  /** クラス名 */
  className?: string;
}

/**
 * ランキング項目を表示するサイドバーコンポーネント
 *
 * 利用可能なランキング項目を一覧表示し、
 * クリックでランキング詳細ページに遷移します。
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
  }, []);

  /**
   * ランキング項目データを読み込み
   */
  const loadRankingItems = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Mockデータから有効なランキング項目を取得
      const activeItems = getActiveRankingItems();
      setRankingItems(activeItems);
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

/**
 * 個別のランキング項目カードコンポーネント
 */
function RankingItemCard({
  item,
  category,
  subcategory,
}: {
  item: RankingItem;
  category: string;
  subcategory: string;
}) {
  const rankingUrl = `/${category}/${subcategory}/ranking/${item.ranking_key}`;

  return (
    <Link
      href={rankingUrl}
      className="block p-3 rounded-lg border border-border hover:border-primary hover:bg-accent/50 transition-colors"
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm leading-tight">{item.label}</h4>
          <Badge variant="secondary" className="text-xs shrink-0">
            {item.unit}
          </Badge>
        </div>

        {item.description && item.description !== "null" && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {item.description}
          </p>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="capitalize">
            {item.ranking_direction === "desc" ? "降順" : "昇順"}
          </span>
          <span>•</span>
          <span>{item.data_source_id}</span>
        </div>
      </div>
    </Link>
  );
}
