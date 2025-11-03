"use client";

import { useState } from "react";

import { FileText, RefreshCw } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/atoms/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/ui/select";

import { getArticlesFromDBAction } from "@/features/blog/actions/getArticlesFromDB";
import type { Article, ArticleSortOrder } from "@/features/blog/types/article.types";

import { BlogArticlesTable } from "./BlogArticlesTable";

interface BlogArticlesPageClientProps {
  initialArticles: Article[];
}

/**
 * ブログ記事一覧管理画面（クライアントコンポーネント）
 */
export default function BlogArticlesPageClient({
  initialArticles,
}: BlogArticlesPageClientProps) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [sortOrder, setSortOrder] = useState<ArticleSortOrder>("date-desc");
  const [isLoading, setIsLoading] = useState(false);

  /**
   * 記事一覧を更新
   */
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const refreshedArticles = await getArticlesFromDBAction({}, sortOrder);
      setArticles(refreshedArticles);
      toast.success("記事一覧を更新しました");
    } catch (error) {
      console.error("記事の取得に失敗しました", error);
      toast.error("記事の取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * ソート順変更時の処理
   */
  const handleSortOrderChange = async (newSortOrder: ArticleSortOrder) => {
    setSortOrder(newSortOrder);
    setIsLoading(true);
    try {
      const sortedArticles = await getArticlesFromDBAction({}, newSortOrder);
      setArticles(sortedArticles);
    } catch (error) {
      console.error("記事の取得に失敗しました", error);
      toast.error("記事の取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ページヘッダー */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">ブログ記事管理</h1>
          <p className="text-muted-foreground">
            データベースに登録されているブログ記事の一覧と管理
          </p>
        </div>

        {/* コントロールカード */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>操作</CardTitle>
            <CardDescription>記事一覧の操作とフィルタリング</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-center">
              {/* ソート順選択 */}
              <div className="flex items-center gap-2">
                <label htmlFor="sort-order" className="text-sm font-medium">
                  ソート順:
                </label>
                <Select
                  value={sortOrder}
                  onValueChange={(value) =>
                    handleSortOrderChange(value as ArticleSortOrder)
                  }
                >
                  <SelectTrigger id="sort-order" className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">作成日（新しい順）</SelectItem>
                    <SelectItem value="date-asc">作成日（古い順）</SelectItem>
                    <SelectItem value="title-asc">タイトル（昇順）</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 更新ボタン */}
              <Button
                onClick={handleRefresh}
                disabled={isLoading}
                variant="outline"
              >
                <RefreshCw
                  className={`size-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                />
                更新
              </Button>

              {/* 統計情報 */}
              <div className="ml-auto text-sm text-muted-foreground">
                総記事数: <span className="font-medium">{articles.length}</span>件
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 記事一覧テーブル */}
        <Card>
          <CardHeader>
            <CardTitle>記事一覧</CardTitle>
            <CardDescription>
              データベースに登録されている全記事
            </CardDescription>
          </CardHeader>
          <CardContent>
            {articles.length > 0 ? (
              <BlogArticlesTable articles={articles} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="size-12 mx-auto mb-4 opacity-50" />
                <p>記事が登録されていません</p>
                <p className="text-sm mt-2">
                  記事を登録するには、同期スクリプトを実行してください。
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

