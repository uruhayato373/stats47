/**
 * ブログサイドバーコンポーネント
 * 
 * ブログ記事一覧ページのサイドバー
 */

import { TagCloud } from "./TagCloud";
import type { TagStats } from "./TagCloud";

/**
 * ブログサイドバーのプロパティ
 */
export interface BlogSidebarProps {
  /** タグ統計情報の配列 */
  tagStats: TagStats[];
  /** CSSクラス名 */
  className?: string;
}

/**
 * 代表的なタグのみを取得（上位N件）
 * 
 * タグは既に使用回数でソートされていることを前提とする
 * 
 * @param tagStats - タグ統計情報の配列
 * @param limit - 表示件数（デフォルト: 20）
 * @returns 上位N件のタグ統計情報
 */
function getTopTags(tagStats: TagStats[], limit: number = 20): TagStats[] {
  // 既にソート済みなので、上位N件を取得
  return tagStats.slice(0, limit);
}

/**
 * ブログサイドバーコンポーネント
 * 
 * タグクラウドなどを表示するサイドバー
 */
export function BlogSidebar({ tagStats, className }: BlogSidebarProps) {
  // 代表的なタグのみを取得（上位20件）
  const topTags = getTopTags(tagStats, 20);

  return (
    <aside className={className}>
      <div className="space-y-6">
        {/* タグクラウド */}
        {topTags.length > 0 && (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">人気のタグ</h2>
            <TagCloud tags={topTags} maxFontSize={1.25} minFontSize={0.875} />
            <p className="text-xs text-muted-foreground mt-4">
              {tagStats.length > topTags.length &&
                `他 ${tagStats.length - topTags.length} 個のタグ`}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}

