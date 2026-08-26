"use client";

import dynamic from "next/dynamic";

import { ChartEmptyState, ChartLoading } from "./ChartState";

import type { ThemeChartResult } from "./theme-chart-result";

type NonNullThemeChartResult = NonNullable<ThemeChartResult>;
type LineResult = Extract<NonNullThemeChartResult, { type: "line" }>;
type MixedResult = Extract<NonNullThemeChartResult, { type: "mixed" }>;
type DonutResult = Extract<NonNullThemeChartResult, { type: "donut" }>;
type CpiProfileResult = Extract<NonNullThemeChartResult, { type: "cpi-profile" }>;
type CpiHeatmapResult = Extract<NonNullThemeChartResult, { type: "cpi-heatmap" }>;
type PyramidResult = Extract<NonNullThemeChartResult, { type: "pyramid" }>;
type CompositionResult = Extract<NonNullThemeChartResult, { type: "composition" }>;

const D3MixedChart = dynamic(() => import("@stats47/visualization/d3/MixedChart").then((mod) => mod.MixedChart), {
  ssr: false,
  loading: () => <ChartLoading height={200} />,
});

const DonutChart = dynamic(() => import("@stats47/visualization/d3/DonutChart").then((mod) => mod.DonutChart), {
  ssr: false,
  loading: () => <ChartLoading height={200} />,
});

const HorizontalDivergingBarChart = dynamic(
  () => import("@stats47/visualization/d3/HorizontalDivergingBarChart").then((mod) => mod.HorizontalDivergingBarChart),
  { ssr: false, loading: () => <ChartLoading height={250} /> }
);

const CategoryHeatmap = dynamic(
  () => import("@stats47/visualization/d3/CategoryHeatmap").then((mod) => mod.CategoryHeatmap),
  { ssr: false, loading: () => <ChartLoading height={280} /> }
);

const LineChartClient = dynamic(
  () =>
    import("@/components/stat-charts/components/charts/LineChart/LineChartClient").then((mod) => mod.LineChartClient),
  { ssr: false, loading: () => <ChartLoading height={250} /> }
);

const CompositionChartClient = dynamic(
  () =>
    import("@/components/stat-charts/components/charts/CompositionChart/CompositionChartClient").then(
      (mod) => mod.CompositionChartClient
    ),
  { ssr: false, loading: () => <ChartLoading height={220} /> }
);

const PyramidChartClient = dynamic(
  () =>
    import("@/components/stat-charts/components/charts/PyramidChart/PyramidChartClient").then(
      (mod) => mod.PyramidChartClient
    ),
  { ssr: false, loading: () => <ChartLoading height={400} /> }
);

interface ThemeChartResultRendererProps {
  chartResult: ThemeChartResult;
}

export function ThemeChartResultRenderer({ chartResult }: ThemeChartResultRendererProps) {
  switch (chartResult.type) {
    case "line":
      return <LineResultChart result={chartResult} />;
    case "mixed":
      return <MixedResultChart result={chartResult} />;
    case "donut":
      return <DonutResultChart result={chartResult} />;
    case "cpi-profile":
      return <CpiProfileResultChart result={chartResult} />;
    case "cpi-heatmap":
      return <CpiHeatmapResultChart result={chartResult} />;
    case "pyramid":
      return <PyramidResultChart result={chartResult} />;
    case "composition":
      return <CompositionResultChart result={chartResult} />;
    default:
      return null;
  }
}

function LineResultChart({ result }: { result: LineResult }) {
  const { data } = result;
  if (data.data.length <= 1) {
    return <ChartEmptyState message="時系列データがありません" />;
  }

  return <LineChartClient chartData={data} showLatestValues={result.showLatestValues === true} />;
}

function MixedResultChart({ result }: { result: MixedResult }) {
  const { data } = result;
  if (data.data.length <= 1) {
    return <ChartEmptyState message="時系列データがありません" />;
  }

  // ★高さは CSS ではなく height prop で決める。この SVG は viewBox + h-auto w-full で
  //   「幅から高さが決まる」ため、親の固定高さ (h-[200px]) を守れず footer に重なる。
  return (
    <D3MixedChart
      data={data.data as Array<Record<string, string | number | undefined>>}
      categoryKey={data.xAxisKey}
      columns={data.columns}
      lines={data.lines}
      leftUnit={data.leftUnit ?? ""}
      rightUnit={data.rightUnit ?? ""}
      height={300}
    />
  );
}

function DonutResultChart({ result }: { result: DonutResult }) {
  const { data } = result;
  if (data.length === 0) {
    return <ChartEmptyState message="構成データがありません" />;
  }

  const total = data.reduce((sum: number, d: { value: number }) => sum + d.value, 0);
  const topItem = data[0];
  const topPct = total > 0 ? ((topItem.value / total) * 100).toFixed(1) : "0";

  return (
    <>
      {/* ★同上。DonutChart は正方形なので width/height で上限 200px に絞る */}
      <DonutChart
        data={data.map((d: { name: string; value: number; color: string }) => ({ ...d }))}
        centerText={`${topPct}%`}
        width={200}
        height={200}
      />
      <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
        {data.slice(0, 5).map((d: { name: string; value: number; color: string }) => (
          <div key={d.name} className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
            {d.name} {total > 0 ? ((d.value / total) * 100).toFixed(1) : 0}%
          </div>
        ))}
      </div>
    </>
  );
}

function CpiProfileResultChart({ result }: { result: CpiProfileResult }) {
  const { data } = result;
  if (data.length === 0) {
    return <ChartEmptyState message="物価プロファイルデータがありません" />;
  }

  return (
    <>
      <HorizontalDivergingBarChart
        data={data.map((d: { label: string; value: number }) => ({ label: d.label, value: d.value }))}
        baseline={100}
        height={Math.max(250, data.length * 30 + 40)}
      />
      <p className="mt-1 text-[10px] text-muted-foreground">全国平均=100</p>
    </>
  );
}

function CpiHeatmapResultChart({ result }: { result: CpiHeatmapResult }) {
  const { data } = result;
  if (data.length === 0) {
    return <ChartEmptyState message="ヒートマップデータがありません" />;
  }

  return (
    <>
      <CategoryHeatmap data={data} baseline={100} height={300} />
      <p className="mt-1 text-[10px] text-muted-foreground">青=全国平均より高い / オレンジ=低い（全国平均=100）</p>
    </>
  );
}

function PyramidResultChart({ result }: { result: PyramidResult }) {
  const { data } = result;
  if (data.pyramidData.length === 0) {
    return <ChartEmptyState message="人口ピラミッドデータがありません" />;
  }

  return <PyramidChartClient chartData={data.pyramidData} year={data.yearName} />;
}

function CompositionResultChart({ result }: { result: CompositionResult }) {
  const { data } = result;

  return <CompositionChartClient chartData={data} defaultTab={result.defaultTab} />;
}
