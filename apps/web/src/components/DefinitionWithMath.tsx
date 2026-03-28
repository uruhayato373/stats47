"use client";

import katex from "katex";

import "katex/dist/katex.min.css";

type Segment = { type: "text"; content: string } | { type: "block"; content: string } | { type: "inline"; content: string };

/**
 * 文字列を $$...$$（ブロック）と $...$（インライン）で分割し、
 * テキストと数式のセグメント配列に変換する。
 * ブロックをインラインより先にマッチさせる。
 */
function parseContent(content: string): Segment[] {
  const segments: Segment[] = [];
  const regex = /\$\$([^$]+)\$\$|\$([^$]+)\$/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: content.slice(lastIndex, match.index) });
    }
    if (match[1] !== undefined) {
      segments.push({ type: "block", content: match[1].trim() });
    } else if (match[2] !== undefined) {
      segments.push({ type: "inline", content: match[2].trim() });
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    segments.push({ type: "text", content: content.slice(lastIndex) });
  }

  return segments;
}

/**
 * LaTeX 文字列を KaTeX で HTML に変換する。
 * エラー時はプレーンテキストを返す。
 */
function renderLatex(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode,
      output: "html",
    });
  } catch {
    return escapeHtml(latex);
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface DefinitionWithMathProps {
  /** 定義テキスト。$...$ でインライン数式、$$...$$ でブロック数式を記述可能 */
  content: string;
  /** ラッパーに付与するクラス名 */
  className?: string;
}

/**
 * 定義文と LaTeX 数式を混在表示するコンポーネント。
 * 数式なしの通常テキストはそのまま表示し、改行は保持する。
 */
export function DefinitionWithMath({ content, className }: DefinitionWithMathProps) {
  if (!content) {
    return null;
  }

  const segments = parseContent(content);

  return (
    <div className={className}>
      {segments.map((seg, i) => {
        if (seg.type === "text") {
          return (
            <span key={i} className="whitespace-pre-wrap">
              {seg.content}
            </span>
          );
        }
        if (seg.type === "block") {
          const html = renderLatex(seg.content, true);
          return (
            <span key={i} className="katex-display block my-2">
              <span dangerouslySetInnerHTML={{ __html: html }} />
            </span>
          );
        }
        const html = renderLatex(seg.content, false);
        return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
      })}
    </div>
  );
}
