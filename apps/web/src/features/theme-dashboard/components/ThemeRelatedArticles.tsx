import "server-only";

import Link from "next/link";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@stats47/components/atoms/ui/card";
import { Newspaper } from "lucide-react";

import { listArticleSummariesByTagKey } from "@/features/blog/server";

interface ThemeRelatedArticlesProps {
  /** 関連記事を引くタグキー一覧 */
  tagKeys: string[];
  /** 表示する最大件数（デフォルト 6） */
  limit?: number;
}

interface ArticleSummary {
  slug: string;
  title: string;
  description: string | null;
}

/**
 * テーマダッシュボード用「関連記事」セクション。
 *
 * `tagKeys` で指定された複数タグの記事を並列取得し、
 * 重複を除去して最大 `limit` 件表示する。
 *
 * - 各タグごとの結果は DB 側で `published_at DESC` ソート済みのため、
 *   ここでは単純に重複除去 + 上限カットのみ行う
 * - tagKeys が空 or マッチ記事ゼロのときは何も描画しない（return null）
 * - 既存の `article_tags` テーブルをそのまま利用するため DB スキーマ変更不要
 */
export async function ThemeRelatedArticles({
  tagKeys,
  limit = 6,
}: ThemeRelatedArticlesProps) {
  if (tagKeys.length === 0) return null;

  // 各タグで記事を並列取得（各タグから最大 limit 件取得し、後で重複除去）
  const allResults = await Promise.all(
    tagKeys.map((tagKey) => listArticleSummariesByTagKey(tagKey, limit))
  );

  const seen = new Set<string>();
  const articles: ArticleSummary[] = [];
  for (const tagArticles of allResults) {
    for (const a of tagArticles) {
      if (seen.has(a.slug)) continue;
      if (articles.length >= limit) break;
      seen.add(a.slug);
      articles.push({
        slug: a.slug,
        title: a.title,
        description: a.description,
      });
    }
    if (articles.length >= limit) break;
  }

  if (articles.length === 0) return null;

  const visible = articles;

  return (
    <Card className="mt-8">
      <CardHeader className="py-4 px-4 flex-row items-center gap-2 space-y-0">
        <Newspaper className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-base">関連記事</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visible.map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="block rounded-md border border-border p-3 transition-colors hover:border-primary hover:bg-accent/50"
            >
              <p className="text-sm font-medium line-clamp-2 leading-snug">
                {article.title}
              </p>
              {article.description && (
                <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                  {article.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
