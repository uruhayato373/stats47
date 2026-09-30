import { Cell, DataTable, Row, StatCard, StatusBadge } from "@/components/admin-ui";
import { Grid, Section } from "@/components/layout-primitives";
import { ErrorNote, PageHeading } from "@/components/ops/primitives";
import { coconalaSummary, type CoconalaRow } from "@/lib/server/coconala";
import { hasError } from "@/lib/server/state-io";

export const dynamic = "force-dynamic";
export const metadata = { title: "ココナラ — stats47 admin" };

const YEN = new Intl.NumberFormat("ja-JP");
const STATE: Record<CoconalaRow["state"], { label: string; tone: "good" | "warn" | "neutral" }> = {
  listed: { label: "出品中", tone: "good" },
  draft: { label: "台帳のみ (未公開)", tone: "warn" },
  unlisted: { label: "未出品", tone: "neutral" },
};

/** ココナラの出品状況 (読み取り専用)。出品・修正は coconala-operator が行い、ここからは操作しない */
export default function CoconalaPage() {
  const data = coconalaSummary();
  if (hasError(data)) {
    return (
      <div className="space-y-4">
        <PageHeading title="ココナラ" source=".claude/config/coconala-listings.json" />
        <ErrorNote error={data.error} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeading title="ココナラ" source={data.source}>
        <p className="text-xs text-console-muted">
          出品・内容修正・価格反映は /coconala-publish (coconala-operator) で行います。売上の列は販売台帳 (公式レポートを証拠として保存し product-factory の販売台帳 CLI で記録したもの) の合計で、記録が無い商品は「未計測」と出します。
        </p>
      </PageHeading>

      <Grid min="sm">
        <StatCard label="出品中" value={data.listed} tone="good" />
        <StatCard label="台帳のみ (未公開)" value={data.draft} tone="warn" />
        <StatCard label="未出品 (カタログのみ)" value={data.unlisted} />
      </Grid>

      {data.salesError ? <ErrorNote error={`販売台帳を読めません: ${data.salesError}`} /> : null}

      <Section title="商品" count={data.rows.length}>
        <DataTable columns={["ID", "タイトル", "価格", "状態", "受注", "販売数", "純売上", "最終集計日", "出品ページ"]}>
          {data.rows.map((row) => (
            <Row key={row.id}>
              <Cell nowrap className="font-mono text-xs">{row.id}</Cell>
              <Cell>{row.title}</Cell>
              <Cell nowrap>{row.priceYen === null ? "—" : `¥${YEN.format(row.priceYen)}`}</Cell>
              <Cell nowrap>
                <StatusBadge tone={STATE[row.state].tone}>{STATE[row.state].label}</StatusBadge>
              </Cell>
              {row.sales ? (
                <>
                  <Cell nowrap className="text-right font-mono">{row.sales.orders}</Cell>
                  <Cell nowrap className="text-right font-mono">{row.sales.units}</Cell>
                  <Cell nowrap className="text-right font-mono">¥{YEN.format(row.sales.netRevenueYen)}</Cell>
                  <Cell nowrap muted>{row.sales.latestPeriodEnd}</Cell>
                </>
              ) : (
                // 台帳に記録が無い商品は「未計測」。0 件・0 円と書かない (売れていないのか、記録していないのか区別できなくなる)
                <Cell nowrap muted colSpan={4}>
                  未計測
                </Cell>
              )}
              <Cell nowrap>
                {row.serviceUrl ? (
                  <a href={row.serviceUrl} target="_blank" rel="noreferrer" className="text-console-accent hover:underline">
                    開く
                  </a>
                ) : (
                  "—"
                )}
              </Cell>
            </Row>
          ))}
        </DataTable>
      </Section>
    </div>
  );
}
