"use client";

import { EmptyState, ErrorState, Loading } from "@/components/async-state";
import { QueuesSection, type QueuesData } from "@/components/dashboard/queues-section";
import { useDashboardSummary } from "@/components/dashboard/use-dashboard-summary";

/** サイトの是正キュー (ブログ品質・AI 解説・記事の企画キュー・SNS・実験)。旧 /dashboard の「進捗キュー」。 */
export function QueuesView() {
  const { data, error, loading, load } = useDashboardSummary<QueuesData>();
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <EmptyState message="キューのデータなし" />;
  return (
    <QueuesSection
      blogQueue={data.blogQueue}
      aiContent={data.aiContent}
      topicQueue={data.topicQueue}
      sns={data.sns}
      winningPatterns={data.winningPatterns}
      experiments={data.experiments}
    />
  );
}
