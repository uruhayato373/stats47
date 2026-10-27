import type { ReactNode } from "react";
import {
  CoinsIcon,
  EyeIcon,
  FileWarningIcon,
  GaugeIcon,
  ListOrderedIcon,
  MousePointerClickIcon,
  PercentIcon,
  SearchIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";

import { StatCard, TrendChart, type StatTrend, type TrendRow } from "@/components/admin-ui";
import { Grid } from "@/components/layout-primitives";

import { num, wow } from "./format";

type Row = Record<string, string | number>;
type Wrapped<T> = T | { error: string };

function hasError(v: unknown): v is { error: string } {
  return !!v && typeof v === "object" && "error" in (v as Record<string, unknown>);
}

/** 前週比 (wow) を StatCard の増減に写す。比べる値が無いときは出さない */
function wowTrend(rows: Row[], key: string): StatTrend | undefined {
  const r = wow(rows, key);
  if (!r) return undefined;
  return { label: `${r.up ? "+" : "-"}${Math.abs(r.pct).toFixed(1)}%`, direction: r.pct > 0 ? "up" : r.pct < 0 ? "down" : "flat" };
}

/** 数値でない値は欠測 (null) のまま渡す。0 にしない */
function toNum(v: unknown): number | null {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function series(rows: Row[], keys: string[]): TrendRow[] {
  return rows.map((r) => Object.fromEntries([["week", String(r.week)], ...keys.map((k) => [k, toNum(r[k])])]));
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

/** 週次メトリクス。GSC/GA4/AdSense/PSI/coverage の数値タイル → GSC・GA4・AdSense の推移チャート。 */
export function MetricsSection({ metrics, psi, coverage }: MetricsData) {
  const cards: ReactNode[] = [];
  const charts: ReactNode[] = [];

  if (!hasError(metrics)) {
    const g = metrics.gsc;
    const a = metrics.ga4;
    const ad = metrics.adsense;

    if (Array.isArray(g) && g.length > 0) {
      const last = g[g.length - 1];
      cards.push(
        <StatCard
          key="gsc-clicks"
          icon={<MousePointerClickIcon />}
          value={num(Number(last.clicks))}
          label="GSC clicks/確定7日"
          trend={wowTrend(g, "clicks")}
          sub={String(last.week)}
        />,
        <StatCard
          key="gsc-impressions"
          icon={<EyeIcon />}
          value={num(Number(last.impressions))}
          label="GSC impressions/確定7日"
          trend={wowTrend(g, "impressions")}
        />,
        <StatCard key="gsc-ctr" icon={<PercentIcon />} value={`${(Number(last.ctr) * 100).toFixed(2)}%`} label="GSC CTR" />,
        <StatCard key="gsc-position" icon={<ListOrderedIcon />} value={String(last.position)} label="GSC 平均掲載順位" />,
      );
      if (g.length >= 3) {
        charts.push(
          <TrendChart
            key="gsc-chart"
            title="GSC clicks の推移"
            icon={<SearchIcon />}
            description={`週次・確定7日 (${g.length} 週)`}
            data={series(g, ["clicks"])}
            xKey="week"
            series={[{ key: "clicks", label: "clicks" }]}
          />,
          <TrendChart
            key="gsc-imp-chart"
            title="GSC impressions の推移"
            icon={<EyeIcon />}
            description={`週次・確定7日 (${g.length} 週)`}
            data={series(g, ["impressions"])}
            xKey="week"
            series={[{ key: "impressions", label: "impressions" }]}
            kind="bar"
          />,
        );
      }
    } else {
      cards.push(<StatCard key="gsc-err" icon={<SearchIcon />} value="—" label="GSC (取得失敗)" tone="bad" />);
    }

    if (Array.isArray(a) && a.length > 0) {
      const last = a[a.length - 1];
      cards.push(
        <StatCard
          key="ga4-users"
          icon={<UsersIcon />}
          value={num(Number(last.active_users))}
          label="GA4 users/週 JP"
          trend={wowTrend(a, "active_users")}
          sub={String(last.week)}
        />,
        <StatCard key="ga4-pv" icon={<EyeIcon />} value={num(Number(last.pageviews))} label="GA4 PV/週" trend={wowTrend(a, "pageviews")} />,
      );
      if (a.length >= 3) {
        charts.push(
          <TrendChart
            key="ga4-chart"
            title="GA4 users の推移"
            icon={<UsersIcon />}
            description={`週次・JP (${a.length} 週)`}
            data={series(a, ["active_users"])}
            xKey="week"
            series={[{ key: "active_users", label: "users" }]}
          />,
        );
      }
    }

    if (Array.isArray(ad) && ad.length > 0) {
      const last = ad[ad.length - 1];
      cards.push(
        <StatCard
          key="adsense-earnings"
          icon={<CoinsIcon />}
          value={`¥${num(Number(last.earnings))}`}
          label="AdSense/週"
          trend={wowTrend(ad, "earnings")}
          sub={`${last.week}・RPM ¥${last.rpm}`}
        />,
      );
      if (ad.length >= 3) {
        charts.push(
          <TrendChart
            key="adsense-chart"
            title="AdSense 収益の推移"
            icon={<TrendingUpIcon />}
            description={`週次 (${ad.length} 週)`}
            data={series(ad, ["earnings"])}
            xKey="week"
            series={[{ key: "earnings", label: "収益" }]}
            valueFormat="yen"
          />,
        );
      }
    }
  } else {
    cards.push(<StatCard key="metrics-err" icon={<FileWarningIcon />} value="—" label="メトリクス (取得失敗)" tone="bad" />);
  }

  if (!hasError(psi) && psi.date) {
    cards.push(
      <StatCard key="psi" icon={<GaugeIcon />} value={`${psi.errors ?? 0} / ${psi.warnings ?? 0}`} label="PSI 違反 error/warning" sub={psi.date} />,
    );
  }

  if (!hasError(coverage) && coverage.week) {
    cards.push(
      <StatCard
        key="coverage"
        icon={<FileWarningIcon />}
        value={num(coverage.pendingActionable)}
        label="GSC カバレッジ要対応"
        sub={`追跡 ${num(coverage.tracked)}・${coverage.week}`}
      />,
    );
  }

  if (cards.length === 0) {
    return <p className="text-sm text-console-bad">メトリクスの取得に失敗</p>;
  }

  return (
    <>
      <Grid min="sm">{cards}</Grid>
      {/* チャートは 2 枚ずつ横に並べる */}
      {Array.from({ length: Math.ceil(charts.length / 2) }, (_, i) => (
        <Grid key={i} min="lg">
          {charts.slice(i * 2, i * 2 + 2)}
        </Grid>
      ))}
    </>
  );
}
