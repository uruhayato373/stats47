import { EyeIcon, FileClockIcon, PackageXIcon, StoreIcon } from "lucide-react";

import { DataGrid, StatCard, StatusBadge } from "@/components/admin-ui";
import { Grid, Section } from "@/components/layout-primitives";
import { ErrorNote, PageHeading } from "@/components/ops/primitives";
import { coconalaSummary, type CoconalaRow } from "@/lib/server/coconala";
import { hasError } from "@/lib/server/state-io";
import { COCONALA_LISTINGS } from "../../../../../config/paths.mjs";

export const dynamic = "force-dynamic";
export const metadata = { title: "ココナラ — stats47 admin" };

const YEN = new Intl.NumberFormat("ja-JP");
const STATE: Record<CoconalaRow["state"], { label: string; tone: "good" | "warn" | "neutral" }> = {
  listed: { label: "出品中", tone: "good" },
  draft: { label: "台帳のみ (未公開)", tone: "warn" },
  unlisted: { label: "未出品", tone: "neutral" },
};

const unmeasured = (key: string) => (
  <span key={key} className="text-muted-foreground">
    未計測
  </span>
);
const num = (key: string, v: string | number) => (
  <span key={key} className="font-mono">
    {v}
  </span>
);

/** ココナラの出品状況 (読み取り専用)。型 B (一覧): 件数の要約 → 商品の一覧。出品・修正は coconala-operator が行い、ここからは操作しない */
export default function CoconalaPage() {
  const data = coconalaSummary();
  if (hasError(data)) {
    return (
      <>
        <PageHeading title="ココナラ" source={COCONALA_LISTINGS} />
        <ErrorNote error={data.error} />
      </>
    );
  }

  return (
    <>
      <PageHeading title="ココナラ" source={data.source}>
        <p className="text-sm text-muted-foreground">
          出品・内容修正・価格反映は /coconala-publish (coconala-operator) で行います。売上の列は販売台帳 (公式レポートを証拠として保存し product-factory の販売台帳 CLI で記録したもの) の合計で、記録が無い商品は「未計測」と出します。閲覧・お気に入りはココナラの「サービス別分析」の過去30日です。CI (authenticated-measurement) が毎日取得して暗号化 private R2 に置き、`npm run measurement:restore -- coconala` (MEASUREMENT_VAULT_KEY が必要) でこの画面へ復元します。
        </p>
      </PageHeading>

      <Grid min="sm">
        <StatCard label="出品中" icon={<StoreIcon />} value={data.listed} tone="good" />
        <StatCard label="台帳のみ (未公開)" icon={<FileClockIcon />} value={data.draft} tone="warn" />
        <StatCard label="未出品 (カタログのみ)" icon={<PackageXIcon />} value={data.unlisted} />
        <StatCard
          label="閲覧 (過去30日・全商品)"
          icon={<EyeIcon />}
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
        {/* 台帳に記録が無い商品は「未計測」。0 件・0 円と書かない (売れていないのか、記録していないのか区別できなくなる) */}
        <DataGrid
          columns={[
            { id: "id", header: "ID", sortable: true, nowrap: true },
            { id: "title", header: "タイトル", sortable: true },
            { id: "price", header: "価格", numeric: true, sortable: true, nowrap: true },
            { id: "state", header: "状態", sortable: true, nowrap: true },
            { id: "views", header: "閲覧 (30日)", numeric: true, sortable: true, nowrap: true },
            { id: "favorites", header: "お気に入り", numeric: true, sortable: true, nowrap: true },
            { id: "orders", header: "受注", numeric: true, sortable: true, nowrap: true },
            { id: "units", header: "販売数", numeric: true, sortable: true, nowrap: true },
            { id: "revenue", header: "純売上", numeric: true, sortable: true, nowrap: true },
            { id: "period", header: "最終集計日", sortable: true, nowrap: true },
            { id: "url", header: "出品ページ", nowrap: true },
          ]}
          rows={data.rows.map((row) => ({
            id: row.id,
            cells: [
              <span key="id" className="font-mono text-xs">
                {row.id}
              </span>,
              <span key="t" className="block min-w-64">
                {row.title}
              </span>,
              row.priceYen === null ? "—" : `¥${YEN.format(row.priceYen)}`,
              <StatusBadge key="s" tone={STATE[row.state].tone}>
                {STATE[row.state].label}
              </StatusBadge>,
              row.views ? num("v", row.views.views) : unmeasured("v"),
              row.views ? num("f", row.views.favorites) : unmeasured("f"),
              row.sales ? num("o", row.sales.orders) : unmeasured("o"),
              row.sales ? num("u", row.sales.units) : unmeasured("u"),
              row.sales ? num("r", `¥${YEN.format(row.sales.netRevenueYen)}`) : unmeasured("r"),
              row.sales ? (
                <span key="p" className="text-muted-foreground">
                  {row.sales.latestPeriodEnd}
                </span>
              ) : (
                unmeasured("p")
              ),
              row.serviceUrl ? (
                <a key="a" href={row.serviceUrl} target="_blank" rel="noreferrer" className="font-medium underline-offset-4 hover:underline">
                  開く
                </a>
              ) : (
                "—"
              ),
            ],
            sort: [
              row.id,
              row.title,
              row.priceYen,
              row.state,
              row.views?.views ?? null,
              row.views?.favorites ?? null,
              row.sales?.orders ?? null,
              row.sales?.units ?? null,
              row.sales?.netRevenueYen ?? null,
              row.sales?.latestPeriodEnd ?? null,
              null,
            ],
            search: `${row.id} ${row.title}`,
            facet: row.state,
          }))}
          facets={(Object.keys(STATE) as CoconalaRow["state"][]).map((s) => ({ value: s, label: STATE[s].label }))}
          searchPlaceholder="ID・タイトルで絞り込み"
        />
      </Section>
    </>
  );
}
