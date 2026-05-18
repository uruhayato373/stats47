"use client";

import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

import type { MarkdownSectionComponentProps } from "../types";

interface Props {
  /** セクションタイトル（H2 として表示） */
  title: string;
  /** Markdown / 出典 / subtitle を含む props */
  props: MarkdownSectionComponentProps;
  /** 出典名（chart.sourceName。props.sources とは独立） */
  fallbackSourceName?: string | null;
}

const proseClasses =
  "prose prose-sm max-w-none text-slate-700 " +
  "prose-headings:text-slate-900 prose-headings:font-semibold " +
  "prose-h3:text-sm prose-h3:mt-4 prose-h3:mb-1 " +
  "prose-p:my-2 prose-p:leading-relaxed " +
  "prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 " +
  "prose-strong:text-slate-900 " +
  "prose-code:text-slate-800 prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none " +
  "prose-blockquote:border-l-2 prose-blockquote:border-slate-300 prose-blockquote:text-slate-600 prose-blockquote:not-italic " +
  "prose-a:text-primary prose-a:underline-offset-2 hover:prose-a:underline";

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
export function MarkdownSectionRenderer({ title, props, fallbackSourceName }: Props) {
  const { markdown, subtitle, sources } = props;

  return (
    <section
      aria-label={title}
      className="border border-border bg-white rounded-lg shadow-sm p-6"
    >
      <h2 className="text-base font-semibold text-slate-900 mb-1">{title}</h2>
      {subtitle && (
        <p className="text-xs text-muted-foreground mb-3">{subtitle}</p>
      )}
      <div className={proseClasses}>
        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
          {markdown}
        </ReactMarkdown>
      </div>
      {sources && sources.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border">
          <h3 className="text-xs font-semibold text-slate-700 mb-1">出典</h3>
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
    </section>
  );
}
