import Link from "next/link";
import { notFound } from "next/navigation";

import { MarkdownArticle } from "@/components/markdown-article";
import { StatusBadge } from "@/components/admin-ui";
import { PageHeading } from "@/components/ops/primitives";
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
    <>
      <PageHeading title={document.title} source={document.path}>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <StatusBadge>{document.status ?? "status不明"}</StatusBadge>
          <span className="text-xs text-muted-foreground">
            owner: {document.owner} · updated: {document.updated ?? "不明"}
          </span>
        </div>
      </PageHeading>
      <p className="text-sm text-muted-foreground">{document.role}</p>
      <MarkdownArticle>{document.body}</MarkdownArticle>
      <Link
        className="text-sm font-medium underline-offset-4 hover:underline"
        href="/strategy"
      >
        ← 方針へ戻る
      </Link>
    </>
  );
}
