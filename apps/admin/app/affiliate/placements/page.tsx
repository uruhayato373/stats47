import { BoxesIcon, FileTextIcon, LayersIcon, LayoutGridIcon, LinkIcon, MegaphoneIcon, RulerIcon, ShieldAlertIcon, TagIcon, UnlinkIcon, UsersIcon } from "lucide-react";

import { Cell, DataGrid, DataTable, PanelCard, Row, StatCard, StatusBadge } from "@/components/admin-ui";
import { Grid, Section } from "@/components/layout-primitives";
import { ErrorNote, PageHeading } from "@/components/ops/primitives";
import { affiliatePlacements } from "@/lib/server/affiliate";
import { adsSummary } from "@/lib/server/ads";
import { hasError } from "@/lib/server/state-io";

export const dynamic = "force-dynamic";
export const metadata = { title: "アフィリエイト 掲載先 — stats47 admin" };

const CHANNEL: Record<string, string> = { blog: "ブログ", note: "note" };

/**
 * /affiliate/placements — どこに何が出ているか (品揃え)。型 B (一覧): 件数の要約 → 一覧。doboku-note の /affiliate/placements に揃える。
 * stats47 の広告は 2 系統: ページの分野 × 置き場所で自動配置する広告定義と、記事本文への直貼り。
 * どちらも配信と同じ git TS を読むので、この一覧と本番の表示がずれない。
 */
export default function AffiliatePlacementsPage() {
  const p = affiliatePlacements();
  const d = adsSummary();

  return (
    <>
      <PageHeading title="アフィリエイト 掲載先" source="apps/web/scripts/affiliate-ads-data.ts + affiliate-direct-placements-data.ts" />

      {hasError(d.inventory) ? (
        <ErrorNote error={d.inventory.error} />
      ) : (
        <Grid min="sm">
          <StatCard label="広告エントリ" icon={<MegaphoneIcon />} value={d.inventory.totals.entries} sub={`active ${d.inventory.totals.active}`} />
          <StatCard label="広告主" icon={<UsersIcon />} value={d.inventory.totals.uniqueAdvertisers} />
          <StatCard
            label="分野のカバー"
            icon={<LayersIcon />}
            value={`${d.inventory.coverage.verticalsCovered}/${d.inventory.coverage.verticalsTotal}`}
            tone={d.inventory.coverage.gapVerticals.length > 0 ? "warn" : "good"}
            sub={d.inventory.coverage.gapVerticals.length > 0 ? `欠落: ${d.inventory.coverage.gapVerticals.join(", ")}` : "欠落なし"}
          />
          <StatCard
            label="サイズ違反"
            icon={<RulerIcon />}
            value={d.inventory.sizeViolations.length}
            tone={d.inventory.sizeViolations.length > 0 ? "warn" : "good"}
          />
        </Grid>
      )}

      {hasError(p) ? (
        <ErrorNote error={p.error} />
      ) : (
        <>
          <PanelCard
            title="自動配置 (ページの分野 × 置き場所)"
            icon={<LayoutGridIcon />}
            description={`配信中 ${p.autoTotals.activeAds} 件・停止または期間外 ${p.autoTotals.inactiveAds} 件。どのページに出るかは分野 (vertical) の解決で決まる`}
          >
            <DataTable columns={["置き場所", "広告", "案件", "分野"]}>
              {p.auto.map((row) => (
                <Row key={row.locationCode}>
                  <Cell nowrap>
                    {row.label}
                    <span className="ml-1 text-xs text-muted-foreground">{row.locationCode}</span>
                  </Cell>
                  <Cell nowrap>{row.ads}</Cell>
                  <Cell nowrap muted>
                    {row.programs}
                  </Cell>
                  <Cell muted>{row.verticals.join("・")}</Cell>
                </Row>
              ))}
            </DataTable>
          </PanelCard>

          <Section title="記事への直貼り" count={p.direct.length}>
            {p.direct.length === 0 ? (
              <p className="text-sm text-muted-foreground">直貼りの配置はありません。</p>
            ) : (
              <DataGrid
                columns={[
                  { id: "channel", header: "掲載先", sortable: true, nowrap: true },
                  { id: "slug", header: "記事", sortable: true },
                  { id: "position", header: "位置" },
                  { id: "title", header: "案件", sortable: true },
                  { id: "asp", header: "ASP", sortable: true, nowrap: true },
                ]}
                rows={p.direct.map((row) => ({
                  id: `${row.id}-${row.channel}-${row.slug}`,
                  cells: [
                    CHANNEL[row.channel] ?? row.channel,
                    row.slug,
                    <span key="pos" className="text-muted-foreground">
                      {row.position}
                    </span>,
                    row.title,
                    <span key="asp" className="text-muted-foreground">
                      {row.asp}
                    </span>,
                  ],
                  sort: [row.channel, row.slug, null, row.title, row.asp],
                  search: `${row.slug} ${row.title} ${row.asp}`,
                  facet: row.channel,
                }))}
                facets={[...new Set(p.direct.map((row) => row.channel))].map((c) => ({ value: c, label: CHANNEL[c] ?? c }))}
                searchPlaceholder="記事・案件・ASP で絞り込み"
              />
            )}
          </Section>
        </>
      )}

      {hasError(d.inventory) ? null : (
        <Grid min="lg">
          <PanelCard title="分野別の在庫" icon={<TagIcon />}>
            <DataTable columns={["分野", "件数"]}>
              {d.inventory.byVertical.map((v) => (
                <Row key={v.vertical}>
                  <Cell nowrap>{v.vertical}</Cell>
                  <Cell nowrap muted>
                    {v.count}
                  </Cell>
                </Row>
              ))}
            </DataTable>
          </PanelCard>
          <PanelCard title="種類別の在庫" icon={<BoxesIcon />}>
            <DataTable columns={["種類", "件数"]}>
              {d.inventory.byAdType.map((v) => (
                <Row key={v.adType}>
                  <Cell nowrap>{v.adType}</Cell>
                  <Cell nowrap muted>
                    {v.count}
                  </Cell>
                </Row>
              ))}
            </DataTable>
          </PanelCard>
        </Grid>
      )}

      <Section title="規約の検査">
        {hasError(d.compliance) ? (
          <ErrorNote error={d.compliance.error} />
        ) : (
          <Grid min="sm">
            <StatCard
              label="構造の問題"
              icon={<ShieldAlertIcon />}
              value={d.compliance.structureIssues.length}
              tone={d.compliance.structureIssues.length > 0 ? "warn" : "good"}
            />
            <StatCard
              label="孤立した直貼り"
              icon={<UnlinkIcon />}
              value={d.compliance.directPlacements.orphaned.length}
              tone={d.compliance.directPlacements.orphaned.length > 0 ? "bad" : "good"}
              sub="記事の削除・タグ欠落"
            />
            <StatCard
              label="PR 表記漏れ"
              icon={<FileTextIcon />}
              value={
                d.compliance.directPlacements.missingDisclosure.length > 0 ? (
                  <StatusBadge tone="bad">{d.compliance.directPlacements.missingDisclosure.length}</StatusBadge>
                ) : (
                  0
                )
              }
              tone={d.compliance.directPlacements.missingDisclosure.length > 0 ? "bad" : "good"}
            />
            <StatCard label="直貼り" icon={<LinkIcon />} value={hasError(p) ? "—" : p.direct.length} sub="記事本文への配置" />
          </Grid>
        )}
      </Section>
    </>
  );
}
