import Link from "next/link";
import { Badge } from "@stats47/components/atoms/ui/badge";

interface TagCount {
  tag: string;
  tagKey: string;
  count: number;
}

interface TagCloudProps {
  tags: TagCount[];
}

function getSizeClass(count: number, max: number): string {
  const ratio = max > 0 ? count / max : 0;
  if (ratio > 0.75) return "text-lg";
  if (ratio > 0.5) return "text-base";
  if (ratio > 0.25) return "text-sm";
  return "text-xs";
}

export function TagCloud({ tags }: TagCloudProps) {
  const max = tags.length > 0 ? tags[0].count : 0;

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(({ tag, tagKey, count }) => (
        <Link key={tagKey} href={`/tag/${tagKey}`}>
          <Badge variant="secondary" className={getSizeClass(count, max)}>
            {tag} ({count})
          </Badge>
        </Link>
      ))}
    </div>
  );
}
