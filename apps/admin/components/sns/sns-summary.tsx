import { CalendarClockIcon, ChartColumnIcon, EyeIcon, FilePenLineIcon, SendIcon, TrendingUpIcon } from "lucide-react";

import { StatCard, TrendChart } from "@/components/admin-ui";
import { Grid } from "@/components/layout-primitives";
import { ErrorNote, Unmeasured } from "@/components/ops/primitives";
import { loadAll, type Post } from "@/lib/server/posts-store";
import { hasError, wrap } from "@/lib/server/state-io";
import { isoWeekOf, jstDateOf } from "../../../../.claude/scripts/metrics/lib/periods.mjs";

const NUM = new Intl.NumberFormat("ja-JP");

/** 投稿日時 (UTC ISO) を日本時間の ISO 週 (YYYY-Www) にする。週の数え方は共通の periods.mjs に合わせる */
function jstIsoWeek(iso: string): string | null {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return isoWeekOf(jstDateOf(t));
}

/**
 * SNS 投稿台帳の件数の要約と週次の推移 (型 B の先頭)。台帳 (data/sns/posts.json) をサーバーで読む。
 * 表示の合計は投稿行に記録された最新値の合計で、記録の無い行は 0 に数えず「記録あり N 件」として別に出す。
 */
export function SnsSummary({ platform }: { platform?: string }) {
  const all = wrap(() => loadAll());
  if (hasError(all)) return <ErrorNote error={all.error} />;
  const posts = all.filter((p: Post) => !p.deleted_at && (!platform || p.platform === platform));
  const count = (s: string) => posts.filter((p) => p.status === s).length;
  const posted = posts.filter((p) => p.status === "posted" && p.posted_at);
  const measured = posted.filter((p) => typeof p.impressions === "number");

  const byWeek = new Map<string, { posts: number; impressions: number | null }>();
  for (const p of posted) {
    const week = jstIsoWeek(p.posted_at as string);
    if (!week) continue;
    const cur = byWeek.get(week) ?? { posts: 0, impressions: null };
    cur.posts += 1;
    if (typeof p.impressions === "number") cur.impressions = (cur.impressions ?? 0) + p.impressions;
    byWeek.set(week, cur);
  }
  const trend = [...byWeek.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([week, v]) => ({ week, ...v }));
  const ranges = [
    { label: "全期間", last: trend.length },
    { label: "直近 12 週", last: 12 },
  ];

  return (
    <>
      <Grid min="sm">
        <StatCard label="ID 台帳" icon={<ChartColumnIcon />} value={NUM.format(posts.length)} sub={platform ? `媒体 ${platform}` : "全媒体 (削除済みを除く)"} />
        <StatCard label="下書き" icon={<FilePenLineIcon />} value={NUM.format(count("draft"))} />
        <StatCard label="予約" icon={<CalendarClockIcon />} value={NUM.format(count("scheduled"))} />
        <StatCard
          label="投稿済み"
          icon={<SendIcon />}
          value={NUM.format(count("posted"))}
          sub={`表示の記録あり ${NUM.format(measured.length)} 件`}
        />
      </Grid>
      {trend.length >= 3 ? (
        <Grid min="lg">
          <TrendChart
            title="投稿数の推移"
            icon={<TrendingUpIcon />}
            description="週次 (日本時間の月曜始まり)・投稿済みの行を投稿日で数えた件数"
            data={trend}
            xKey="week"
            series={[{ key: "posts", label: "投稿数" }]}
            kind="bar"
            ranges={ranges}
          />
          <TrendChart
            title="表示の推移"
            icon={<EyeIcon />}
            description="投稿週ごとの表示の合計 (各投稿の最新の記録値)。記録の無い週は空ける"
            data={trend}
            xKey="week"
            series={[{ key: "impressions", label: "表示" }]}
            ranges={ranges}
          />
        </Grid>
      ) : measured.length === 0 && posted.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          表示の記録はまだありません (<Unmeasured /> = 未計測)。
        </p>
      ) : null}
    </>
  );
}
