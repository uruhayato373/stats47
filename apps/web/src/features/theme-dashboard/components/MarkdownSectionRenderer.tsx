import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

import { ContentDisclosure, FaqSection } from "@/components/content";
import { SurfaceSection } from "@/components/surface";

import type { MarkdownSectionComponentProps } from "../types";

interface Props {
  /** セクションタイトル (既定は H2。テーマの章の中では H3) */
  title: string;
  /** 見出しの階層。ページ直下は h2、テーマの章の中に置くときは h3 */
  headingLevel?: 2 | 3;
  /** Markdown / 出典 / subtitle を含む props */
  props: MarkdownSectionComponentProps;
  /** 出典名（chart.sourceName。props.sources とは独立） */
  fallbackSourceName?: string | null;
}

const proseClasses =
  "prose prose-sm max-w-none text-foreground " +
  "prose-headings:text-foreground prose-headings:font-semibold " +
  "prose-h3:text-sm prose-h3:mt-4 prose-h3:mb-1 " +
  "prose-p:my-2 prose-p:leading-relaxed " +
  "prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 " +
  "prose-strong:text-foreground " +
  "prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none " +
  "prose-blockquote:border-l-2 prose-blockquote:border-border prose-blockquote:text-muted-foreground prose-blockquote:not-italic " +
  "prose-a:text-primary prose-a:underline-offset-2 prose-a:hover:underline";

/**
 * Markdown セクションレンダラー
 *
 * page_components の componentType="markdown-section" を描画する。
 * 「考察」「関連トピック」「FAQ」など、長文テキストを各テーマに添えるために使う。
 *
 * - markdown 本文は react-markdown + remark-gfm + remark-breaks で render
 * - sources は末尾に「出典」見出し付きリストで表示（URL があれば外部リンク）
 * - 入力は信頼できる DB 経由前提（DOMPurify は不要）
 */
export function MarkdownSectionRenderer({ title, props, fallbackSourceName, headingLevel = 2 }: Props) {
  const { subtitle, sources } = props;

  if (props.displayMode === "faq") {
    const faqSources = sources?.length
      ? sources
      : fallbackSourceName
        ? [{ label: fallbackSourceName }]
        : undefined;
    return (
      <FaqSection
        title={title}
        subtitle={subtitle}
        items={props.items}
        sources={faqSources}
        headingLevel={headingLevel}
        renderAnswer={(answer) => (
          <div className={proseClasses}>
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
              {`A. ${answer}`}
            </ReactMarkdown>
          </div>
        )}
      />
    );
  }

  // 文章の章 (読み方・比較するときの注意など) は最初は閉じ、題名だけを見せる (2026-10-31 オーナー決定:
  // テーマページはダッシュボードなので可視化を先に並べる)。details なので閉じた本文も HTML に残る (検索から見える)
  return (
    <SurfaceSection aria-label={title} className="px-6 py-2">
      <ContentDisclosure title={title} description={subtitle} headingLevel={headingLevel} bordered={false}>
      <div className={proseClasses}>
        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
          {props.markdown}
        </ReactMarkdown>
      </div>
      {sources && sources.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border">
          <h3 className="text-xs font-semibold text-foreground mb-1">出典</h3>
          <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
            {sources.map((s, i) => (
              <li key={`${s.label}-${i}`}>
                {s.url ? (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    {s.label}
                  </a>
                ) : (
                  s.label
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {(!sources || sources.length === 0) && fallbackSourceName && (
        <p className="text-[10px] text-muted-foreground mt-3 text-right">
          出典: {fallbackSourceName}
        </p>
      )}
      </ContentDisclosure>
    </SurfaceSection>
  );
}
