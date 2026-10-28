import { LinkCard, StatusBadge } from "@/components/admin-ui";
import { Grid } from "@/components/layout-primitives";
import { PageHeading } from "@/components/ops/primitives";
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
    <>
      <PageHeading title="共通方針" source="Obsidian vault memos/*SSOT.md（正本）→ .claude/shared-policy/（写し）">
      <p className="text-sm text-muted-foreground">
        stats47・doboku-note・Obsidian vault
        で共有する判断枠組み。編集はObsidian vaultの正本だけで行い、
        <code className="rounded bg-muted px-1 font-mono text-xs">npm run policy:sync</code>
        で配布する。ここは読み取り専用のミラー表示で、対象読者・商品・KPI・優先順位は
        stats47固有の
        <a
          className="font-medium underline-offset-4 hover:underline"
          href="/strategy"
        >
          方針
        </a>
        が管理する。
      </p>
      </PageHeading>

      {documents.length === 0 ? (
        <p className="text-sm text-warning">
          配布物 (.claude/shared-policy/manifest.json) が見つかりません。Obsidian
          vault で <code className="rounded bg-muted px-1 font-mono text-xs">npm run policy:sync</code> を実行してください。
        </p>
      ) : (
        <Grid min="md">
          {documents.map((d) => (
              <LinkCard key={d.name} href={`/strategy/policy/${d.slug}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge>v{d.version}</StatusBadge>
                  <span className="text-xs text-muted-foreground">更新 {d.updated}</span>
                </div>
                <h2 className="pt-2 text-base font-semibold">{d.title}</h2>
                <p className="pt-1 text-sm text-muted-foreground">{d.summary}</p>
                <code className="mt-2 block font-mono text-xs text-muted-foreground">
                  {d.name} ← {d.sourcePath}
                </code>
              </LinkCard>
          ))}
        </Grid>
      )}
    </>
  );
}
