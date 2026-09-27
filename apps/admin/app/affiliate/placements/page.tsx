import {
  Badge,
  ErrorNote,
  PageHeading,
  Section,
  Stat,
  Table,
  Td,
  Tr,
} from "@/components/ops/primitives";
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
            <Table columns={["置き場所", "広告", "案件", "分野"]}>
              {p.auto.map((row) => (
                <Tr key={row.locationCode}>
                  <Td nowrap>
                    {row.label}
                    <span className="ml-1 text-[11px] text-console-muted">{row.locationCode}</span>
                  </Td>
                  <Td nowrap>{row.ads}</Td>
                  <Td nowrap muted>{row.programs}</Td>
                  <Td muted>{row.verticals.join("・")}</Td>
                </Tr>
              ))}
            </Table>
          </Section>

          <Section title="記事への直貼り" count={p.direct.length}>
            {p.direct.length === 0 ? (
              <p className="text-sm text-console-muted">直貼りの配置はありません。</p>
            ) : (
              <Table columns={["掲載先", "記事", "位置", "案件", "ASP"]}>
                {p.direct.map((row) => (
                  <Tr key={`${row.id}-${row.channel}-${row.slug}`}>
                    <Td nowrap>{CHANNEL[row.channel] ?? row.channel}</Td>
                    <Td>{row.slug}</Td>
                    <Td muted>{row.position}</Td>
                    <Td>{row.title}</Td>
                    <Td nowrap muted>{row.asp}</Td>
                  </Tr>
                ))}
              </Table>
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
              <Stat label="広告エントリ" value={d.inventory.totals.entries} sub={`active ${d.inventory.totals.active}`} />
              <Stat label="広告主" value={d.inventory.totals.uniqueAdvertisers} />
              <Stat
                label="分野のカバー"
                value={`${d.inventory.coverage.verticalsCovered}/${d.inventory.coverage.verticalsTotal}`}
                tone={d.inventory.coverage.gapVerticals.length > 0 ? "warn" : "good"}
                sub={
                  d.inventory.coverage.gapVerticals.length > 0
                    ? `欠落: ${d.inventory.coverage.gapVerticals.join(", ")}`
                    : "欠落なし"
                }
              />
              <Stat
                label="サイズ違反"
                value={d.inventory.sizeViolations.length}
                tone={d.inventory.sizeViolations.length > 0 ? "warn" : "good"}
              />
            </div>
            <div className="mt-2 grid gap-2 lg:grid-cols-2">
              <Table columns={["分野", "件数"]}>
                {d.inventory.byVertical.map((v) => (
                  <Tr key={v.vertical}>
                    <Td nowrap>{v.vertical}</Td>
                    <Td nowrap muted>{v.count}</Td>
                  </Tr>
                ))}
              </Table>
              <Table columns={["種類", "件数"]}>
                {d.inventory.byAdType.map((v) => (
                  <Tr key={v.adType}>
                    <Td nowrap>{v.adType}</Td>
                    <Td nowrap muted>{v.count}</Td>
                  </Tr>
                ))}
              </Table>
            </div>
          </>
        )}
      </Section>

      <Section title="規約の検査">
        {hasError(d.compliance) ? (
          <ErrorNote error={d.compliance.error} />
        ) : (
          <div className="grid gap-2 sm:grid-cols-3">
            <Stat
              label="構造の問題"
              value={d.compliance.structureIssues.length}
              tone={d.compliance.structureIssues.length > 0 ? "warn" : "good"}
            />
            <Stat
              label="孤立した直貼り"
              value={d.compliance.directPlacements.orphaned.length}
              tone={d.compliance.directPlacements.orphaned.length > 0 ? "bad" : "good"}
              sub="記事の削除・タグ欠落"
            />
            <Stat
              label="PR 表記漏れ"
              value={
                d.compliance.directPlacements.missingDisclosure.length > 0 ? (
                  <Badge tone="bad">{d.compliance.directPlacements.missingDisclosure.length}</Badge>
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
