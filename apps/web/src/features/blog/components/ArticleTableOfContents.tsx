import { List } from "lucide-react";

import { RailCard } from "@/components/surface";

import { extractHeadings } from "../lib/heading-slug";

interface ArticleTableOfContentsProps {
  /** Markdown 本文 */
  content: string;
  /** コンパクト表示 (sidebar 用) */
  compact?: boolean;
}

/**
 * 記事の目次 (TOC)。
 *
 * Markdown 本文から h2 / h3 を抽出し、anchor リンクとして表示する。
 * MDContent 側で同じ slug ルールで h2/h3 に id を付与する必要がある。
 *
 * 見出しが 2 件未満の短い記事では何も描画しない。
 */
export function ArticleTableOfContents({
  content,
  compact = false,
}: ArticleTableOfContentsProps) {
  const headings = extractHeadings(content);

  // 短い記事 (見出し 1 件以下) は TOC 不要
  if (headings.length < 2) return null;

  return (
    <RailCard
      title="目次"
      icon={<List className="h-4 w-4 text-muted-foreground" />}
      titleClassName={compact ? undefined : "text-base font-semibold text-foreground"}
      bodyClassName="p-4 pt-3"
    >
      <nav aria-label="記事の目次">
        <ol className="space-y-1.5 text-sm">
          {headings.map((h, idx) => (
            <li
              key={`${h.id}-${idx}`}
              className={h.level === 3 ? "pl-4" : ""}
            >
              <a
                href={`#${h.id}`}
                className={
                  "block leading-snug transition-colors hover:text-primary " +
                  (h.level === 2
                    ? "font-medium text-foreground"
                    : "text-xs text-muted-foreground")
                }
              >
                {h.text}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </RailCard>
  );
}
