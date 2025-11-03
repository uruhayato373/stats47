/**
 * タグリストコンポーネント
 */

import { Badge } from "@/components/atoms/ui/badge";

/**
 * タグリストのプロパティ
 */
export interface TagListProps {
  /** タグ配列 */
  tags: string[];
  /** CSSクラス名 */
  className?: string;
}

/**
 * タグリストコンポーネント
 * 
 * タグをバッジのリストとして表示
 */
export function TagList({ tags, className }: TagListProps) {
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className || ""}`}>
      {tags.map((tag) => (
        <Badge key={tag} variant="outline" className="text-xs">
          {tag}
        </Badge>
      ))}
    </div>
  );
}

