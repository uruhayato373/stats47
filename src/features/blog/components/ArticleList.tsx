/**
 * 記事一覧コンポーネント
 *
 * 記事一覧を表示するコンポーネント
 */

import { ArticleCard } from "./ArticleCard";

import type { Article } from "../types/article.types";

/**
 * 記事一覧のプロパティ
 */
export interface ArticleListProps {
  /** 記事配列 */
  articles: Article[];
  /** CSSクラス名 */
  className?: string;
}

/**
 * 記事一覧コンポーネント
 *
 * 記事カードのリストを表示
 */
export function ArticleList({ articles, className }: ArticleListProps) {
  if (articles.length === 0) {
    return (
      <div className={`text-center py-12 ${className || ""}`}>
        <p className="text-muted-foreground">記事が見つかりませんでした</p>
      </div>
    );
  }

  return (
    <div
      className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 ${className || ""}`}
    >
      {articles.map((article) => (
        <ArticleCard
          key={`${article.slug}-${article.year || "latest"}`}
          article={article}
        />
      ))}
    </div>
  );
}
