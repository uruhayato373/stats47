import Link from "next/link";

import { Badge, PageHeading } from "@/components/ops/primitives";
import { sharedPolicyDocuments } from "@/lib/server/shared-policy";

export const dynamic = "force-dynamic";
export const metadata = { title: "共通方針 — stats47 admin" };

/**
 * 3 プロジェクト共通 SSOT（共通事業方針 / SNS リパーパス戦略 / note 記事構成）の索引。
 * 正本は Obsidian vault `memos/*SSOT.md`。ここにあるのは `npm run policy:sync` で配布された写しで、
 * 一覧の出どころは `.claude/shared-policy/manifest.json`。本文は `/strategy/policy/<slug>`。
 */
export default function SharedPolicyIndexPage() {
  const documents = sharedPolicyDocuments();

  return (
    <div className="space-y-6">
      <PageHeading
        title="共通方針"
        source="Obsidian vault memos/*SSOT.md（正本）→ .claude/shared-policy/（写し）"
      />
      <p className="text-sm text-console-muted">
        stats47・doboku-note・Obsidian vault
        で共有する判断枠組み。編集はObsidian vaultの正本だけで行い、
        <code className="rounded bg-console-card px-1">npm run policy:sync</code>
        で配布する。ここは読み取り専用のミラー表示で、対象読者・商品・KPI・優先順位は
        stats47固有の
        <a
          className="text-console-info underline underline-offset-2"
          href="/strategy"
        >
          方針・事業計画
        </a>
        が管理する。
      </p>

      {documents.length === 0 ? (
        <p className="text-sm text-console-warn">
          配布物 (.claude/shared-policy/manifest.json) が見つかりません。Obsidian
          vault で <code>npm run policy:sync</code> を実行してください。
        </p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-3">
          {documents.map((d) => (
            <li key={d.name}>
              <Link
                className="block h-full rounded border border-console-border bg-console-card p-4 hover:border-console-info"
                href={`/strategy/policy/${d.slug}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>v{d.version}</Badge>
                  <span className="text-[11px] text-console-muted">更新 {d.updated}</span>
                </div>
                <h2 className="pt-2 text-base font-semibold">{d.title}</h2>
                <p className="pt-1 text-sm text-console-muted">{d.summary}</p>
                <code className="mt-2 block text-[11px] text-console-muted">
                  {d.name} ← {d.sourcePath}
                </code>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
