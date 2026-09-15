import Link from "next/link";
import { notFound } from "next/navigation";

import { MarkdownArticle } from "@/components/markdown-article";
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
      <MarkdownArticle>{document.body}</MarkdownArticle>
      <Link
        className="text-sm font-medium text-console-info hover:underline"
        href="/strategy"
      >
        ← 方針・事業計画へ戻る
      </Link>
    </div>
  );
}
