"use client";

import { EmptyState, ErrorState, Loading } from "@/components/async-state";
import { Section } from "@/components/layout-primitives";

import { MetricsSection, type MetricsData } from "./metrics-section";
import { useDashboardSummary } from "./use-dashboard-summary";

/** /api/dashboard/summary のうち、現況レビューが使う週次メトリクスの部分 */
interface DashboardSummary extends MetricsData {
  generatedAt: string;
}

/** 現況レビューの週次メトリクス (GSC・GA4・AdSense・PSI・カバレッジ)。進捗キューはサイトの是正キュー (/site/queues) へ移した。 */
export function DashboardView() {
  const { data, error, loading, load } = useDashboardSummary<DashboardSummary>();

  return (
    <Section id="metrics" title="メトリクス (週次)" note={data ? `読み取り専用ミラー (60秒キャッシュ)。取得: ${data.generatedAt.replace("T", " ").slice(0, 19)}` : undefined}>
      {loading ? <Loading /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && !data ? <EmptyState message="現況データなし" /> : null}
      {data ? <MetricsSection metrics={data.metrics} psi={data.psi} coverage={data.coverage} /> : null}
    </Section>
  );
}
