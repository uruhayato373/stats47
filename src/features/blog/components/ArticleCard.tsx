/**
 * 記事カードコンポーネント
 *
 * 記事一覧ページで使用する記事カード
 */

import Link from "next/link";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/ui/card";

import type { Article } from "../types/article.types";

/**
 * 記事カードのプロパティ
 */
export interface ArticleCardProps {
  /** 記事データ */
  article: Article;
  /** CSSクラス名 */
  className?: string;
}

/**
 * 記事カードコンポーネント
 *
 * 記事のタイトル、抜粋、タグ、カテゴリを表示するカード
 */
export function ArticleCard({ article, className }: ArticleCardProps) {
  const { frontmatter, slug, year, excerpt } = article;

  // 記事詳細ページのURL
  const href = year
    ? `/blog/${frontmatter.category}/${slug}/${year}`
    : `/blog/${frontmatter.category}/${slug}`;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="line-clamp-2">
          <Link href={href} className="hover:underline">
            {frontmatter.title}
          </Link>
        </CardTitle>
        {excerpt && (
          <CardDescription className="line-clamp-3">{excerpt}</CardDescription>
        )}
      </CardHeader>
    </Card>
  );
}
