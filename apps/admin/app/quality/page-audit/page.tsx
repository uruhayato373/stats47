import Link from "next/link";

import { Sparkline } from "@/components/dashboard/sparkline";
import {
  Badge,
  ErrorNote,
  Freshness,
  PageHeading,
  Section,
  Stat,
  Table,
  Td,
  Tr,
} from "@/components/ops/primitives";
import { pageQualitySummary, type MetricValue } from "@/lib/server/page-quality";

export const dynamic = "force-dynamic";
export const metadata = { title: "ページ品質監査 — stats47 admin" };

function isUnmeasured(v: MetricValue): v is { value: null; reason: string } {
  return typeof v === "object" && v !== null && "value" in v && v.value === null;
}

function MetricCell({ value, unit = "" }: { value: MetricValue; unit?: string }) {
  if (value === undefined) return <span className="text-console-muted">対象外</span>;
  if (isUnmeasured(value)) {
    return (
      <span className="text-console-warn" title={value.reason}>
        計測不能
      </span>
    );
  }
  if (typeof value === "boolean") return <Badge tone={value ? "bad" : "good"}>{value ? "あり" : "なし"}</Badge>;
  return (
    <span>
      {typeof value === "number" ? value.toLocaleString("ja-JP") : String(value)}
      {unit}
    </span>
  );
}

export default async function PageQualityAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const summary = pageQualitySummary();

  if (!summary.ok) {
    return (
      <div className="space-y-4">
        <PageHeading
          title="ページ品質監査"
          source=".claude/state/metrics/page-quality/latest.json"
        />
        <ErrorNote error={summary.error ?? "unknown error"} />
        <p className="text-sm text-console-muted">
          ローカルで <code className="rounded bg-console-card px-1">npm run page-quality:check --all</code> を実行すると生成されます。
        </p>
      </div>
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
    <div className="space-y-8">
      <PageHeading
        title="ページ品質監査"
        source=".claude/state/metrics/page-quality/latest.json"
      >
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge tone="info">{summary.mode}</Badge>
          {summary.commitSha ? <Badge>{summary.commitSha.slice(0, 8)}</Badge> : null}
          {summary.generatedAt ? <Freshness iso={summary.generatedAt} /> : null}
        </div>
        <p className="mt-2 max-w-3xl text-sm text-console-muted">
          HTML/RSC肥大化・DOM過剰・リンク重複・広告重複・構造化データ異常・表示速度を継続監視する。
          変更時は影響テンプレートの代表URLだけ、週次は公開対象の全URLを検査する。
          既存のPSI/Cloudflare日次監視とは別系統 (それらは
          <Link className="text-console-info underline underline-offset-2" href="/ops">
            /ops
          </Link>
          参照)。
        </p>
      </PageHeading>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="対象URL" value={summary.totalUrls} />
        <Stat label="正常" value={summary.successCount} tone="good" />
        <Stat label="warningのみ" value={summary.warningOnlyCount} tone={summary.warningOnlyCount ? "warn" : "good"} />
        <Stat label="error" value={summary.errorCount} tone={summary.errorCount ? "bad" : "good"} />
      </div>

      {summary.trend.length > 1 ? (
        <Section title="推移 (直近runのerror/warning件数)">
          <div className="flex items-center gap-6 rounded-md border border-console-border bg-console-card p-3">
            <div>
              <p className="text-[11px] text-console-muted">error</p>
              <Sparkline values={summary.trend.map((t) => t.errorCount)} color="rgb(var(--console-bad))" />
            </div>
            <div>
              <p className="text-[11px] text-console-muted">warning</p>
              <Sparkline values={summary.trend.map((t) => t.warningCount)} color="rgb(var(--console-warn))" />
            </div>
            <p className="text-[11px] text-console-muted">
              {summary.trend[0]?.date} 〜 {summary.trend[summary.trend.length - 1]?.date} ({summary.trend.length}run)
            </p>
          </div>
        </Section>
      ) : null}

      <Section title="テンプレート別集計" count={summary.templateRollups.length}>
        <Table columns={["テンプレート", "URL数", "error", "warning"]}>
          {summary.templateRollups.map((t) => (
            <Tr key={t.template}>
              <Td>
                <Link
                  className="text-console-info underline underline-offset-2"
                  href={`/quality/page-audit?template=${t.template}`}
                >
                  {t.template}
                </Link>
              </Td>
              <Td nowrap>{t.urlCount}</Td>
              <Td nowrap>
                <Badge tone={t.errorCount ? "bad" : "good"}>{t.errorCount}</Badge>
              </Td>
              <Td nowrap>
                <Badge tone={t.warningCount ? "warn" : "good"}>{t.warningCount}</Badge>
              </Td>
            </Tr>
          ))}
        </Table>
      </Section>

      <Section title="問題が大きいページ (悪化ランキング)" count={filteredOffenders.length}>
        <div className="mb-2 flex flex-wrap gap-2 text-[11px]">
          <Link className="text-console-info underline underline-offset-2" href="/quality/page-audit">
            絞り込み解除
          </Link>
          {templates.map((t) => (
            <Link
              key={t}
              className={templateFilter === t ? "font-bold text-console-fg" : "text-console-info underline underline-offset-2"}
              href={`/quality/page-audit?template=${t}${severityFilter ? `&severity=${severityFilter}` : ""}`}
            >
              {t}
            </Link>
          ))}
        </div>
        {filteredOffenders.length === 0 ? (
          <p className="text-sm text-console-good">対象範囲に違反ページはありません。</p>
        ) : (
          <Table columns={["URL", "テンプレート", "error", "warning", "理由"]}>
            {filteredOffenders.map((o) => (
              <Tr key={o.url}>
                <Td>
                  <code className="text-[11px]">{o.path}</code>
                </Td>
                <Td nowrap>{o.template}</Td>
                <Td nowrap>
                  <Badge tone={o.errorCount ? "bad" : "good"}>{o.errorCount}</Badge>
                </Td>
                <Td nowrap>
                  <Badge tone={o.warningCount ? "warn" : "good"}>{o.warningCount}</Badge>
                </Td>
                <Td>
                  <div className="space-y-1 text-[10px] text-console-muted">
                    {o.violations.slice(0, 4).map((v, i) => (
                      <div key={i}>
                        {v.metric_key} ({v.comparison}): {v.actual} {v.operator} {v.threshold}
                        {v.previous != null ? ` (前回 ${v.previous})` : ""}
                      </div>
                    ))}
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </Section>

      <Section title="全URLの現在値" count={filteredResults.length}>
        {shouldTrim ? (
          <p className="mb-2 text-[11px] text-console-muted">
            対象 {templateScoped.length} URL中、違反ページ {filteredResults.length} 件だけ表示 (
            <Link className="text-console-info underline underline-offset-2" href="/quality/page-audit?showAll=1">
              全件表示
            </Link>
            )。テンプレートで絞り込むと全件表示される。
          </p>
        ) : null}
        <div className="max-h-[32rem] overflow-auto">
          <Table columns={["URL", "テンプレート", "HTML", "RSC", "DOM", "重複リンク率", "広告重複", "LCP"]}>
            {filteredResults.map((r) => (
              <Tr key={r.url}>
                <Td>
                  <code className="text-[10px]">{r.path}</code>
                  {r.error ? <div className="text-[10px] text-console-bad">{r.error}</div> : null}
                </Td>
                <Td nowrap>{r.template}</Td>
                <Td nowrap>
                  <MetricCell value={r.metrics.html_bytes} unit=" B" />
                </Td>
                <Td nowrap>
                  <MetricCell value={r.metrics.rsc_bytes} unit=" B" />
                </Td>
                <Td nowrap>
                  <MetricCell value={r.metrics.dom_nodes} />
                </Td>
                <Td nowrap>
                  <MetricCell value={r.metrics.duplicate_link_ratio} />
                </Td>
                <Td nowrap>
                  <MetricCell value={r.metrics.ad_duplicate_count} />
                </Td>
                <Td nowrap>
                  <MetricCell value={r.metrics.lcp_ms} unit=" ms" />
                </Td>
              </Tr>
            ))}
          </Table>
        </div>
      </Section>
    </div>
  );
}
