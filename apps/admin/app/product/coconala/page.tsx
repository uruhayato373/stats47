import { Cell, DataTable, Row, StatCard, StatusBadge } from "@/components/admin-ui";
import { Grid, Section } from "@/components/layout-primitives";
import { ErrorNote, PageHeading } from "@/components/ops/primitives";
import { coconalaSummary, type CoconalaRow } from "@/lib/server/coconala";
import { hasError } from "@/lib/server/state-io";
import { COCONALA_LISTINGS } from "../../../../../packages/product-factory/src/ledger-paths.mjs";

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
        <PageHeading title="ココナラ" source={COCONALA_LISTINGS} />
        <ErrorNote error={data.error} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeading title="ココナラ" source={data.source}>
        <p className="text-xs text-console-muted">
          出品・内容修正・価格反映は /coconala-publish (coconala-operator) で行います。売上の列は販売台帳 (公式レポートを証拠として保存し product-factory の販売台帳 CLI で記録したもの) の合計で、記録が無い商品は「未計測」と出します。閲覧・お気に入りはココナラの「サービス別分析」の過去30日です。CI (authenticated-measurement) が毎日取得して暗号化 private R2 に置き、`npm run measurement:restore -- coconala` (MEASUREMENT_VAULT_KEY が必要) でこの画面へ復元します。
        </p>
      </PageHeading>

      <Grid min="sm">
        <StatCard label="出品中" value={data.listed} tone="good" />
        <StatCard label="台帳のみ (未公開)" value={data.draft} tone="warn" />
        <StatCard label="未出品 (カタログのみ)" value={data.unlisted} />
        <StatCard
          label="閲覧 (過去30日・全商品)"
          value={data.viewsTotal ? data.viewsTotal.views : "未計測"}
          sub={
            data.viewsTotal
              ? `${data.viewsTotal.start}〜${data.viewsTotal.end} (取得 ${data.viewsTotal.observedAt.slice(0, 10)})`
              : "npm run measurement:restore -- coconala で復元"
          }
        />
      </Grid>

      {data.salesError ? <ErrorNote error={`販売台帳を読めません: ${data.salesError}`} /> : null}

      <Section title="商品" count={data.rows.length}>
        <DataTable columns={["ID", "タイトル", "価格", "状態", "閲覧 (30日)", "お気に入り", "受注", "販売数", "純売上", "最終集計日", "出品ページ"]}>
          {data.rows.map((row) => (
            <Row key={row.id}>
              <Cell nowrap className="font-mono text-xs">{row.id}</Cell>
              <Cell className="min-w-64">{row.title}</Cell>
              <Cell nowrap>{row.priceYen === null ? "—" : `¥${YEN.format(row.priceYen)}`}</Cell>
              <Cell nowrap>
                <StatusBadge tone={STATE[row.state].tone}>{STATE[row.state].label}</StatusBadge>
              </Cell>
              {row.views ? (
                <>
                  <Cell nowrap className="text-right font-mono">{row.views.views}</Cell>
                  <Cell nowrap className="text-right font-mono">{row.views.favorites}</Cell>
                </>
              ) : (
                <Cell nowrap muted colSpan={2}>
                  未計測
                </Cell>
              )}
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
