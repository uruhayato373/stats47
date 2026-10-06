import { Cell, DataTable, PanelCard, Row, StatCard, StatusBadge } from "@/components/admin-ui";
import { Section } from "@/components/layout-primitives";
import { ErrorNote, PageHeading, Unmeasured } from "@/components/ops/primitives";
import { readWeeklyProductRevenue } from "@/lib/server/kpi";
import { revenueSummary } from "@/lib/server/revenue";
import { hasError } from "@/lib/server/state-io";

export const dynamic = "force-dynamic";
export const metadata = { title: "収益 — stats47 admin" };

const YEN = new Intl.NumberFormat("ja-JP");

export default function RevenuePage() {
  const d = revenueSummary();
  const adsense = hasError(d.adsense) ? null : d.adsense;
  const weeks = adsense?.weeks ?? [];
  const columns = adsense?.columns ?? [];
  const latest = weeks[0];
  const prev = weeks[1];
  const productSales = hasError(d.productSales) ? null : d.productSales;
  const weekly = readWeeklyProductRevenue();

  const delta = (a?: number, b?: number) =>
    a === undefined || b === undefined || b === 0 ? null : ((a - b) / b) * 100;
  const earningsDelta = delta(Number(latest?.earnings), Number(prev?.earnings));

  return (
    <div className="space-y-8">
      <PageHeading
        title="収益"
        source="data/authenticated/revenue-history.json + data/products/sales-ledger.json + data/adsense/"
      />

      {/* ★計測範囲。0 と「未計測」を混同させないために必ず出す */}
      <PanelCard title="計測範囲">
        <p className="text-[11px] text-console-muted">
          証拠付きの販売台帳か、直近 3 日以内の自動取得 (revenue-history.json) があるチャネルを実測として扱います。
          どちらも無いチャネルは、0 円ではなく<Unmeasured />= 未計測です。
        </p>
        <ul className="mt-2 space-y-1">
          {d.coverage.map((c) => (
            <li key={c.channel} className="flex flex-wrap items-center gap-2 text-[13px]">
              <StatusBadge tone={c.state === "measured" ? "good" : "neutral"}>
                {c.state === "measured" ? "実測" : "未計測"}
              </StatusBadge>
              <span className="font-medium text-console-fg">{c.channel}</span>
              <span className="text-console-muted">{c.note}</span>
            </li>
          ))}
        </ul>
      </PanelCard>

      <Section
        title="商品の週次実売 (自動取得)"
        note="週次 Issue の NSM 節と同じ計算 (product-revenue.mjs)。KDP はロイヤリティ見積りなので合計に入れない。欠測は 0 円ではなく判定不能。"
      >
        {hasError(weekly) ? (
          <ErrorNote error={weekly.error} />
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                label={`実売 ${weekly.weekStart}〜${weekly.weekEnd}`}
                value={weekly.yen == null ? <Unmeasured /> : `¥${YEN.format(weekly.yen)}`}
                sub={weekly.status === "ok" ? "全チャネル判定済み" : "判定不能のチャネルあり"}
              />
              <StatCard label="件数" value={weekly.count == null ? <Unmeasured /> : YEN.format(weekly.count)} />
              <StatCard
                label="日次の観測"
                value={YEN.format(weekly.entries)}
                sub={weekly.latestDate ? `最新 ${weekly.latestDate}` : "記録なし"}
              />
            </div>
            <DataTable columns={["チャネル", "状態", "内訳"]}>
              {weekly.channels.map((c) => (
                <Row key={c.channel}>
                  <Cell nowrap>{c.channel}</Cell>
                  <Cell nowrap>
                    <StatusBadge tone={c.status === "ok" ? (c.estimate ? "info" : "good") : "neutral"}>
                      {c.status === "ok" ? (c.estimate ? "見積り" : "判定済み") : "判定不能"}
                    </StatusBadge>
                  </Cell>
                  <Cell muted>{c.text}</Cell>
                </Row>
              ))}
            </DataTable>
          </>
        )}
      </Section>

      <Section title="販売台帳 (証拠付きの手入力・KDP / ココナラ)">
        {hasError(d.productSales) ? (
          <ErrorNote error={d.productSales.error} />
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="実売額"
                value={
                  productSales && productSales.observations.length > 0
                    ? `¥${YEN.format(productSales.netRevenueYen)}`
                    : <Unmeasured />
                }
                sub={productSales?.latestPeriodEnd ? `最終期間 ${productSales.latestPeriodEnd}` : "証拠付き期間なし"}
              />
              <StatCard
                label="注文件数"
                value={productSales && productSales.observations.length > 0 ? YEN.format(productSales.orders) : <Unmeasured />}
              />
              <StatCard
                label="販売数"
                value={productSales && productSales.observations.length > 0 ? YEN.format(productSales.units) : <Unmeasured />}
              />
              <StatCard
                label="計測期間数"
                value={productSales ? YEN.format(productSales.observations.length) : <Unmeasured />}
              />
            </div>
            {productSales && productSales.observations.length > 0 ? (
              <div className="mt-4">
                <DataTable columns={["channel", "product", "period", "orders", "units", "net_yen", "evidence"]}>
                  {productSales.observations.map((row) => (
                    <Row key={row.id}>
                      <Cell nowrap>{row.channel}</Cell>
                      <Cell nowrap>{row.productId}</Cell>
                      <Cell nowrap muted>{row.periodStart}〜{row.periodEnd}</Cell>
                      <Cell nowrap>{row.orders}</Cell>
                      <Cell nowrap>{row.units}</Cell>
                      <Cell nowrap>¥{YEN.format(row.netRevenueYen)}</Cell>
                      <Cell muted>{row.evidencePath}</Cell>
                    </Row>
                  ))}
                </DataTable>
              </div>
            ) : (
              <p className="mt-3 text-sm text-console-muted">
                KDPまたはココナラの公式レポートを保存後、product-factoryの販売台帳CLIで記録します。
              </p>
            )}
          </>
        )}
      </Section>

      {hasError(d.adsense) ? (
        <ErrorNote error={d.adsense.error} />
      ) : (
        <>
          <Section title="直近週">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label={`収益 (${latest?.week ?? "—"})`}
                value={latest ? `¥${YEN.format(Number(latest.earnings))}` : <Unmeasured />}
                tone={earningsDelta === null ? "neutral" : earningsDelta >= 0 ? "good" : "bad"}
                sub={
                  earningsDelta === null
                    ? "前週比なし"
                    : `前週比 ${earningsDelta >= 0 ? "+" : ""}${earningsDelta.toFixed(1)}%`
                }
              />
              <StatCard label="RPM" value={latest ? `¥${latest.rpm}` : <Unmeasured />} />
              <StatCard
                label="PV"
                value={latest ? YEN.format(Number(latest.page_views)) : <Unmeasured />}
              />
              <StatCard
                label="CTR"
                value={latest ? `${(Number(latest.ctr) * 100).toFixed(2)}%` : <Unmeasured />}
                sub={latest ? `clicks ${YEN.format(Number(latest.clicks))}` : undefined}
              />
            </div>
          </Section>

          <Section title="週次推移" count={weeks.length}>
            <DataTable columns={columns}>
              {weeks.slice(0, 20).map((w) => (
                <Row key={String(w.week)}>
                  {columns.map((c) => (
                    <Cell key={c} nowrap muted={c !== "week" && c !== "earnings"}>
                      {String(w[c] ?? "")}
                    </Cell>
                  ))}
                </Row>
              ))}
            </DataTable>
            {weeks.length > 20 ? (
              <p className="mt-1 text-[11px] text-console-muted">直近 20 週を表示 (全 {weeks.length} 週)</p>
            ) : null}
          </Section>
        </>
      )}

      <Section title="内訳 (最新週)">
        {hasError(d.breakdowns) ? (
          <ErrorNote error={d.breakdowns.error} />
        ) : d.breakdowns.length === 0 ? (
          <p className="text-sm text-console-muted">内訳 CSV がありません。</p>
        ) : (
          <div className="space-y-4">
            {d.breakdowns.map((b) => (
              <div key={b.file} className="space-y-1">
                <h3 className="text-[13px] font-medium text-console-muted">
                  {b.label} <span className="text-console-muted/70">({b.latestWeek})</span>
                </h3>
                <DataTable columns={b.columns}>
                  {b.rows.slice(0, 10).map((r, i) => (
                    <Row key={i}>
                      {b.columns.map((c) => (
                        <Cell key={c} nowrap muted={c !== "earnings"}>
                          {String(r[c] ?? "")}
                        </Cell>
                      ))}
                    </Row>
                  ))}
                </DataTable>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="改善候補">
        {hasError(d.candidates) ? (
          <ErrorNote error={d.candidates.error} />
        ) : d.candidates.candidates.length === 0 ? (
          <p className="text-sm text-console-muted">候補はありません ({d.candidates.week ?? "—"})。</p>
        ) : (
          <ul className="space-y-1.5">
            {d.candidates.candidates.map((c, i) => (
              <li
                key={i}
                className="rounded-md border px-3 py-2 text-[13px]"
              >
                <span className="font-medium text-console-fg">{String(c.id ?? c.rule ?? i)}</span>{" "}
                <span className="text-console-muted">{String(c.key ?? "")}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="週次レポート (LATEST.md)">
        {hasError(d.latestMd) ? (
          <ErrorNote error={d.latestMd.error} />
        ) : (
          <pre className="max-h-96 overflow-auto rounded-md border bg-muted p-3 text-[11px] leading-relaxed text-foreground">
            {d.latestMd}
          </pre>
        )}
      </Section>
    </div>
  );
}
