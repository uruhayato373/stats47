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
import { affiliatePrograms } from "@/lib/server/affiliate";
import { adsSummary } from "@/lib/server/ads";
import { hasError } from "@/lib/server/state-io";

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
 * /affiliate/programs — 提携と案件 (要対応)。doboku-note の /affiliate/programs に揃える。
 * 案件ごとに、配信中の広告があるか・ASP での提携状態・報酬・掲載終了日を並べる。
 * 掲載終了日は広告定義の endDate (doboku-note のリンク期限に相当)。
 */
export default function AffiliateProgramsPage() {
  const p = affiliatePrograms();
  const d = adsSummary();

  return (
    <div className="space-y-8">
      <PageHeading title="アフィリエイト 提携・案件" source=".claude/state/ads/{a8-catalog,affiliate-catalog}.json" />

      <Section title="案件ポートフォリオ">
        {hasError(d.portfolio) ? (
          <ErrorNote error={d.portfolio.error} />
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="案件" value={d.portfolio.totals.offers} sub={`creative ${d.portfolio.totals.ads}`} />
              <Stat
                label="未分類"
                value={d.portfolio.totals.unclassified}
                tone={d.portfolio.totals.unclassified > 0 ? "warn" : "good"}
                sub="推測せず配信候補から隔離"
              />
              <Stat
                label="欠損指標を持つ案件"
                value={d.portfolio.unknownMetricOffers}
                tone={d.portfolio.unknownMetricOffers > 0 ? "warn" : "good"}
                sub={`共用口座 ${d.portfolio.totals.sharedOutcomePrograms} 件`}
              />
              <Stat
                label="次の1件"
                value={d.portfolio.nextAction?.id ?? "—"}
                sub={d.portfolio.nextAction?.programRef ?? d.portfolio.nextAction?.reasons.join(" / ") ?? "—"}
              />
            </div>
            <div className="mt-2">
              <Table columns={["レーン", "案件数"]}>
                {d.portfolio.lanes.map((lane) => (
                  <Tr key={lane.lane}>
                    <Td nowrap>{lane.lane}</Td>
                    <Td nowrap muted>{lane.count}</Td>
                  </Tr>
                ))}
              </Table>
            </div>
          </>
        )}
      </Section>

      {hasError(p) ? (
        <ErrorNote error={p.error} />
      ) : (
        <>
          <Section title="ASP ごとの提携状態">
            <p className="text-sm text-console-fg">
              {["a8", "moshimo", "afb"].map((asp) => (
                <span key={asp} className="mr-4">
                  <span className="font-medium">{ASP[asp]}</span>{" "}
                  <span className="text-console-muted">
                    {p.byStatus
                      .filter((s) => s.asp === asp)
                      .map((s) => `${STATUS[s.status] ?? s.status} ${s.count}`)
                      .join("・") || "—"}
                  </span>
                </span>
              ))}
            </p>
          </Section>

          <Section title="案件" count={p.rows.length}>
            <p className="text-[11px] text-console-muted">配信中の案件を先頭に並べる。報酬は ASP カタログの記録値</p>
            <Table columns={["案件", "配信", "ASP", "提携", "報酬", "分野", "掲載終了日"]}>
              {p.rows.map((r) => (
                <Tr key={r.programRef}>
                  <Td>{r.name}</Td>
                  <Td nowrap>{r.live ? <Badge tone="good">配信中</Badge> : <span className="text-console-muted">なし</span>}</Td>
                  <Td nowrap muted>{ASP[r.asp] ?? r.asp}</Td>
                  <Td nowrap>{STATUS[r.status] ?? r.status}</Td>
                  <Td nowrap muted>{r.rewardYen == null ? "—" : `¥${r.rewardYen.toLocaleString()}`}</Td>
                  <Td nowrap muted>{r.vertical ?? "—"}</Td>
                  <Td nowrap muted>{r.endDate ?? "—"}</Td>
                </Tr>
              ))}
            </Table>
          </Section>
        </>
      )}
    </div>
  );
}
