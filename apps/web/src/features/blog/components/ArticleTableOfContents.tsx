import { List } from "lucide-react";

import { extractHeadings } from "../lib/heading-slug";

interface ArticleTableOfContentsProps {
  /** Markdown 本文 */
  content: string;
}

/**
 * 記事の目次 (TOC)。
 *
 * Markdown 本文から h2 / h3 を抽出し、anchor リンクとして表示する。
 * MDContent 側で同じ slug ルールで h2/h3 に id を付与する必要がある。
 *
 * 見出しが 2 件未満の短い記事では何も描画しない。
 *
 * 記事ヘッダーの直後・本文の前に全幅共通で 1 か所だけ置く (2026-09-25)。以前は PC で右レールの
 * 追従領域に固定され、読書中ずっとレールの他の情報を隠していた。記事カードの中に置く本文内の部品なので
 * カードで包まず、角丸は `rounded-content` を使う (カード内カード禁止)。見出しは全件表示し折りたたまない。
 * 導線名 `blog_toc` を付け、目次からのクリックを nav_click で数えられるようにする。
 */
export function ArticleTableOfContents({
  content,
}: ArticleTableOfContentsProps) {
  const headings = extractHeadings(content);

  // 短い記事 (見出し 1 件以下) は TOC 不要
  if (headings.length < 2) return null;

  return (
    <nav
      aria-label="記事の目次"
      data-nav-surface="blog_toc"
      className="mb-8 rounded-content border border-border bg-muted/30 px-4 py-3"
    >
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
        <List className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        目次
      </p>
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
  );
}
