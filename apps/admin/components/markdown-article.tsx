import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/** 文書ビューア共通のMarkdown表示 (strategy/doc と共通方針ページで共用)。 */
export function MarkdownArticle({ children }: { children: string }) {
  return (
    <Card className="gap-0 overflow-x-auto py-5 sm:py-7">
      <CardContent className="px-5 text-[13px] leading-6 text-foreground sm:px-7">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-5 text-xl font-bold text-console-fg">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2 mt-8 border-b border-console-border pb-2 text-base font-bold text-console-fg first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-1 mt-5 text-sm font-bold text-console-fg">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="my-2 text-console-muted">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="my-2 list-disc space-y-1 pl-5 text-console-muted">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 list-decimal space-y-1 pl-5 text-console-muted">
              {children}
            </ol>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-2 border-console-accent pl-3 text-console-muted">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="rounded bg-console-bg px-1 py-0.5 text-[12px] text-console-fg">
              {children}
            </code>
          ),
          a: ({ href, children }) => (
            <a
              className="text-console-info underline underline-offset-2"
              href={href}
              rel={href?.startsWith("http") ? "noreferrer" : undefined}
              target={href?.startsWith("http") ? "_blank" : undefined}
            >
              {children}
            </a>
          ),
          // 表は shadcn の Table 部品で描く (生の table タグと手組みの罫線を使わない)
          table: ({ children }) => <Table className="my-4 text-[12px]">{children}</Table>,
          thead: ({ children }) => <TableHeader>{children}</TableHeader>,
          tbody: ({ children }) => <TableBody>{children}</TableBody>,
          tr: ({ children }) => <TableRow>{children}</TableRow>,
          th: ({ children }) => <TableHead className="font-semibold">{children}</TableHead>,
          td: ({ children }) => <TableCell className="align-top whitespace-normal text-muted-foreground">{children}</TableCell>,
          hr: () => <hr className="my-6 border-console-border" />,
        }}
      >
        {children}
      </ReactMarkdown>
      </CardContent>
    </Card>
  );
}
