import { Separator } from "@stats47/components";
import { ChevronDown, List } from "lucide-react";

import { extractHeadings } from "../lib/heading-slug";

/** この件数以上の見出しがある記事は、目次を畳む */
export const TOC_COLLAPSE_FROM = 5;
/** 畳んだときに見せる見出しの件数 */
export const TOC_VISIBLE_WHEN_COLLAPSED = 3;

type Heading = ReturnType<typeof extractHeadings>[number];
type NumberedHeading = Heading & { number?: number };

/** h2 だけに通し番号を付ける (畳んだ続きも番号を引き継ぐ) */
function numberHeadings(headings: Heading[]): NumberedHeading[] {
  let count = 0;
  return headings.map((h) => (h.level === 2 ? { ...h, number: ++count } : h));
}

function TocItem({ heading: h }: { heading: NumberedHeading }) {
  if (h.level === 3) {
    return (
      <li className="pb-1.5 pl-7">
        <a
          href={`#${h.id}`}
          data-nav-label={h.text}
          className="block text-xs leading-snug text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
        >
          {h.text}
        </a>
      </li>
    );
  }
  return (
    <li className="flex gap-2 border-t border-border py-1.5 first:border-t-0">
      <span
        aria-hidden="true"
        className="w-5 shrink-0 text-right tabular-nums text-muted-foreground"
      >
        {h.number}
      </span>
      <a
        href={`#${h.id}`}
        data-nav-label={h.text}
        className="leading-snug text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
      >
        {h.text}
      </a>
    </li>
  );
}

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
 * 枠も地も付けず (カード内カード禁止。2026-10-28 に枠・背景を外した)、本文とは Separator で区切る。
 * 見出しが多い記事 (5 件以上) は最初の 3 件だけを見せ、残りは「すべての見出しを表示」で開く (2026-11-23 オーナー指示。
 * スマホで目次が本文の始まりを押し下げていた)。残りも HTML には全件を出す (details。検索エンジンとページ内検索に見える)。
 * 右レールがある幅では、追従する目次 (RailArticleToc) が読み進めた後も現在の節を示す。目次の下の余白は区切り線の上下とも 16px (Card の gap-4) にし、
 * 本文の最初の段落の上余白は globals.css の .blog-news-article > :first-child が 0 にする (余白を重ねない)。
 * 見た目 (2026-11-24): h2 に通し番号と本文色、h3 は番号なしの muted 字下げ、h2 の行の間を細い罫線で区切る (h3 は親の h2 と同じ段に置き線を引かない)。
 * 「すべての見出しを表示」は primary 色 + 矢印にして、見出しの 1 行と見分けられるようにする。
 * 導線名 `blog_toc` を付け、目次からのクリックを nav_click で数えられるようにする。
 */
export function ArticleTableOfContents({
  content,
}: ArticleTableOfContentsProps) {
  const headings = numberHeadings(extractHeadings(content));

  // 短い記事 (見出し 1 件以下) は TOC 不要
  if (headings.length < 2) return null;
  const collapse = headings.length >= TOC_COLLAPSE_FROM;
  const visible = collapse ? headings.slice(0, TOC_VISIBLE_WHEN_COLLAPSED) : headings;
  const rest = collapse ? headings.slice(TOC_VISIBLE_WHEN_COLLAPSED) : [];

  return (
    <nav
      aria-label="記事の目次"
      data-nav-surface="blog_toc"
    >
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
        <List className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        目次
      </p>
      <ol className="text-sm">
        {visible.map((h, idx) => (
          <TocItem key={`${h.id}-${idx}`} heading={h} />
        ))}
      </ol>
      {rest.length > 0 && (
        <details className="group">
          <summary className="mt-1.5 flex cursor-pointer list-none items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline group-open:hidden [&::-webkit-details-marker]:hidden">
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
            すべての見出しを表示 (残り {rest.length} 件)
          </summary>
          <ol className="border-t border-border text-sm">
            {rest.map((h, idx) => (
              <TocItem key={`${h.id}-${idx}`} heading={h} />
            ))}
          </ol>
        </details>
      )}
      <Separator className="mt-4" />
    </nav>
  );
}
