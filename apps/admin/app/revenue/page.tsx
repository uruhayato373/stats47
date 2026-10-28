import { ChartColumnIcon, EyeIcon, GaugeIcon, MousePointerClickIcon, ScaleIcon, TrendingUpIcon, WalletIcon } from "lucide-react";

import { Cell, DataGrid, DataTable, PanelCard, Row, StatCard, StatusBadge, TrendChart, type StatTrend } from "@/components/admin-ui";
import { Grid, Section } from "@/components/layout-primitives";
import { ErrorNote, PageHeading, Unmeasured } from "@/components/ops/primitives";
import { Collapsible, CollapsibleContent, CollapsibleTrigger, Button, Tabs, TabsContent, TabsList, TabsTrigger } from "@stats47/components";
import { readWeeklyProductRevenue } from "@/lib/server/kpi";
import { revenueSummary } from "@/lib/server/revenue";
import { hasError } from "@/lib/server/state-io";
import { datasetDir, datasetPath } from "../../../../config/datasets.mjs";

export const dynamic = "force-dynamic";
export const metadata = { title: "収益 — stats47 admin" };

const YEN = new Intl.NumberFormat("ja-JP");
const num = (v: unknown) => (v === "" || v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v));

/** 前週比の Badge。比べる値が無いときは出さない */
function weekTrend(a: number | null, b: number | null): StatTrend | undefined {
  if (a === null || b === null || b === 0) return undefined;
  const pct = ((a - b) / b) * 100;
  return { label: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`, direction: pct > 0 ? "up" : pct < 0 ? "down" : "flat" };
}

/** 収益 (型 A: 概況)。指標カード → 推移チャート → 表の順 (公式 dashboard-01 の並べ方)。 */
export default function RevenuePage() {
  const d = revenueSummary();
  const adsense = hasError(d.adsense) ? null : d.adsense;
  const weeks = adsense?.weeks ?? [];
  const latest = weeks[0];
  const prev = weeks[1];
  const productSales = hasError(d.productSales) ? null : d.productSales;
  const weekly = readWeeklyProductRevenue();
  const chronological = [...weeks].reverse().map((w) => ({
    week: String(w.week),
    earnings: num(w.earnings),
    page_views: num(w.page_views),
    rpm: num(w.rpm),
  }));
  const ranges = [
    { label: "全期間", last: chronological.length },
    { label: "直近 12 週", last: 12 },
    { label: "直近 4 週", last: 4 },
  ];

  return (
    <>
      <PageHeading
        title="収益"
        source={`${datasetDir("revenue.authenticated")}/revenue-history.json + ${datasetPath("sales.ledger")} + ${datasetDir("adsense.reports")}/`}
      />

      {hasError(d.adsense) ? (
        <ErrorNote error={d.adsense.error} />
      ) : (
        <>
          <Grid min="sm">
            <StatCard
              label="AdSense 収益"
              icon={<WalletIcon />}
              value={latest ? `¥${YEN.format(Number(latest.earnings))}` : <Unmeasured />}
              trend={weekTrend(num(latest?.earnings), num(prev?.earnings))}
              sub={`${latest?.week ?? "—"} の週・前週比`}
            />
            <StatCard label="RPM" icon={<GaugeIcon />} value={latest ? `¥${latest.rpm}` : <Unmeasured />} trend={weekTrend(num(latest?.rpm), num(prev?.rpm))} />
            <StatCard
              label="PV"
              icon={<EyeIcon />}
              value={latest ? YEN.format(Number(latest.page_views)) : <Unmeasured />}
              trend={weekTrend(num(latest?.page_views), num(prev?.page_views))}
            />
            <StatCard
              label="CTR"
              icon={<MousePointerClickIcon />}
              value={latest ? `${(Number(latest.ctr) * 100).toFixed(2)}%` : <Unmeasured />}
              sub={latest ? `クリック ${YEN.format(Number(latest.clicks))}` : undefined}
            />
          </Grid>
          <Grid min="lg">
            <TrendChart
              title="AdSense 収益の推移"
              icon={<TrendingUpIcon />}
              description={`週次 (${chronological.length} 週)`}
              data={chronological}
              xKey="week"
              series={[{ key: "earnings", label: "収益" }]}
              valueFormat="yen"
              ranges={ranges}
            />
            <TrendChart
              title="PV の推移"
              icon={<ChartColumnIcon />}
              description="週次・AdSense の計測した表示"
              data={chronological}
              xKey="week"
              series={[{ key: "page_views", label: "PV" }]}
              kind="bar"
              ranges={ranges}
            />
          </Grid>
        </>
      )}

      {/* ★計測範囲。0 と「未計測」を混同させないために必ず出す */}
      <PanelCard
        title="計測範囲"
        icon={<ScaleIcon />}
        description={
          <>
            証拠付きの販売台帳か、直近 3 日以内の自動取得 (revenue-history.json) があるチャネルを実測として扱います。どちらも無いチャネルは、0
            円ではなく <Unmeasured /> = 未計測です。
          </>
        }
      >
        <DataTable columns={["状態", "チャネル", "根拠"]}>
          {d.coverage.map((c) => (
            <Row key={c.channel}>
              <Cell nowrap>
                <StatusBadge tone={c.state === "measured" ? "good" : "neutral"}>{c.state === "measured" ? "実測" : "未計測"}</StatusBadge>
              </Cell>
              <Cell nowrap className="font-medium">
                {c.channel}
              </Cell>
              <Cell muted>{c.note}</Cell>
            </Row>
          ))}
        </DataTable>
      </PanelCard>

      <Section
        title="商品の週次実売 (自動取得)"
        note="週次 Issue の NSM 節と同じ計算 (product-revenue.mjs)。KDP はロイヤリティ見積りなので合計に入れない。欠測は 0 円ではなく判定不能。"
      >
        {hasError(weekly) ? (
          <ErrorNote error={weekly.error} />
        ) : (
          <>
            <Grid min="sm">
              <StatCard
                label={`実売 ${weekly.weekStart}〜${weekly.weekEnd}`}
                value={weekly.yen == null ? <Unmeasured /> : `¥${YEN.format(weekly.yen)}`}
                sub={weekly.status === "ok" ? "全チャネル判定済み" : "判定不能のチャネルあり"}
              />
              <StatCard label="件数" value={weekly.count == null ? <Unmeasured /> : YEN.format(weekly.count)} />
              <StatCard label="日次の観測" value={YEN.format(weekly.entries)} sub={weekly.latestDate ? `最新 ${weekly.latestDate}` : "記録なし"} />
            </Grid>
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
            <Grid min="sm">
              <StatCard
                label="実売額"
                value={productSales && productSales.observations.length > 0 ? `¥${YEN.format(productSales.netRevenueYen)}` : <Unmeasured />}
                sub={productSales?.latestPeriodEnd ? `最終期間 ${productSales.latestPeriodEnd}` : "証拠付き期間なし"}
              />
              <StatCard label="注文件数" value={productSales && productSales.observations.length > 0 ? YEN.format(productSales.orders) : <Unmeasured />} />
              <StatCard label="販売数" value={productSales && productSales.observations.length > 0 ? YEN.format(productSales.units) : <Unmeasured />} />
              <StatCard label="計測期間数" value={productSales ? YEN.format(productSales.observations.length) : <Unmeasured />} />
            </Grid>
            {productSales && productSales.observations.length > 0 ? (
              <DataTable columns={["チャネル", "商品", "期間", "注文", "販売数", "純売上", "証拠"]}>
                {productSales.observations.map((row) => (
                  <Row key={row.id}>
                    <Cell nowrap>{row.channel}</Cell>
                    <Cell nowrap>{row.productId}</Cell>
                    <Cell nowrap muted>
                      {row.periodStart}〜{row.periodEnd}
                    </Cell>
                    <Cell nowrap className="text-right tabular-nums">
                      {row.orders}
                    </Cell>
                    <Cell nowrap className="text-right tabular-nums">
                      {row.units}
                    </Cell>
                    <Cell nowrap className="text-right tabular-nums">
                      ¥{YEN.format(row.netRevenueYen)}
                    </Cell>
                    <Cell muted>{row.evidencePath}</Cell>
                  </Row>
                ))}
              </DataTable>
            ) : (
              <p className="text-sm text-muted-foreground">KDPまたはココナラの公式レポートを保存後、product-factoryの販売台帳CLIで記録します。</p>
            )}
          </>
        )}
      </Section>

      {adsense ? (
        <Section title="AdSense 週次の全列" count={weeks.length}>
          <DataGrid
            columns={adsense.columns.map((c) => ({ id: c, header: c, numeric: c !== "week", sortable: true, nowrap: true }))}
            rows={weeks.map((w) => ({
              id: String(w.week),
              cells: adsense.columns.map((c) => String(w[c] ?? "")),
              sort: adsense.columns.map((c) => (c === "week" ? String(w[c]) : num(w[c]))),
              search: String(w.week),
            }))}
            searchPlaceholder="週で絞り込み (例: 2026-W4)"
          />
        </Section>
      ) : null}

      <Section title="内訳 (最新週)">
        {hasError(d.breakdowns) ? (
          <ErrorNote error={d.breakdowns.error} />
        ) : d.breakdowns.length === 0 ? (
          <p className="text-sm text-muted-foreground">内訳 CSV がありません。</p>
        ) : (
          <Tabs defaultValue={d.breakdowns[0].file}>
            <TabsList className="flex-wrap">
              {d.breakdowns.map((b) => (
                <TabsTrigger key={b.file} value={b.file}>
                  {b.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {d.breakdowns.map((b) => (
              <TabsContent key={b.file} value={b.file} className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">{b.latestWeek} の上位 10 行</p>
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
              </TabsContent>
            ))}
          </Tabs>
        )}
      </Section>

      <Section title="改善候補">
        {hasError(d.candidates) ? (
          <ErrorNote error={d.candidates.error} />
        ) : d.candidates.candidates.length === 0 ? (
          <p className="text-sm text-muted-foreground">候補はありません ({d.candidates.week ?? "—"})。</p>
        ) : (
          <DataTable columns={["候補", "対象"]}>
            {d.candidates.candidates.map((c, i) => (
              <Row key={i}>
                <Cell nowrap className="font-medium">
                  {String(c.id ?? c.rule ?? i)}
                </Cell>
                <Cell muted>{String(c.key ?? "")}</Cell>
              </Row>
            ))}
          </DataTable>
        )}
      </Section>

      <Section title="週次レポート (LATEST.md)">
        {hasError(d.latestMd) ? (
          <ErrorNote error={d.latestMd.error} />
        ) : (
          <Collapsible className="flex flex-col gap-2">
            <CollapsibleTrigger render={<Button variant="outline" size="sm" className="self-start" />}>本文を開く・閉じる</CollapsibleTrigger>
            <CollapsibleContent>
              <pre className="max-h-96 overflow-auto rounded-lg border bg-muted p-3 font-mono text-xs leading-relaxed">{d.latestMd}</pre>
            </CollapsibleContent>
          </Collapsible>
        )}
      </Section>
    </>
  );
}
