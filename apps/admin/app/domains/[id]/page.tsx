import Link from "next/link";
import { notFound } from "next/navigation";
import { BotIcon, CompassIcon, FileTextIcon, LayoutDashboardIcon, ListTodoIcon } from "lucide-react";

import { Cell, DataGrid, DataTable, PanelCard, Row, StatusBadge } from "@/components/admin-ui";
import { Grid, Stack } from "@/components/layout-primitives";
import { PageHeading } from "@/components/ops/primitives";
import { domainOverview } from "@/lib/server/domains";

import domainsConfig from "../../../../../config/domains.json";
import { DOMAINS } from "../../../../../config/paths.mjs";

export const dynamic = "force-dynamic";

const TIER = { high: "高", mid: "中", low: "低", hold: "判断待ち" } as const;
const TIER_ORDER = { high: 0, mid: 1, low: 2, hold: 3 } as const;
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
    <>
      <PageHeading title={domain.label} source={`${DOMAINS} (${domain.role})`}>
        <p className="text-sm text-muted-foreground">{domain.manages}</p>
      </PageHeading>

      <Grid min="lg">
        <PanelCard title="判断に使う画面" icon={<LayoutDashboardIcon />}>
          <Stack gap="sm">
            {domain.nav.map((n) =>
              n.href ? (
                <div key={n.label} className="flex items-baseline justify-between gap-3 text-sm">
                  <Link href={n.href} className="font-medium underline-offset-4 hover:underline">{n.label}</Link>
                  <span className="text-xs text-muted-foreground">{KINDS[n.kind] ?? n.kind}</span>
                </div>
              ) : (
                <div key={n.label} className="text-sm text-muted-foreground">{n.label}（チャネル別の枝）</div>
              ),
            )}
          </Stack>
        </PanelCard>
        <PanelCard title="構えと今の狙い" icon={<CompassIcon />} description="収益化戦略 §5 の領域表">
          {stance ? (
            <Stack gap="sm">
              <div><StatusBadge tone={STANCE_TONE[stance as keyof typeof STANCE_TONE] ?? "neutral"}>{stance}</StatusBadge></div>
              <p className="text-sm text-muted-foreground">{aim}</p>
              <Link href="/strategy/lanes" className="text-xs font-medium underline-offset-4 hover:underline">領域と構えへ →</Link>
            </Stack>
          ) : (
            <p className="text-sm text-muted-foreground">領域表に行が無い</p>
          )}
        </PanelCard>
      </Grid>

      <PanelCard title={`タスク ${cards.length} 件`} icon={<ListTodoIcon />} description="backlog の [領域:] タグ">
        {cards.length === 0 ? (
          <p className="text-sm text-muted-foreground">なし</p>
        ) : (
          <DataGrid
            columns={[
              { id: "id", header: "ID", sortable: true, nowrap: true },
              { id: "title", header: "タスク", sortable: true },
              { id: "tier", header: "優先度", sortable: true, nowrap: true },
              { id: "due", header: "期日", sortable: true, nowrap: true },
            ]}
            rows={cards.map((c, i) => ({
              id: c.id ?? `card-${i}`,
              cells: [
                c.id ? (
                  <Link key="i" href={`/todo?id=${encodeURIComponent(c.id)}`} className="font-mono text-xs font-medium underline-offset-4 hover:underline">
                    {c.id}
                  </Link>
                ) : (
                  "—"
                ),
                c.title,
                TIER[c.tier],
                <span key="d" className="text-muted-foreground">
                  {c.due ?? ""}
                </span>,
              ],
              sort: [c.id, c.title, TIER_ORDER[c.tier], c.due ?? null],
              search: `${c.id ?? ""} ${c.title}`,
              facet: c.tier,
            }))}
            facets={Object.entries(TIER).map(([value, label]) => ({ value, label }))}
            searchPlaceholder="ID・タスク名で絞り込み"
          />
        )}
      </PanelCard>

      <Grid min="lg">
        <PanelCard title={`文書 ${documents.length} 件`} icon={<FileTextIcon />} action={<Link href="/docs" className="text-xs font-medium underline-offset-4 hover:underline">すべての文書 →</Link>}>
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">なし</p>
          ) : (
            <Stack gap="sm">
              {documents.map((d) => (
                <Link key={d.path} href={d.href} className="text-sm font-medium underline-offset-4 hover:underline">{d.title}</Link>
              ))}
            </Stack>
          )}
        </PanelCard>
        <PanelCard title={`エージェント・スキル ${owners.length} 件`} icon={<BotIcon />} description="frontmatter の domain">
          {owners.length === 0 ? (
            <p className="text-sm text-muted-foreground">なし</p>
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
    </>
  );
}
