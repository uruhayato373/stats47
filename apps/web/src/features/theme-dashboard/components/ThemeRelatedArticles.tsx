import "server-only";

import { Newspaper } from "lucide-react";

import { getSurfaceCardClassName } from "@/components/surface";

import { getRelatedArticleSummaries } from "@/features/blog/server";

import { TrackedThemeLink } from "./TrackedThemeLink";

interface ThemeRelatedArticlesProps {
  /** 関連記事を引くタグキー一覧 */
  tagKeys: string[];
  /** 表示する最大件数（デフォルト 6） */
  limit?: number;
}

/**
 * テーマダッシュボード用「関連記事」セクション。
 *
 * `tagKeys` の複数タグの記事を集約（取得+重複除去は共有 getRelatedArticleSummaries）し、
 * 3 列グリッドで最大 `limit` 件表示する。データ集約は共有ロジック、presentation のみ本コンポーネント。
 */
export async function ThemeRelatedArticles({
  tagKeys,
  limit = 6,
}: ThemeRelatedArticlesProps) {
  const visible = await getRelatedArticleSummaries(tagKeys, { limit });

  if (visible.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="flex items-center gap-2 border-b border-border px-4 py-4">
        <Newspaper className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-base font-semibold text-foreground">関連記事</h3>
      </div>
      <div className="p-4 pt-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visible.map((article) => (
            <TrackedThemeLink
              key={article.slug}
              href={`/blog/${article.slug}`}
              trackingLabel={`theme-related-articles:${article.slug}`}
              surface="theme_blog"
              className={getSurfaceCardClassName({
                interactive: true,
                className: "block p-3",
              })}
            >
              <p className="text-sm font-medium line-clamp-2 leading-snug">
                {article.title}
              </p>
              {article.description && (
                <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                  {article.description}
                </p>
              )}
            </TrackedThemeLink>
          ))}
        </div>
      </div>
    </section>
  );
}
