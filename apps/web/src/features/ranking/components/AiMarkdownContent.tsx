import Link from "next/link";

import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

import { addLineBreaksAfterPeriod } from "../utils";

const proseClasses = "prose prose-sm dark:prose-invert max-w-none text-muted-foreground prose-headings:text-foreground prose-h2:text-[15px] prose-h2:font-semibold prose-h2:mt-5 prose-h2:mb-1 prose-h3:text-sm prose-h3:font-semibold prose-h3:mt-4 prose-h3:mb-1 prose-p:my-2 prose-p:leading-relaxed prose-a:text-primary prose-a:underline-offset-2 hover:prose-a:underline";

/** 内部 (同一オリジン) リンク判定 */
function isInternalHref(href: string | undefined): boolean {
  if (!href) return false;
  if (href.startsWith("/") || href.startsWith("#")) return true;
  try {
    const url = new URL(href);
    return /(^|\.)stats47\.jp$/.test(url.hostname);
  } catch {
    return false;
  }
}

/**
 * AI 生成 Markdown を HTML に変換して表示する。
 *
 * リンクハンドリング:
 * - 内部 (相対 path or stats47.jp) → next/link で SPA 遷移、内部リンク評価対象
 * - 外部 → `target="_blank" rel="noopener noreferrer"` でセキュリティ確保
 */
export function AiMarkdownContent({ content }: { content: string }) {
  return (
    <div className={proseClasses}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          a: ({ href, children, ...rest }) => {
            if (isInternalHref(href)) {
              return (
                <Link href={href as string} {...rest}>
                  {children}
                </Link>
              );
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                {...rest}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {addLineBreaksAfterPeriod(content)}
      </ReactMarkdown>
    </div>
  );
}
