import Link from "next/link";
import { CircleAlertIcon, CircleCheckIcon, GlobeIcon, TrendingDownIcon, TriangleAlertIcon } from "lucide-react";

import { Cell, DataGrid, DataTable, Row, StatCard, StatusBadge, TrendChart } from "@/components/admin-ui";
import { Grid, Section } from "@/components/layout-primitives";
import { ErrorNote, Freshness, PageHeading } from "@/components/ops/primitives";
import { buttonVariants } from "@/components/ui/button";
import { pageQualitySummary, type MetricValue } from "@/lib/server/page-quality";

import { datasetDir } from "../../../../../config/datasets.mjs";

export const dynamic = "force-dynamic";
export const metadata = { title: "ページ品質監査 — stats47 admin" };

const LINK = "font-medium underline-offset-4 hover:underline";

function isUnmeasured(v: MetricValue): v is { value: null; reason: string } {
  return typeof v === "object" && v !== null && "value" in v && v.value === null;
}

function MetricCell({ value, unit = "" }: { value: MetricValue; unit?: string }) {
  if (value === undefined) return <span className="text-muted-foreground">対象外</span>;
  if (isUnmeasured(value)) {
    return (
      <span className="text-console-warn" title={value.reason}>
        計測不能
      </span>
    );
  }
  if (typeof value === "boolean") return <StatusBadge tone={value ? "bad" : "good"}>{value ? "あり" : "なし"}</StatusBadge>;
  return (
    <span>
      {typeof value === "number" ? value.toLocaleString("ja-JP") : String(value)}
      {unit}
    </span>
  );
}

/** 並べ替えの値。対象外・計測不能は null (末尾) にし、0 と混ぜない */
function metricSort(value: MetricValue): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  return null;
}

const METRIC_COLUMNS = [
  { key: "html_bytes", header: "HTML", unit: " B" },
  { key: "rsc_bytes", header: "RSC", unit: " B" },
  { key: "dom_nodes", header: "DOM", unit: "" },
  { key: "duplicate_link_ratio", header: "重複リンク率", unit: "" },
  { key: "ad_duplicate_count", header: "広告重複", unit: "" },
  { key: "lcp_ms", header: "LCP", unit: " ms" },
];

/** ページ品質監査 (型 B: 一覧・キュー)。件数 → 推移 → 一覧 (DataGrid) */
export default async function PageQualityAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const summary = pageQualitySummary();

  if (!summary.ok) {
    return (
      <>
        <PageHeading title="ページ品質監査" source={`${datasetDir("page-quality.metrics")}/latest.json`} />
        <ErrorNote error={summary.error ?? "unknown error"} />
        <p className="text-sm text-muted-foreground">
          ローカルで <code className="rounded bg-muted px-1 font-mono text-xs">npm run page-quality:check --all</code> を実行すると生成されます。
        </p>
      </>
    );
  }

  const templateFilter = params.template;
  const severityFilter = params.severity;
  const showAll = params.showAll === "1";

  const FULL_TABLE_SOFT_LIMIT = 300;
  const templateScoped = summary.results.filter((r) => !templateFilter || r.template === templateFilter);
  const violatedUrls = new Set(summary.violations.map((v) => v.url));
  // 週次の全URL監査は数千件になりうる。絞り込み無し・showAll指定無しでは
  // 違反ページだけに絞ってブラウザとDOMを守る (このツール自体がページ肥大化を検出する仕組みなので
  // 自分のUIを肥大化させない)。
  const shouldTrim = !templateFilter && !showAll && templateScoped.length > FULL_TABLE_SOFT_LIMIT;
  const filteredResults = shouldTrim ? templateScoped.filter((r) => violatedUrls.has(r.url)) : templateScoped;

  const filteredOffenders = summary.worstOffenders.filter((o) => {
    if (templateFilter && o.template !== templateFilter) return false;
    if (severityFilter === "error" && o.errorCount === 0) return false;
    if (severityFilter === "warning" && o.warningCount === 0 && o.errorCount === 0) return false;
    return true;
  });

  const templates = [...new Set(summary.results.map((r) => r.template))].sort();

  return (
    <>
      <PageHeading title="ページ品質監査" source={`${datasetDir("page-quality.metrics")}/latest.json`}>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <StatusBadge tone="info">{summary.mode}</StatusBadge>
          {summary.commitSha ? <StatusBadge>{summary.commitSha.slice(0, 8)}</StatusBadge> : null}
          {summary.generatedAt ? <Freshness iso={summary.generatedAt} /> : null}
        </div>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          HTML/RSC肥大化・DOM過剰・リンク重複・広告重複・構造化データ異常・表示速度を継続監視する。
          変更時は影響テンプレートの代表URLだけ、週次は公開対象の全URLを検査する。
          既存のPSI/Cloudflare日次監視とは別系統 (それらは
          <Link className={LINK} href="/ops">
            /ops
          </Link>
          参照)。
        </p>
      </PageHeading>

      <Grid min="sm">
        <StatCard label="対象URL" icon={<GlobeIcon />} value={summary.totalUrls} />
        <StatCard label="正常" icon={<CircleCheckIcon />} value={summary.successCount} tone="good" />
        <StatCard
          label="warningのみ"
          icon={<TriangleAlertIcon />}
          value={summary.warningOnlyCount}
          tone={summary.warningOnlyCount ? "warn" : "good"}
        />
        <StatCard label="error" icon={<CircleAlertIcon />} value={summary.errorCount} tone={summary.errorCount ? "bad" : "good"} />
      </Grid>

      {summary.trend.length > 1 ? (
        <TrendChart
          title="推移 (直近runのerror/warning件数)"
          icon={<TrendingDownIcon />}
          description={`${summary.trend[0]?.date} 〜 ${summary.trend[summary.trend.length - 1]?.date} (${summary.trend.length}run)`}
          data={summary.trend.map((t) => ({ date: t.date, errorCount: t.errorCount, warningCount: t.warningCount }))}
          xKey="date"
          series={[
            { key: "errorCount", label: "error" },
            { key: "warningCount", label: "warning" },
          ]}
          kind="line"
        />
      ) : null}

      <Section title="テンプレート別集計" count={summary.templateRollups.length}>
        <DataTable columns={["テンプレート", "URL数", "error", "warning"]}>
          {summary.templateRollups.map((t) => (
            <Row key={t.template}>
              <Cell>
                <Link className={LINK} href={`/quality/page-audit?template=${t.template}`}>
                  {t.template}
                </Link>
              </Cell>
              <Cell nowrap>{t.urlCount}</Cell>
              <Cell nowrap>
                <StatusBadge tone={t.errorCount ? "bad" : "good"}>{t.errorCount}</StatusBadge>
              </Cell>
              <Cell nowrap>
                <StatusBadge tone={t.warningCount ? "warn" : "good"}>{t.warningCount}</StatusBadge>
              </Cell>
            </Row>
          ))}
        </DataTable>
      </Section>

      <Section title="問題が大きいページ (悪化ランキング)" count={filteredOffenders.length}>
        <div className="flex flex-wrap gap-2">
          <Link href="/quality/page-audit" className={buttonVariants({ variant: templateFilter ? "outline" : "default", size: "sm" })}>
            絞り込み解除
          </Link>
          {templates.map((t) => (
            <Link key={t} href={`/quality/page-audit?template=${t}${severityFilter ? `&severity=${severityFilter}` : ""}`} className={buttonVariants({ variant: templateFilter === t ? "default" : "outline", size: "sm" })}>
              {t}
            </Link>
          ))}
        </div>
        {filteredOffenders.length === 0 ? (
          <p className="text-sm text-console-good">対象範囲に違反ページはありません。</p>
        ) : (
          <DataGrid
            columns={[
              { id: "url", header: "URL", sortable: true },
              { id: "template", header: "テンプレート", sortable: true, nowrap: true },
              { id: "error", header: "error", numeric: true, sortable: true },
              { id: "warning", header: "warning", numeric: true, sortable: true },
              { id: "reason", header: "理由" },
            ]}
            rows={filteredOffenders.map((o) => ({
              id: o.url,
              cells: [
                <code key="p" className="font-mono text-xs">
                  {o.path}
                </code>,
                o.template,
                <StatusBadge key="e" tone={o.errorCount ? "bad" : "good"}>
                  {o.errorCount}
                </StatusBadge>,
                <StatusBadge key="w" tone={o.warningCount ? "warn" : "good"}>
                  {o.warningCount}
                </StatusBadge>,
                <div key="r" className="flex flex-col gap-1 text-xs text-muted-foreground">
                  {o.violations.slice(0, 4).map((v, i) => (
                    <div key={i}>
                      {v.metric_key} ({v.comparison}): {v.actual} {v.operator} {v.threshold}
                      {v.previous != null ? ` (前回 ${v.previous})` : ""}
                    </div>
                  ))}
                </div>,
              ],
              sort: [o.path, o.template, o.errorCount, o.warningCount, null],
              search: `${o.path} ${o.template}`,
              tone: o.errorCount ? "bad" : o.warningCount ? "warn" : undefined,
            }))}
            searchPlaceholder="URL・テンプレートで絞り込み"
          />
        )}
      </Section>

      <Section title="全URLの現在値" count={filteredResults.length}>
        {shouldTrim ? (
          <p className="text-xs text-muted-foreground">
            対象 {templateScoped.length} URL中、違反ページ {filteredResults.length} 件だけ表示 (
            <Link className={LINK} href="/quality/page-audit?showAll=1">
              全件表示
            </Link>
            )。テンプレートで絞り込むと全件表示される。
          </p>
        ) : null}
        <DataGrid
          columns={[
            { id: "url", header: "URL", sortable: true },
            { id: "template", header: "テンプレート", sortable: true, nowrap: true },
            ...METRIC_COLUMNS.map((m) => ({ id: m.key, header: m.header, numeric: true, sortable: true, nowrap: true })),
          ]}
          rows={filteredResults.map((r) => ({
            id: r.url,
            cells: [
              <div key="u">
                <code className="font-mono text-xs">{r.path}</code>
                {r.error ? <div className="text-xs text-console-bad">{r.error}</div> : null}
              </div>,
              r.template,
              ...METRIC_COLUMNS.map((m) => <MetricCell key={m.key} value={r.metrics[m.key]} unit={m.unit} />),
            ],
            sort: [r.path, r.template, ...METRIC_COLUMNS.map((m) => metricSort(r.metrics[m.key]))],
            search: `${r.path} ${r.template}`,
            tone: r.error ? ("bad" as const) : undefined,
          }))}
          searchPlaceholder="URL・テンプレートで絞り込み"
        />
      </Section>
    </>
  );
}
