import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

import { Badge, PageHeading } from "@/components/ops/primitives";
import { businessPlanDocument } from "@/lib/server/business-plan";

export const dynamic = "force-dynamic";

export default async function StrategyDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const document = businessPlanDocument(id);
  if (!document) notFound();

  return (
    <div className="space-y-6">
      <PageHeading title={document.title} source={document.path}>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge>{document.status ?? "status不明"}</Badge>
          <span className="text-[11px] text-console-muted">
            owner: {document.owner} · updated: {document.updated ?? "不明"}
          </span>
        </div>
      </PageHeading>
      <p className="text-sm text-console-muted">{document.role}</p>
      <article className="overflow-x-auto rounded-md border border-console-border bg-console-card p-5 text-[13px] leading-6 text-console-fg sm:p-7">
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
            table: ({ children }) => (
              <table className="my-4 min-w-full border-collapse text-left text-[12px]">
                {children}
              </table>
            ),
            th: ({ children }) => (
              <th className="border border-console-border bg-console-bg px-2 py-1.5 font-semibold">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border border-console-border px-2 py-1.5 align-top text-console-muted">
                {children}
              </td>
            ),
            hr: () => <hr className="my-6 border-console-border" />,
          }}
        >
          {document.body}
        </ReactMarkdown>
      </article>
      <Link
        className="text-sm font-medium text-console-info hover:underline"
        href="/strategy"
      >
        ← 方針・事業計画へ戻る
      </Link>
    </div>
  );
}
