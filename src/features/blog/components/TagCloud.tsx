/**
 * タグクラウドコンポーネント
 *
 * タグをクラウド形式で表示するコンポーネント
 * 使用頻度に応じてフォントサイズを変更
 */

"use client";

import Link from "next/link";

import { Badge } from "@/components/atoms/ui/badge";

import { cn } from "@/lib/cn";

/**
 * タグ統計情報
 */
export interface TagStats {
  /** タグ名 */
  tag: string;
  /** 使用回数 */
  count: number;
}

/**
 * タグクラウドのプロパティ
 */
export interface TagCloudProps {
  /** タグ統計情報の配列 */
  tags: TagStats[];
  /** 最大フォントサイズ（rem） */
  maxFontSize?: number;
  /** 最小フォントサイズ（rem） */
  minFontSize?: number;
  /** CSSクラス名 */
  className?: string;
}

/**
 * タグクラウドコンポーネント
 *
 * タグをクラウド形式で表示。使用頻度に応じてフォントサイズを変更。
 */
export function TagCloud({
  tags,
  maxFontSize = 1.5,
  minFontSize = 0.875,
  className,
}: TagCloudProps) {
  if (!tags || tags.length === 0) {
    return (
      <div className={cn("text-center text-muted-foreground", className)}>
        タグがありません
      </div>
    );
  }

  // 使用回数の最小値と最大値を取得
  const counts = tags.map((tag) => tag.count);
  const minCount = Math.min(...counts);
  const maxCount = Math.max(...counts);

  // フォントサイズを計算する関数
  const getFontSize = (count: number): number => {
    if (maxCount === minCount) {
      return (maxFontSize + minFontSize) / 2;
    }

    // 線形補間でフォントサイズを計算
    const ratio = (count - minCount) / (maxCount - minCount);
    return minFontSize + (maxFontSize - minFontSize) * ratio;
  };

  // シャッフルは削除（Hydrationエラーを防ぐため）
  // タグは使用回数順（降順）で表示
  const sortedTags = [...tags];

  return (
    <div className={cn("flex flex-wrap gap-2 justify-center", className)}>
      {sortedTags.map((tagStats) => {
        const fontSize = getFontSize(tagStats.count);
        const href = `/blog/tags/${encodeURIComponent(tagStats.tag)}`;

        return (
          <Link key={tagStats.tag} href={href}>
            <Badge
              variant="outline"
              className="hover:bg-primary hover:text-primary-foreground transition-colors"
              style={{
                fontSize: `${fontSize}rem`,
              }}
            >
              {tagStats.tag}
              <span className="ml-1 text-xs opacity-70">
                ({tagStats.count})
              </span>
            </Badge>
          </Link>
        );
      })}
    </div>
  );
}
