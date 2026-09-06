import {
  Badge,
  ErrorNote,
  PageHeading,
  Section,
  Stat,
  Table,
  Td,
  Tr,
  Unmeasured,
} from "@/components/ops/primitives";
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

  const delta = (a?: number, b?: number) =>
    a === undefined || b === undefined || b === 0 ? null : ((a - b) / b) * 100;
  const earningsDelta = delta(Number(latest?.earnings), Number(prev?.earnings));

  return (
    <div className="space-y-8">
      <PageHeading
        title="収益"
        source=".claude/state/metrics/adsense/ + .claude/state/products/sales-ledger.json"
      />

      {/* ★計測範囲。0 と「未計測」を混同させないために必ず出す */}
      <section className="rounded-md border border-console-border bg-console-card p-3">
        <h2 className="text-sm font-bold text-console-fg">計測範囲</h2>
        <p className="mt-1 text-[11px] text-console-muted">
          証拠付きの観測だけを実測として扱います。期間がないチャネルは、0 円ではなく
          <Unmeasured />= 未計測です。
        </p>
        <ul className="mt-2 space-y-1">
          {d.coverage.map((c) => (
            <li key={c.channel} className="flex flex-wrap items-center gap-2 text-[13px]">
              <Badge tone={c.state === "measured" ? "good" : "neutral"}>
                {c.state === "measured" ? "実測" : "未計測"}
              </Badge>
              <span className="font-medium text-console-fg">{c.channel}</span>
              <span className="text-console-muted">{c.note}</span>
            </li>
          ))}
        </ul>
      </section>

      <Section title="商品売上 (KDP / ココナラ)">
        {hasError(d.productSales) ? (
          <ErrorNote error={d.productSales.error} />
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Stat
                label="実売額"
                value={
                  productSales && productSales.observations.length > 0
                    ? `¥${YEN.format(productSales.netRevenueYen)}`
                    : <Unmeasured />
                }
                sub={productSales?.latestPeriodEnd ? `最終期間 ${productSales.latestPeriodEnd}` : "証拠付き期間なし"}
              />
              <Stat
                label="注文件数"
                value={productSales && productSales.observations.length > 0 ? YEN.format(productSales.orders) : <Unmeasured />}
              />
              <Stat
                label="販売数"
                value={productSales && productSales.observations.length > 0 ? YEN.format(productSales.units) : <Unmeasured />}
              />
              <Stat
                label="計測期間数"
                value={productSales ? YEN.format(productSales.observations.length) : <Unmeasured />}
              />
            </div>
            {productSales && productSales.observations.length > 0 ? (
              <div className="mt-4">
                <Table columns={["channel", "product", "period", "orders", "units", "net_yen", "evidence"]}>
                  {productSales.observations.map((row) => (
                    <Tr key={row.id}>
                      <Td nowrap>{row.channel}</Td>
                      <Td nowrap>{row.productId}</Td>
                      <Td nowrap muted>{row.periodStart}〜{row.periodEnd}</Td>
                      <Td nowrap>{row.orders}</Td>
                      <Td nowrap>{row.units}</Td>
                      <Td nowrap>¥{YEN.format(row.netRevenueYen)}</Td>
                      <Td muted>{row.evidencePath}</Td>
                    </Tr>
                  ))}
                </Table>
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
              <Stat
                label={`収益 (${latest?.week ?? "—"})`}
                value={latest ? `¥${YEN.format(Number(latest.earnings))}` : <Unmeasured />}
                tone={earningsDelta === null ? "neutral" : earningsDelta >= 0 ? "good" : "bad"}
                sub={
                  earningsDelta === null
                    ? "前週比なし"
                    : `前週比 ${earningsDelta >= 0 ? "+" : ""}${earningsDelta.toFixed(1)}%`
                }
              />
              <Stat label="RPM" value={latest ? `¥${latest.rpm}` : <Unmeasured />} />
              <Stat
                label="PV"
                value={latest ? YEN.format(Number(latest.page_views)) : <Unmeasured />}
              />
              <Stat
                label="CTR"
                value={latest ? `${(Number(latest.ctr) * 100).toFixed(2)}%` : <Unmeasured />}
                sub={latest ? `clicks ${YEN.format(Number(latest.clicks))}` : undefined}
              />
            </div>
          </Section>

          <Section title="週次推移" count={weeks.length}>
            <Table columns={columns}>
              {weeks.slice(0, 20).map((w) => (
                <Tr key={String(w.week)}>
                  {columns.map((c) => (
                    <Td key={c} nowrap muted={c !== "week" && c !== "earnings"}>
                      {String(w[c] ?? "")}
                    </Td>
                  ))}
                </Tr>
              ))}
            </Table>
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
                <Table columns={b.columns}>
                  {b.rows.slice(0, 10).map((r, i) => (
                    <Tr key={i}>
                      {b.columns.map((c) => (
                        <Td key={c} nowrap muted={c !== "earnings"}>
                          {String(r[c] ?? "")}
                        </Td>
                      ))}
                    </Tr>
                  ))}
                </Table>
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
                className="rounded-md border border-console-border bg-console-card px-3 py-2 text-[13px]"
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
          <pre className="max-h-96 overflow-auto rounded-md border border-console-border bg-console-card p-3 text-[11px] leading-relaxed text-console-fg">
            {d.latestMd}
          </pre>
        )}
      </Section>
    </div>
  );
}
