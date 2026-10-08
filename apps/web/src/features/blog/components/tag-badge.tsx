import Link from "next/link";

import { Badge } from "@stats47/components/atoms/ui/badge";
import { resolveContentTag } from '@stats47/data-configs/content';

interface TagBadgeProps {
  tag: string;
  tagKey?: string;
  /** true の場合リンクなし（親が <Link> のときネスト <a> 回避） */
  static?: boolean;
}

export function TagBadge({ tag, tagKey, static: isStatic }: TagBadgeProps) {
  const identity = resolveContentTag(tagKey ?? tag);
  const label = identity?.label ?? tag;
  if (isStatic) {
    return <Badge variant="secondary">{label}</Badge>;
  }

  return (
    <Link
      href={`/tag/${encodeURIComponent(identity?.key ?? tagKey ?? tag)}`}
      data-nav-surface="tag"
      data-nav-label={identity?.id ?? tagKey ?? tag}
    >
      <Badge variant="secondary">{label}</Badge>
    </Link>
  );
}
