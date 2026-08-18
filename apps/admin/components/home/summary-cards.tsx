"use client";

import { useEffect, useState } from "react";

import { apiGet, ApiError } from "@/lib/client/api-client";
import { EmptyState, ErrorState, Loading } from "@/components/async-state";

type SummaryResponse = {
  sns: { total: number; posted: number; scheduled: number; draft: number };
  blogArticles: number;
  noteCovers: number;
  videoMasters: number;
  assetTabs: number;
};

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-lg border border-console-border bg-console-card p-3.5">
      <div className="text-xl font-bold text-console-fg">{value}</div>
      <div className="mt-1 text-[11px] text-console-muted">{label}</div>
    </div>
  );
}

export function SummaryCards() {
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    setError(null);
    apiGet<SummaryResponse>("/api/assets/summary")
      .then((res) => setData(res))
      .catch((e: unknown) => {
        const message =
          e instanceof ApiError
            ? `サマリ取得失敗: ${e.message}。npm run dev --workspace=apps/admin を起動してください`
            : e instanceof Error
              ? e.message
              : String(e);
        setError(message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <EmptyState message="サマリなし" />;

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8">
      <StatCard value={data.sns.total} label="SNS 投稿 (台帳)" />
      <StatCard value={data.sns.posted} label="├ 投稿済" />
      <StatCard value={data.sns.scheduled} label="├ 予約" />
      <StatCard value={data.sns.draft} label="└ draft" />
      <StatCard value={data.blogArticles} label="ブログ記事 (OGP/カード)" />
      <StatCard value={data.noteCovers} label="note カバー" />
      <StatCard value={data.videoMasters} label="動画 master" />
      <StatCard value={data.assetTabs} label="画像資産タブ" />
    </div>
  );
}
