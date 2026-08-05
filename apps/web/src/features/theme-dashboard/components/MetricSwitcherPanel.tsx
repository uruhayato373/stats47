"use client";

import { useEffect, useMemo, useState } from "react";

import dynamic from "next/dynamic";

import { Tabs, TabsList, TabsTrigger } from "@stats47/components/atoms/ui/tabs";
import { MapPin } from "lucide-react";

import { ChartFooter } from "@/components/charts/ChartFooter";
import { ChartPanel } from "@/components/charts/ChartPanel";
import type { LineChartData } from "@/components/stat-charts/types/visualization";

import { trackNavClick } from "@/lib/analytics/events";

import {
  fetchMetricTimeseriesAction,
  type MetricTimeseriesResult,
} from "../actions";

import { ChartEmptyState, ChartLoading } from "./ChartState";
import { ScrollableRow } from "./ScrollableRow";

import type { MetricKpi } from "./metric-kpi";

const LineChartClient = dynamic(
  () =>
    import(
      "@/components/stat-charts/components/charts/LineChart/LineChartClient"
    ).then((mod) => mod.LineChartClient),
  { ssr: false, loading: () => <ChartLoading height={250} /> },
);

const NATIONAL_CODE = "00000";
/** 比較系列 (全国) の線種。主系列と色だけで区別しないための破線 */
const COMPARISON_DASH = "6,4";

interface MetricSwitcherPanelProps {
  /** ThemeMetricsDashboard が導出した KPI 群 (タイルの中身) */
  metrics: MetricKpi[];
  /** rankingKey → 短ラベル (tabIndicators の tabLabel)。無ければ title を使う */
  tabLabels: Record<string, string>;
  /** 選択中の都道府県コード (null = 全国) */
  selectedPrefectureCode: string | null;
  /** 表示名 ("全国" or 県名) */
  areaName: string;
  /** 初期選択する指標。metrics に含まれなければ先頭を使う */
  defaultMetricKey?: string;
}

/** 系列キャッシュのキー。指標×地域で一意にする */
const cacheKey = (metricKey: string, areaCode: string) =>
  `${metricKey}:${areaCode}`;

/**
 * チャート領域に何を出すか。
 *
 * 「描けない」を 1 つの `null` にまとめると、読者には全部「推移データがありません」に
 * 見えてしまう。だが単年しか調査されていない指標 (鉄道駅数=2024年のみ 等) は
 * データが欠けているのではなく**そもそも推移が存在しない**ので、そう書いた方が正しい。
 */
type ChartState =
  | { kind: "chart"; data: LineChartData }
  | { kind: "single-year"; yearName: string }
  | { kind: "none" };

/**
 * 全国系列の凡例名。
 *
 * ★47 県平均を「全国」と称してはならない (総人口のような実数系は全国値の 1/47 になる)。
 * 判定は action が返す source 申告に従う。正典は aggregate-metric-timeseries.ts。
 */
function nationalSeriesName(result: MetricTimeseriesResult | undefined): string {
  return result?.source === "national" ? "全国" : "全国平均";
}

/**
 * 全国比較の破線を出しても意味がない指標か。
 *
 * 消費者物価の地域差指数のような「全国=100」の指数は、定義上どの年も全国が 100 なので
 * 比較線が情報ゼロの水平線になり、むしろ縦軸を潰して県の変化を読みにくくする。
 * 該当: consumer-prices の全指標 / laspeyres-index-prefecture など。
 */
function isNationalBaselineIndex(unit: string): boolean {
  return unit.includes("全国=100") || unit.includes("全国＝100");
}

/** チャート見出しの説明文。実際に描いた系列から書く (比較線は指標によって出ない) */
function describePanel(state: ChartState, areaName: string): string {
  if (state.kind === "single-year") return `${state.yearName}時点の値`;
  if (state.kind === "none") return `${areaName}の推移`;
  const [primary, comparison] = state.data.lines;
  return comparison
    ? `${primary.name}の推移（破線は${comparison.name}）`
    : `${primary.name}の推移`;
}

/**
 * チャートを描けないときの文面。
 *
 * 「データがありません」で済ませると、読者には取得失敗との区別が付かない。
 * 単年しか調査されていない指標はそう明示して、タイルの値・順位と
 * ランキング導線の方に目を向けてもらう。
 */
function emptyMessage(state: ChartState): string {
  return state.kind === "single-year"
    ? `${state.yearName}の単年データのため、推移グラフはありません`
    : "推移データがありません";
}

/**
 * GA4 レポート風の「KPI タイル切替チャート」。
 *
 * タイル群がタブになっていて、選んだ指標だけを下の大型折れ線に描く。
 *
 * 旧 KPI カードグリッドとの違いと、そうしている理由:
 * - タイルにミニチャートを置かない。トレンドは下の大型チャートが担うので、
 *   同じ事実を 2 か所に描かない (theme-catalog-standards.md の重複禁止を構造で守る)
 * - 全指標の全国系列を一括取得せず、選択された指標だけを遅延取得する。
 *   タイルの値・順位は indicatorDataMap 由来で即座に出るので初期表示は速い
 * - 県選択時は「実線=その県 / 破線=全国」を重ねる。旧カードは県別トレンドを
 *   出せていなかった (nationalSeries しか持っていなかった)
 */
export function MetricSwitcherPanel({
  metrics,
  tabLabels,
  selectedPrefectureCode,
  areaName,
  defaultMetricKey,
}: MetricSwitcherPanelProps) {
  const areaCode = selectedPrefectureCode ?? NATIONAL_CODE;

  const [selectedKey, setSelectedKey] = useState(() => {
    const preferred = metrics.find((m) => m.metricKey === defaultMetricKey);
    return preferred?.metricKey ?? metrics[0]?.metricKey ?? "";
  });

  /**
   * 実際に描画するキー。指標が入れ替わって選択中キーが消えたときは先頭に倒す。
   *
   * effect の中で setState して直すと連鎖レンダーになる
   * (react-hooks/set-state-in-effect)。state は「ユーザーが選んだもの」だけを持ち、
   * 現在の metrics で有効かどうかは描画時に導出する。
   */
  const effectiveKey = metrics.some((m) => m.metricKey === selectedKey)
    ? selectedKey
    : (metrics[0]?.metricKey ?? "");

  /**
   * `${metricKey}:${areaCode}` をキーにした取得済み系列。
   *
   * キー付きなので県切替やタイル往復での競合を requestId 照合なしに扱える
   * (古い応答が届いても自分のキーに書き込むだけで、描画は現在のキーを引く)。
   */
  const [seriesCache, setSeriesCache] = useState<
    Record<string, MetricTimeseriesResult>
  >({});

  const selected = metrics.find((m) => m.metricKey === effectiveKey);

  // 選択中の指標について、必要な系列 (自地域 + 全国) のうち未取得のものだけ取る
  useEffect(() => {
    if (!effectiveKey) return;
    const wanted = selectedPrefectureCode
      ? [areaCode, NATIONAL_CODE]
      : [NATIONAL_CODE];
    const missing = wanted.filter(
      (code) => !(cacheKey(effectiveKey, code) in seriesCache),
    );
    if (missing.length === 0) return;

    let cancelled = false;
    void Promise.all(
      missing.map(async (code) => {
        const result = await fetchMetricTimeseriesAction(
          effectiveKey,
          code,
        ).catch(() => null);
        return [cacheKey(effectiveKey, code), result] as const;
      }),
    ).then((entries) => {
      if (cancelled) return;
      setSeriesCache((prev) => {
        const next = { ...prev };
        for (const [key, result] of entries) {
          if (result) next[key] = result;
        }
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [effectiveKey, areaCode, selectedPrefectureCode, seriesCache]);

  const primaryResult = seriesCache[cacheKey(effectiveKey, areaCode)];
  const nationalResult = seriesCache[cacheKey(effectiveKey, NATIONAL_CODE)];
  const isLoadingSeries = !primaryResult;

  const chartState: ChartState = useMemo(() => {
    if (!selected) return { kind: "none" };

    const unit = selected.unit;
    /** 年ラベル → 行。2 系列を年で突き合わせる */
    const rows = new Map<string, Record<string, string | number>>();
    const put = (year: string, key: string, value: number) => {
      const row = rows.get(year) ?? { year };
      row[key] = value;
      rows.set(year, row);
    };

    const lines: LineChartData["lines"] = [];

    const areaPoints = primaryResult?.points ?? [];

    if (selectedPrefectureCode && areaPoints.length > 0) {
      for (const p of areaPoints) put(p.yearName, "value", p.value);
      lines.push({
        dataKey: "value",
        name: areaName,
        color: "hsl(var(--primary))",
      });

      // 全国は比較系列。破線 + 点なしで主系列と混ざらないようにする。
      // ただし「全国=100」の指数は全国が常に 100 の水平線になるので出さない。
      if (
        nationalResult &&
        nationalResult.points.length > 0 &&
        !isNationalBaselineIndex(unit)
      ) {
        for (const p of nationalResult.points) put(p.yearName, "national", p.value);
        lines.push({
          dataKey: "national",
          name: nationalSeriesName(nationalResult),
          color: "hsl(var(--muted-foreground))",
          strokeDasharray: COMPARISON_DASH,
          hidePoints: true,
        });
      }
    } else {
      // 全国表示、または県を選んでいてもその県の系列が取れない指標。
      //
      // 後者は国土数値情報など e-Stat パラメータを持たない external 種で起きる
      // (action が resolveEstatParams で null になり空を返す)。全国系列があるなら
      // それを描く — 「何も出ない」より水準の文脈が残る方が読者の役に立つ。
      // 全国系列も空なら (計算型指標) R2 の 47 県平均へ退避する。
      const points = nationalResult?.points ?? [];
      if (points.length > 0) {
        for (const p of points) put(p.yearName, "value", p.value);
        lines.push({
          dataKey: "value",
          name: nationalSeriesName(nationalResult),
          color: "hsl(var(--primary))",
        });
      } else if (selected.series.length > 0) {
        for (const p of selected.series) put(String(p.year), "value", p.value);
        lines.push({
          dataKey: "value",
          name: "全国平均",
          color: "hsl(var(--primary))",
        });
      } else {
        return { kind: "none" };
      }
    }

    const data = [...rows.values()].sort((a, b) =>
      String(a.year).localeCompare(String(b.year)),
    );
    // 1 点では折れ線にならない。ただし「無い」ではなく「単年だけ」と言い分ける
    if (data.length === 1) {
      return { kind: "single-year", yearName: String(data[0].year) };
    }
    if (data.length === 0) return { kind: "none" };
    return { kind: "chart", data: { xAxisKey: "year", data, lines, unit } };
  }, [
    selected,
    selectedPrefectureCode,
    primaryResult,
    nationalResult,
    areaName,
  ]);

  if (metrics.length === 0 || !selected) return null;

  const handleSelect = (key: string) => {
    setSelectedKey(key);
    trackNavClick({
      label: key,
      href: `/ranking/${key}`,
      surface: "theme_kpi_switcher",
    });
  };

  return (
    <Tabs value={effectiveKey} onValueChange={handleSelect}>
      <div className="mb-3">
        <ScrollableRow className="snap-x snap-mandatory">
          <TabsList className="inline-flex h-auto w-max gap-2 bg-transparent p-0">
            {metrics.map((m) => {
              const label = tabLabels[m.metricKey] ?? m.title;
              return (
                <TabsTrigger
                  key={m.metricKey}
                  value={m.metricKey}
                  className="snap-start flex h-auto w-[9.5rem] shrink-0 flex-col items-start gap-1 rounded-none border border-border border-b-2 bg-card px-3 py-2 text-left data-[state=active]:border-primary/40 data-[state=active]:border-b-primary data-[state=active]:bg-card data-[state=active]:shadow-none"
                >
                  <span className="w-full truncate text-[11px] text-muted-foreground">
                    {/* 47 県平均を「全国」と誤読させない */}
                    {m.isNationalAverage && !m.isLoading ? `${label}（平均）` : label}
                  </span>
                  <span className="w-full truncate text-base font-bold tabular-nums text-foreground">
                    {m.value !== null
                      ? m.value.toLocaleString("ja-JP", {
                          maximumFractionDigits: 2,
                        })
                      : "—"}
                    {m.unit ? (
                      <span className="ml-0.5 text-[11px] font-normal text-muted-foreground">
                        {m.unit}
                      </span>
                    ) : null}
                  </span>
                  {m.rank !== null ? (
                    <span className="text-[10px] tabular-nums text-muted-foreground">
                      {m.rank}位 / {m.total}
                    </span>
                  ) : null}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </ScrollableRow>
      </div>

      <ChartPanel
        title={selected.title}
        icon={<MapPin className="h-4 w-4 shrink-0 text-primary" />}
        titleClassName="text-base"
        description={describePanel(chartState, areaName)}
        footer={
          <ChartFooter
            rankingLink={`/ranking/${selected.metricKey}`}
            rankingLabel="ランキングを見る"
          />
        }
      >
        {isLoadingSeries ? (
          <ChartLoading height={250} />
        ) : chartState.kind === "chart" ? (
          <LineChartClient chartData={chartState.data} />
        ) : (
          <ChartEmptyState message={emptyMessage(chartState)} height={250} />
        )}
      </ChartPanel>
    </Tabs>
  );
}
