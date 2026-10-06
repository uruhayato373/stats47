import { Cell, DataTable, Row, StatCard, StatusBadge } from "@/components/admin-ui";
import { Section } from "@/components/layout-primitives";
import { ErrorNote, Freshness, PageHeading } from "@/components/ops/primitives";
import { affiliateResults, ZERO_CLICK_IMPRESSION_THRESHOLD } from "@/lib/server/affiliate";
import { adsSummary } from "@/lib/server/ads";
import { hasError } from "@/lib/server/state-io";

export const dynamic = "force-dynamic";
export const metadata = { title: "アフィリエイト 成果 — stats47 admin" };

const yen = (v: number | null | undefined) => (v == null ? "—" : `¥${v.toLocaleString()}`);
const rate = (c: number, i: number) => (i > 0 ? `${((c / i) * 100).toFixed(3)}%` : "—");

function gateTone(status: string) {
  if (status === "ready" || status === "ok") return "good" as const;
  if (status === "blocked") return "bad" as const;
  return "warn" as const;
}

/**
 * /affiliate — 成果 (効いたか)。doboku-note の /affiliate に揃える。
 * 改善の判断はサイト内の掲載位置別クリック (GA4) で行い、ASP は成果 (発生・確定) を見る。
 * A8 のクリックは doboku-note と共用の口座なので、サイト別集計 (siteSummary) を stats47 の真実源にする。
 */
export default function AffiliateResultsPage() {
  const r = affiliateResults();
  const d = adsSummary();

  return (
    <div className="space-y-8">
      <PageHeading title="アフィリエイト 成果" source="data/affiliate/ + .claude/state/ads/" />

      {hasError(r) ? (
        <ErrorNote error={r.error} />
      ) : (
        <>
          <Section title="成果">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label={`A8 発生 ${r.a8.sitePeriod ?? ""}`}
                value={r.a8.site ? r.a8.site.conversions.toLocaleString() : "—"}
                sub={r.a8.siteFetchedAt ? `サイト別集計・取得 ${r.a8.siteFetchedAt.slice(0, 10)}・クリック ${r.a8.site?.clicks ?? "—"}` : "未取得"}
              />
              <StatCard
                label={`A8 確定額 ${r.a8.sitePeriod ?? ""}`}
                value={r.a8.site ? yen(r.a8.site.revenueYen) : "—"}
                sub={r.a8.site ? `未確定 ${yen(r.a8.site.pendingRevenueYen)}` : "未取得"}
              />
              <StatCard
                label="もしも 確定額"
                value={r.moshimo ? yen(r.moshimo.revenueYen) : "—"}
                sub={r.moshimo ? `${r.moshimo.from}〜${r.moshimo.to}・発生 ${r.moshimo.conversions} 件` : "未取得"}
              />
              <StatCard
                label="A8 集計から漏れている案件"
                value={r.a8.unmapped}
                tone={r.a8.unmapped > 0 ? "warn" : "good"}
                sub={`両サイト共用で配賦できない案件 ${r.a8.notAttributable} 件`}
              />
            </div>
            <p className="text-[11px] text-console-muted">
              ASP の取得状態:{" "}
              {r.collections.map((c) => (
                <span key={c.asp} className="mr-3">
                  {c.asp}{" "}
                  <StatusBadge tone={c.status === "pass" ? "good" : "bad"}>
                    {c.status === "pass" ? "取得" : `${c.code ?? c.status}`}
                  </StatusBadge>
                  {c.observedAt ? ` ${c.observedAt.slice(0, 10)}` : ""}
                </span>
              ))}
              — 取得できていない ASP の成果は 0 円ではなく判定不能として扱う
            </p>
          </Section>

          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="掲載位置別のクリック (GA4)">
              {r.positions ? (
                <>
                  <p className="text-[11px] text-console-muted">
                    {r.positions.date} までの直近 {r.positions.days} 日。表示 {ZERO_CLICK_IMPRESSION_THRESHOLD.toLocaleString()} 以上でクリック 0 の位置を強調する
                  </p>
                  <DataTable columns={["掲載位置", "表示", "クリック", "率"]}>
                    {r.positions.rows.map((p) => (
                      <Row key={p.position}>
                        <Cell nowrap>{p.position}</Cell>
                        <Cell nowrap muted>{p.impressions.toLocaleString()}</Cell>
                        <Cell nowrap>
                          {p.zeroClickWarning ? <StatusBadge tone="warn">0</StatusBadge> : p.clicks}
                        </Cell>
                        <Cell nowrap muted>{rate(p.clicks, p.impressions)}</Cell>
                      </Row>
                    ))}
                  </DataTable>
                </>
              ) : (
                <p className="text-sm text-console-muted">未計測 (ga4-affiliate-history.csv が無い)</p>
              )}
            </Section>

            <Section title={`A8 案件 ${r.a8.month ?? ""}${r.a8.month && r.a8.sitePeriod && r.a8.month !== r.a8.sitePeriod ? "（案件別明細は毎日の収集対象外のため古い）" : ""}`} count={r.a8.programs.length}>
              {r.a8.programs.length === 0 ? (
                <p className="text-sm text-console-muted">未取得 (/a8-report)</p>
              ) : (
                <DataTable columns={["案件", "クリック", "発生", "確定", "確定額"]}>
                  {r.a8.programs.map((p) => (
                    <Row key={p.programRef}>
                      <Cell>{p.name}</Cell>
                      <Cell nowrap muted>{p.clicks}</Cell>
                      <Cell nowrap>{p.conversions}</Cell>
                      <Cell nowrap>{p.approved}</Cell>
                      <Cell nowrap>{yen(p.revenueYen)}</Cell>
                    </Row>
                  ))}
                </DataTable>
              )}
            </Section>
          </div>
        </>
      )}

      {hasError(d.operations) ? (
        <ErrorNote error={d.operations.error} />
      ) : (
        <>
          <Section title="ゲート">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="計測ゲート"
                value={d.operations.measurementGate.status}
                tone={gateTone(d.operations.measurementGate.status)}
                sub={d.operations.measurementGate.reasons.join(" / ") || "—"}
              />
              <StatCard
                label="公開ゲート"
                value={d.operations.publishGate.status}
                tone={gateTone(d.operations.publishGate.status)}
                sub={d.operations.publishGate.reasons.join(" / ") || "—"}
              />
              <StatCard
                label="案件ポートフォリオ"
                value={d.operations.portfolioGate.status}
                tone={gateTone(d.operations.portfolioGate.status)}
                sub={d.operations.portfolioGate.reasons.join(" / ") || "—"}
              />
              <StatCard
                label="鮮度"
                value={<Freshness iso={d.operations.generatedAt} />}
                sub={`在庫 ${d.operations.freshness.inventoryDays ?? "—"}日前 / GA4 ${
                  d.operations.freshness.ga4Days ?? "—"
                }日前`}
              />
            </div>
          </Section>

          {d.operations.recommendedActions.length > 0 ? (
            <Section title="推奨アクション" count={d.operations.recommendedActions.length}>
              <ul className="space-y-1.5">
                {d.operations.recommendedActions.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-md border border-console-warn/40 bg-console-warn/10 px-3 py-2 text-sm"
                  >
                    <div className="font-medium text-console-warn">{a.id}</div>
                    <div className="text-console-fg">{a.reason}</div>
                    <code className="mt-1 block break-all text-[11px] text-console-muted">
                      {a.command}
                    </code>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          <Section title="クリエイティブ実験" count={d.operations.experiments.length}>
            {d.operations.experiments.length === 0 ? (
              <p className="text-sm text-console-muted">実験はありません。</p>
            ) : (
              <DataTable columns={["ID", "種別", "状態", "開始", "経過", "標本", "variant"]}>
                {d.operations.experiments.map((e) => (
                  <Row key={e.experimentId}>
                    <Cell nowrap>{e.experimentId}</Cell>
                    <Cell nowrap muted>{e.kind}</Cell>
                    <Cell nowrap>
                      <StatusBadge tone={e.bucket === "readyToDecide" ? "info" : "neutral"}>{e.bucket}</StatusBadge>
                    </Cell>
                    <Cell nowrap muted>{e.startedAt ?? "—"}</Cell>
                    <Cell nowrap muted>{e.daysElapsed !== null ? `${e.daysElapsed}日` : "—"}</Cell>
                    <Cell nowrap>
                      {e.sampleReached === null ? (
                        "—"
                      ) : (
                        <StatusBadge tone={e.sampleReached ? "good" : "warn"}>
                          {e.sampleReached ? "到達" : "未達"}
                        </StatusBadge>
                      )}
                    </Cell>
                    <Cell muted>
                      {e.variants.map((v) => `${v.variantId}: ${v.impressions}imp/${v.clicks}clk`).join(" · ") || "—"}
                    </Cell>
                  </Row>
                ))}
              </DataTable>
            )}
          </Section>
        </>
      )}

      <Section title="公開パイロット">
        {hasError(d.pilot) ? (
          <ErrorNote error={d.pilot.error} />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="開始ゲート"
              value={d.pilot.readiness.status}
              tone={gateTone(d.pilot.readiness.status)}
              sub={d.pilot.readiness.reasons.join(" / ") || "—"}
            />
            <StatCard
              label="観測判定"
              value={d.pilot.verdict.status}
              tone={d.pilot.verdict.status === "ready-to-present" ? "good" : "warn"}
              sub="勝者は自動選択しない"
            />
            <StatCard
              label="必要母数"
              value={d.pilot.feasibility?.requiredImpressions?.toLocaleString() ?? "—"}
              sub={d.pilot.feasibility?.projectedDays ? `推定 ${d.pilot.feasibility.projectedDays}日` : "plan確定後に計算"}
            />
            <StatCard label="次の1件" value={d.pilot.recommendedAction.id} sub={d.pilot.recommendedAction.reasons[0] ?? "—"} />
          </div>
        )}
      </Section>
    </div>
  );
}
