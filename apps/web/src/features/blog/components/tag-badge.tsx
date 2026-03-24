import Link from "next/link";
import { Badge } from "@stats47/components/atoms/ui/badge";

interface TagBadgeProps {
  tag: string;
  tagKey?: string;
  /** true の場合リンクなし（親が <Link> のときネスト <a> 回避） */
  static?: boolean;
}

export function TagBadge({ tag, tagKey, static: isStatic }: TagBadgeProps) {
  if (isStatic) {
    return <Badge variant="secondary">{tag}</Badge>;
  }

  return (
    <Link href={`/tag/${tagKey ?? encodeURIComponent(tag)}`}>
      <Badge variant="secondary">{tag}</Badge>
    </Link>
  );
}
