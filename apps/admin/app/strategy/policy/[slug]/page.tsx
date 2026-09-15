import Link from "next/link";
import { notFound } from "next/navigation";

import { MarkdownArticle } from "@/components/markdown-article";
import { Badge, PageHeading } from "@/components/ops/primitives";
import { sharedPolicyDocument } from "@/lib/server/shared-policy";

export const dynamic = "force-dynamic";

/**
 * 共有 SSOT 1 本の読み取り専用ミラー（/strategy/policy/POLICY・REPURPOSE・STRUCTURE）。
 * 正本は Obsidian vault、配布物は `npm run policy:sync` で更新する。manifest に無い slug は 404。
 */
export default async function SharedPolicyDocumentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const document = sharedPolicyDocument(slug);
  if (!document) notFound();

  return (
    <div className="space-y-6">
      <PageHeading
        title={document.title}
        source={`Obsidian vault ${document.sourcePath}（正本）`}
      >
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge>v{document.version}</Badge>
          <span className="text-[11px] text-console-muted">
            更新 {document.updated}
          </span>
          <Link
            className="text-[11px] text-console-info underline underline-offset-2"
            href="/strategy/policy"
          >
            共通方針の一覧へ
          </Link>
        </div>
      </PageHeading>
      <p className="text-sm text-console-muted">
        {document.summary}
        {" "}編集はObsidian vaultの正本だけで行い、
        <code className="rounded bg-console-card px-1">npm run policy:sync</code>
        で配布する。stats47 固有の適用（対象読者・商品・KPI・章立て）はこのリポジトリ側が管理し、ここには書かない。
      </p>
      <MarkdownArticle>{document.body}</MarkdownArticle>
    </div>
  );
}
