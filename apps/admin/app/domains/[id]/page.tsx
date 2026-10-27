import Link from "next/link";
import { notFound } from "next/navigation";

import { Cell, DataTable, PanelCard, Row, StatusBadge } from "@/components/admin-ui";
import { Grid, Stack } from "@/components/layout-primitives";
import { PageHeading } from "@/components/ops/primitives";
import { domainOverview } from "@/lib/server/domains";

import domainsConfig from "../../../../../config/domains.json";

export const dynamic = "force-dynamic";

const TIER = { high: "高", mid: "中", low: "低", hold: "判断待ち" } as const;
const STANCE_TONE = { 攻める: "good", 維持: "neutral", 凍結: "warn" } as const;
const KINDS = domainsConfig.navKinds as Record<string, string>;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = domainOverview(id);
  return { title: `${o?.domain.label ?? "領域"} — stats47 admin` };
}

/**
 * /domains/<id> — 領域の概要 (サイドメニューのグループ名から開く)。
 * 判断に使う画面・構えと狙い・やりかけのカード・担当のエージェント/スキル・文書を 1 画面に並べる。
 * 文書はサイドメニューに置かず、ここの「文書」欄から開く (config/domains.json の navRules)。
 */
export default async function DomainPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = domainOverview(id);
  if (!o) notFound();
  const { domain, stance, aim, cards, owners, documents } = o;

  return (
    <div className="space-y-6">
      <PageHeading title={domain.label} source={`config/domains.json (${domain.role})`}>
        <p className="text-sm text-console-muted">{domain.manages}</p>
      </PageHeading>

      <Grid min="lg">
        <PanelCard title="判断に使う画面">
          <Stack gap="sm">
            {domain.nav.map((n) =>
              n.href ? (
                <div key={n.label} className="flex items-baseline justify-between gap-3 text-sm">
                  <Link href={n.href} className="text-console-info hover:underline">{n.label}</Link>
                  <span className="text-[11px] text-console-muted">{KINDS[n.kind] ?? n.kind}</span>
                </div>
              ) : (
                <div key={n.label} className="text-sm text-console-muted">{n.label}（チャネル別の枝）</div>
              ),
            )}
          </Stack>
        </PanelCard>
        <PanelCard title="構えと今の狙い" description="収益化戦略 §5 の領域表">
          {stance ? (
            <Stack gap="sm">
              <div><StatusBadge tone={STANCE_TONE[stance as keyof typeof STANCE_TONE] ?? "neutral"}>{stance}</StatusBadge></div>
              <p className="text-sm text-console-muted">{aim}</p>
              <Link href="/strategy/lanes" className="text-xs text-console-info hover:underline">領域と構えへ →</Link>
            </Stack>
          ) : (
            <p className="text-sm text-console-muted">領域表に行が無い</p>
          )}
        </PanelCard>
      </Grid>

      <PanelCard title={`タスク ${cards.length} 件`} description="backlog の [領域:] タグ">
        {cards.length === 0 ? (
          <p className="text-sm text-console-muted">なし</p>
        ) : (
          <DataTable columns={["ID", "タスク", "優先度", "期日"]}>
            {cards.map((c, i) => (
              <Row key={c.id ?? `card-${i}`}>
                <Cell nowrap>
                  {c.id ? <Link href={`/todo?id=${encodeURIComponent(c.id)}`} className="font-mono text-xs">{c.id}</Link> : "—"}
                </Cell>
                <Cell>{c.title}</Cell>
                <Cell nowrap>{TIER[c.tier]}</Cell>
                <Cell nowrap muted>{c.due ?? ""}</Cell>
              </Row>
            ))}
          </DataTable>
        )}
      </PanelCard>

      <Grid min="lg">
        <PanelCard title={`文書 ${documents.length} 件`} action={<Link href="/docs" className="text-xs font-normal">すべての文書 →</Link>}>
          {documents.length === 0 ? (
            <p className="text-sm text-console-muted">なし</p>
          ) : (
            <Stack gap="sm">
              {documents.map((d) => (
                <Link key={d.path} href={d.href} className="text-sm text-console-info hover:underline">{d.title}</Link>
              ))}
            </Stack>
          )}
        </PanelCard>
        <PanelCard title={`エージェント・スキル ${owners.length} 件`} description="frontmatter の domain">
          {owners.length === 0 ? (
            <p className="text-sm text-console-muted">なし</p>
          ) : (
            <DataTable columns={["名前", "種類"]}>
              {owners.map((x) => (
                <Row key={`${x.kind}-${x.name}`}>
                  <Cell><span className="font-mono text-xs" title={x.description}>{x.name}</span></Cell>
                  <Cell nowrap muted>{x.kind}</Cell>
                </Row>
              ))}
            </DataTable>
          )}
        </PanelCard>
      </Grid>
    </div>
  );
}
