import { num, wow } from "./format";
import { Sparkline, WowBadge } from "./sparkline";

type Row = Record<string, string | number>;
type Wrapped<T> = T | { error: string };

function hasError(v: unknown): v is { error: string } {
  return !!v && typeof v === "object" && "error" in (v as Record<string, unknown>);
}

function StatCard({
  value,
  label,
  sub,
  sparkValues,
  sparkColor,
}: {
  value: string;
  label: string;
  sub?: React.ReactNode;
  sparkValues?: Array<number | null | undefined>;
  sparkColor?: string;
}) {
  return (
    <div className="rounded-lg border border-console-border bg-console-card p-3">
      <div className="text-xl font-bold text-console-fg">{value}</div>
      <div className="mt-0.5 text-[11px] text-console-muted">{label}</div>
      {sub ? <div className="mt-1 text-[11px] text-console-muted">{sub}</div> : null}
      {sparkValues ? <Sparkline values={sparkValues} color={sparkColor} /> : null}
    </div>
  );
}

export interface MetricsData {
  metrics: Wrapped<{
    gsc: Row[] | null;
    ga4: Row[] | null;
    adsense: Row[] | null;
  }>;
  psi: Wrapped<{ date: string | null; errors: number | null; warnings: number | null }>;
  coverage: Wrapped<{ week?: string; tracked?: number; pendingActionable?: number }>;
}

/** 旧 dashboard.html renderMetrics() の移植。GSC/GA4/AdSense/PSI/coverage を横並びカード表示。 */
export function MetricsSection({ metrics, psi, coverage }: MetricsData) {
  const cards: React.ReactNode[] = [];

  if (!hasError(metrics)) {
    const g = metrics.gsc;
    const a = metrics.ga4;
    const ad = metrics.adsense;

    if (Array.isArray(g) && g.length > 0) {
      const last = g[g.length - 1];
      cards.push(
        <StatCard
          key="gsc-clicks"
          value={num(Number(last.clicks))}
          label={`GSC clicks/確定7日 (${last.week})`}
          sub={<WowBadge result={wow(g, "clicks")} />}
          sparkValues={g.map((r) => Number(r.clicks))}
        />,
      );
      cards.push(
        <StatCard
          key="gsc-impressions"
          value={num(Number(last.impressions))}
          label="GSC impressions/確定7日"
          sub={<WowBadge result={wow(g, "impressions")} />}
          sparkValues={g.map((r) => Number(r.impressions))}
        />,
      );
      cards.push(
        <StatCard
          key="gsc-ctr"
          value={`${(Number(last.ctr) * 100).toFixed(2)}%`}
          label="GSC CTR"
          sparkValues={g.map((r) => Number(r.ctr))}
          sparkColor="rgb(var(--console-good))"
        />,
      );
      cards.push(
        <StatCard
          key="gsc-position"
          value={String(last.position)}
          label="GSC 平均掲載順位"
          sparkValues={g.map((r) => Number(r.position))}
          sparkColor="rgb(var(--console-warn))"
        />,
      );
    } else {
      cards.push(<StatCard key="gsc-err" value="—" label="GSC (取得失敗)" />);
    }

    if (Array.isArray(a) && a.length > 0) {
      const last = a[a.length - 1];
      cards.push(
        <StatCard
          key="ga4-users"
          value={num(Number(last.active_users))}
          label={`GA4 users/週 JP (${last.week})`}
          sub={<WowBadge result={wow(a, "active_users")} />}
          sparkValues={a.map((r) => Number(r.active_users))}
        />,
      );
      cards.push(
        <StatCard
          key="ga4-pv"
          value={num(Number(last.pageviews))}
          label="GA4 PV/週"
          sub={<WowBadge result={wow(a, "pageviews")} />}
          sparkValues={a.map((r) => Number(r.pageviews))}
        />,
      );
    }

    if (Array.isArray(ad) && ad.length > 0) {
      const last = ad[ad.length - 1];
      cards.push(
        <StatCard
          key="adsense-earnings"
          value={`¥${num(Number(last.earnings))}`}
          label={`AdSense/週 (${last.week})`}
          sub={`RPM ¥${last.rpm}`}
          sparkValues={ad.map((r) => Number(r.earnings))}
          sparkColor="rgb(var(--console-good))"
        />,
      );
    }
  } else {
    cards.push(<StatCard key="metrics-err" value="—" label="メトリクス (取得失敗)" />);
  }

  if (!hasError(psi) && psi.date) {
    cards.push(
      <StatCard
        key="psi"
        value={`${psi.errors ?? 0} / ${psi.warnings ?? 0}`}
        label={`PSI 違反 error/warning (${psi.date})`}
      />,
    );
  }

  if (!hasError(coverage) && coverage.week) {
    cards.push(
      <StatCard
        key="coverage"
        value={num(coverage.pendingActionable)}
        label={`GSC カバレッジ要対応 (追跡 ${num(coverage.tracked)}・${coverage.week})`}
      />,
    );
  }

  if (cards.length === 0) {
    return <p className="text-sm text-console-bad">メトリクスの取得に失敗</p>;
  }

  return <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">{cards}</div>;
}
