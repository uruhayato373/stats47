import { Cell, DataTable, Row, StatCard, StatusBadge } from "@/components/admin-ui";
import { Section } from "@/components/layout-primitives";
import { ErrorNote, PageHeading } from "@/components/ops/primitives";
import { affiliatePlacements } from "@/lib/server/affiliate";
import { adsSummary } from "@/lib/server/ads";
import { hasError } from "@/lib/server/state-io";

export const dynamic = "force-dynamic";
export const metadata = { title: "アフィリエイト 掲載先 — stats47 admin" };

const CHANNEL: Record<string, string> = { blog: "ブログ", note: "note" };

/**
 * /affiliate/placements — どこに何が出ているか (品揃え)。doboku-note の /affiliate/placements に揃える。
 * stats47 の広告は 2 系統: ページの分野 × 置き場所で自動配置する広告定義と、記事本文への直貼り。
 * どちらも配信と同じ git TS を読むので、この一覧と本番の表示がずれない。
 */
export default function AffiliatePlacementsPage() {
  const p = affiliatePlacements();
  const d = adsSummary();

  return (
    <div className="space-y-8">
      <PageHeading
        title="アフィリエイト 掲載先"
        source="apps/web/scripts/affiliate-ads-data.ts + affiliate-direct-placements-data.ts"
      />

      {hasError(p) ? (
        <ErrorNote error={p.error} />
      ) : (
        <>
          <Section title="自動配置 (ページの分野 × 置き場所)" count={p.autoTotals.activeAds}>
            <p className="text-[11px] text-console-muted">
              配信中 {p.autoTotals.activeAds} 件・停止または期間外 {p.autoTotals.inactiveAds} 件。どのページに出るかは分野 (vertical) の解決で決まる
            </p>
            <DataTable columns={["置き場所", "広告", "案件", "分野"]}>
              {p.auto.map((row) => (
                <Row key={row.locationCode}>
                  <Cell nowrap>
                    {row.label}
                    <span className="ml-1 text-[11px] text-console-muted">{row.locationCode}</span>
                  </Cell>
                  <Cell nowrap>{row.ads}</Cell>
                  <Cell nowrap muted>{row.programs}</Cell>
                  <Cell muted>{row.verticals.join("・")}</Cell>
                </Row>
              ))}
            </DataTable>
          </Section>

          <Section title="記事への直貼り" count={p.direct.length}>
            {p.direct.length === 0 ? (
              <p className="text-sm text-console-muted">直貼りの配置はありません。</p>
            ) : (
              <DataTable columns={["掲載先", "記事", "位置", "案件", "ASP"]}>
                {p.direct.map((row) => (
                  <Row key={`${row.id}-${row.channel}-${row.slug}`}>
                    <Cell nowrap>{CHANNEL[row.channel] ?? row.channel}</Cell>
                    <Cell>{row.slug}</Cell>
                    <Cell muted>{row.position}</Cell>
                    <Cell>{row.title}</Cell>
                    <Cell nowrap muted>{row.asp}</Cell>
                  </Row>
                ))}
              </DataTable>
            )}
          </Section>
        </>
      )}

      <Section title="在庫">
        {hasError(d.inventory) ? (
          <ErrorNote error={d.inventory.error} />
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="広告エントリ" value={d.inventory.totals.entries} sub={`active ${d.inventory.totals.active}`} />
              <StatCard label="広告主" value={d.inventory.totals.uniqueAdvertisers} />
              <StatCard
                label="分野のカバー"
                value={`${d.inventory.coverage.verticalsCovered}/${d.inventory.coverage.verticalsTotal}`}
                tone={d.inventory.coverage.gapVerticals.length > 0 ? "warn" : "good"}
                sub={
                  d.inventory.coverage.gapVerticals.length > 0
                    ? `欠落: ${d.inventory.coverage.gapVerticals.join(", ")}`
                    : "欠落なし"
                }
              />
              <StatCard
                label="サイズ違反"
                value={d.inventory.sizeViolations.length}
                tone={d.inventory.sizeViolations.length > 0 ? "warn" : "good"}
              />
            </div>
            <div className="mt-2 grid gap-2 lg:grid-cols-2">
              <DataTable columns={["分野", "件数"]}>
                {d.inventory.byVertical.map((v) => (
                  <Row key={v.vertical}>
                    <Cell nowrap>{v.vertical}</Cell>
                    <Cell nowrap muted>{v.count}</Cell>
                  </Row>
                ))}
              </DataTable>
              <DataTable columns={["種類", "件数"]}>
                {d.inventory.byAdType.map((v) => (
                  <Row key={v.adType}>
                    <Cell nowrap>{v.adType}</Cell>
                    <Cell nowrap muted>{v.count}</Cell>
                  </Row>
                ))}
              </DataTable>
            </div>
          </>
        )}
      </Section>

      <Section title="規約の検査">
        {hasError(d.compliance) ? (
          <ErrorNote error={d.compliance.error} />
        ) : (
          <div className="grid gap-2 sm:grid-cols-3">
            <StatCard
              label="構造の問題"
              value={d.compliance.structureIssues.length}
              tone={d.compliance.structureIssues.length > 0 ? "warn" : "good"}
            />
            <StatCard
              label="孤立した直貼り"
              value={d.compliance.directPlacements.orphaned.length}
              tone={d.compliance.directPlacements.orphaned.length > 0 ? "bad" : "good"}
              sub="記事の削除・タグ欠落"
            />
            <StatCard
              label="PR 表記漏れ"
              value={
                d.compliance.directPlacements.missingDisclosure.length > 0 ? (
                  <StatusBadge tone="bad">{d.compliance.directPlacements.missingDisclosure.length}</StatusBadge>
                ) : (
                  0
                )
              }
              tone={d.compliance.directPlacements.missingDisclosure.length > 0 ? "bad" : "good"}
            />
          </div>
        )}
      </Section>
    </div>
  );
}
