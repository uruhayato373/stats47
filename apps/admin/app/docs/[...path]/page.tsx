import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/admin-ui";
import { MarkdownArticle } from "@/components/markdown-article";
import { PageHeading } from "@/components/ops/primitives";
import { readDocument } from "@/lib/server/domains";

export const dynamic = "force-dynamic";

/** /docs/<path> — docs/<path>.md の本文 (読み取り専用)。docs/ の外は readDocument が拒否する。 */
export default async function DocDetailPage({ params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const doc = readDocument(path);
  if (!doc) notFound();

  return (
    <div className="space-y-6">
      <PageHeading title={doc.title} source={doc.path}>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <StatusBadge>{doc.status ?? "status不明"}</StatusBadge>
          <span className="text-[11px] text-console-muted">updated: {doc.updated ?? "不明"}</span>
        </div>
      </PageHeading>
      <MarkdownArticle>{doc.body}</MarkdownArticle>
      <Link className="text-sm font-medium text-console-info hover:underline" href={doc.domainId ? `/domains/${doc.domainId}` : "/docs"}>
        ← {doc.domainId ? "領域の概要へ戻る" : "文書の一覧へ戻る"}
      </Link>
    </div>
  );
}
