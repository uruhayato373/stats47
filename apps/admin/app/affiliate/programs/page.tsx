import { CircleHelpIcon, HandshakeIcon, ListChecksIcon, PackageIcon, RouteIcon, TriangleAlertIcon } from "lucide-react";

import { Cell, DataGrid, DataTable, PanelCard, Row, StatCard, StatusBadge } from "@/components/admin-ui";
import { Grid, Section } from "@/components/layout-primitives";
import { ErrorNote, PageHeading } from "@/components/ops/primitives";
import { affiliatePrograms } from "@/lib/server/affiliate";
import { adsSummary } from "@/lib/server/ads";
import { hasError } from "@/lib/server/state-io";
import { datasetDir } from "../../../../../config/datasets.mjs";

export const dynamic = "force-dynamic";
export const metadata = { title: "アフィリエイト 提携・案件 — stats47 admin" };

const ASP: Record<string, string> = { a8: "A8", moshimo: "もしも", afb: "afb" };
const STATUS: Record<string, string> = {
  approved: "提携中",
  applying: "申請中",
  applied: "申請済み",
  registered: "登録済み",
  none: "未申請",
  unavailable: "取扱なし",
  blocked: "停止",
  error: "申請失敗",
  rejected: "否認",
  unknown: "未確認",
};

/**
 * /affiliate/programs — 提携と案件 (要対応)。型 B (一覧): 件数の要約 → 一覧。doboku-note の /affiliate/programs に揃える。
 * 案件ごとに、配信中の広告があるか・ASP での提携状態・報酬・掲載終了日を並べる。
 * 掲載終了日は広告定義の endDate (doboku-note のリンク期限に相当)。
 */
export default function AffiliateProgramsPage() {
  const p = affiliatePrograms();
  const d = adsSummary();

  return (
    <>
      <PageHeading title="アフィリエイト 提携・案件" source={`${datasetDir("affiliate.audits")}/{a8-catalog,affiliate-catalog}.json`} />

      {hasError(d.portfolio) ? (
        <ErrorNote error={d.portfolio.error} />
      ) : (
        <>
          <Grid min="sm">
            <StatCard label="案件" icon={<PackageIcon />} value={d.portfolio.totals.offers} sub={`creative ${d.portfolio.totals.ads}`} />
            <StatCard
              label="未分類"
              icon={<CircleHelpIcon />}
              value={d.portfolio.totals.unclassified}
              tone={d.portfolio.totals.unclassified > 0 ? "warn" : "good"}
              sub="推測せず配信候補から隔離"
            />
            <StatCard
              label="欠損指標を持つ案件"
              icon={<TriangleAlertIcon />}
              value={d.portfolio.unknownMetricOffers}
              tone={d.portfolio.unknownMetricOffers > 0 ? "warn" : "good"}
              sub={`共用口座 ${d.portfolio.totals.sharedOutcomePrograms} 件`}
            />
            <StatCard
              label="次の1件"
              icon={<ListChecksIcon />}
              value={d.portfolio.nextAction?.id ?? "—"}
              sub={d.portfolio.nextAction?.programRef ?? d.portfolio.nextAction?.reasons.join(" / ") ?? "—"}
            />
          </Grid>
          <PanelCard title="案件ポートフォリオのレーン" icon={<RouteIcon />}>
            <DataTable columns={["レーン", "案件数"]}>
              {d.portfolio.lanes.map((lane) => (
                <Row key={lane.lane}>
                  <Cell nowrap>{lane.lane}</Cell>
                  <Cell nowrap muted>
                    {lane.count}
                  </Cell>
                </Row>
              ))}
            </DataTable>
          </PanelCard>
        </>
      )}

      {hasError(p) ? (
        <ErrorNote error={p.error} />
      ) : (
        <>
          <PanelCard title="ASP ごとの提携状態" icon={<HandshakeIcon />}>
            <p className="text-sm text-foreground">
              {["a8", "moshimo", "afb"].map((asp) => (
                <span key={asp} className="mr-4">
                  <span className="font-medium">{ASP[asp]}</span>{" "}
                  <span className="text-muted-foreground">
                    {p.byStatus
                      .filter((s) => s.asp === asp)
                      .map((s) => `${STATUS[s.status] ?? s.status} ${s.count}`)
                      .join("・") || "—"}
                  </span>
                </span>
              ))}
            </p>
          </PanelCard>

          <Section title="案件" count={p.rows.length} note="配信中の案件を先頭に並べる。報酬は ASP カタログの記録値">
            <DataGrid
              columns={[
                { id: "name", header: "案件", sortable: true },
                { id: "live", header: "配信", sortable: true, nowrap: true },
                { id: "asp", header: "ASP", sortable: true, nowrap: true },
                { id: "status", header: "提携", sortable: true, nowrap: true },
                { id: "reward", header: "報酬", numeric: true, sortable: true, nowrap: true },
                { id: "vertical", header: "分野", sortable: true, nowrap: true },
                { id: "end", header: "掲載終了日", sortable: true, nowrap: true },
              ]}
              rows={p.rows.map((r) => ({
                id: r.programRef,
                cells: [
                  r.name,
                  r.live ? (
                    <StatusBadge key="live" tone="good">
                      配信中
                    </StatusBadge>
                  ) : (
                    <span key="live" className="text-muted-foreground">
                      なし
                    </span>
                  ),
                  <span key="asp" className="text-muted-foreground">
                    {ASP[r.asp] ?? r.asp}
                  </span>,
                  STATUS[r.status] ?? r.status,
                  <span key="reward" className="text-muted-foreground">
                    {r.rewardYen == null ? "—" : `¥${r.rewardYen.toLocaleString()}`}
                  </span>,
                  <span key="v" className="text-muted-foreground">
                    {r.vertical ?? "—"}
                  </span>,
                  <span key="end" className="text-muted-foreground">
                    {r.endDate ?? "—"}
                  </span>,
                ],
                sort: [r.name, r.live ? 0 : 1, r.asp, r.status, r.rewardYen ?? null, r.vertical ?? null, r.endDate ?? null],
                search: `${r.name} ${r.programRef} ${r.vertical ?? ""}`,
                facet: r.asp,
              }))}
              facets={["a8", "moshimo", "afb"].map((a) => ({ value: a, label: ASP[a] }))}
              searchPlaceholder="案件名・分野で絞り込み"
            />
          </Section>
        </>
      )}
    </>
  );
}
