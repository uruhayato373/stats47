"use client";

import { useEffect, useState } from "react";

import { apiGet, ApiError } from "@/lib/client/api-client";
import { CalendarClockIcon, FilePenLineIcon, FileTextIcon, MegaphoneIcon, NewspaperIcon, SendIcon, VideoIcon } from "lucide-react";

import { EmptyState, ErrorState, Loading } from "@/components/async-state";
import { StatCard } from "@/components/admin-ui";
import { Grid } from "@/components/layout-primitives";

type SummaryResponse = {
  sns: { total: number; posted: number; scheduled: number; draft: number };
  blogArticles: number;
  noteCovers: number;
  videoMasters: number;
};

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
    <Grid min="sm">
      <StatCard icon={<MegaphoneIcon />} value={data.sns.total} label="SNS 投稿 (台帳)" />
      <StatCard icon={<SendIcon />} value={data.sns.posted} label="├ 投稿済" />
      <StatCard icon={<CalendarClockIcon />} value={data.sns.scheduled} label="├ 予約" />
      <StatCard icon={<FilePenLineIcon />} value={data.sns.draft} label="└ draft" />
      <StatCard icon={<NewspaperIcon />} value={data.blogArticles} label="ブログ記事 (OGP/カード)" />
      <StatCard icon={<FileTextIcon />} value={data.noteCovers} label="note カバー" />
      <StatCard icon={<VideoIcon />} value={data.videoMasters} label="動画 master" />
    </Grid>
  );
}
