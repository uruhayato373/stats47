/**
 * スタックバーチャート共通コンポーネント
 *
 * 複数のBarを重ねて表示するスタックバーチャートの共通コンポーネント。
 * 年度別データの推移を表示するのに適しています。
 */

"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/atoms/ui/chart";

export interface StackedBarConfig {
  /** データキー */
  dataKey: string;
  /** ラベル名 */
  label: string;
  /** 色 */
  color: string;
}

export interface StackedBarChartProps {
  /** チャート用データ */
  chartData: Array<Record<string, any>>;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
  /** チャート設定（各Barの設定） */
  chartConfig: Record<string, StackedBarConfig>;
  /** X軸のデータキー（デフォルト: "yearName"） */
  xAxisDataKey?: string;
  /** Y軸の数値フォーマッター */
  valueFormatter?: (value: number) => string;
  /** チャートの高さ（ピクセル）デフォルト: 400 */
  height?: number;
  /** カスタムTooltipコンテンツ（指定しない場合はChartTooltipContentを使用） */
  customTooltip?: (props: any) => React.ReactNode;
  /** 合計を表示するか（Tooltipで使用、デフォルト: false） */
  showTotal?: boolean;
  /** 合計のラベル（デフォルト: "合計"） */
  totalLabel?: string;
  /** 単位（Tooltipで使用） */
  unit?: string;
}

/**
 * スタックバーチャート共通コンポーネント
 */
export function StackedBarChart({
  chartData,
  title,
  description,
  chartConfig,
  xAxisDataKey = "yearName",
  valueFormatter = (value: number) =>
    new Intl.NumberFormat("ja-JP").format(value),
  height = 400,
  customTooltip,
  showTotal = false,
  totalLabel = "合計",
  unit,
}: StackedBarChartProps) {
  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">データがありません</p>
        </CardContent>
      </Card>
    );
  }

  // データキーのリストを取得（chartConfigのキー順）
  const dataKeys = Object.keys(chartConfig);

  // Tooltipコンテンツ
  const tooltipContent = customTooltip
    ? customTooltip
    : ({ active, payload }: any) => {
        if (!active || !payload || payload.length === 0) return null;

        const data = payload[0].payload;
        const xAxisValue = data[xAxisDataKey];

        return (
          <div className="rounded-lg border bg-background p-2 shadow-sm">
            <div className="grid gap-1.5">
              {xAxisValue && (
                <div className="font-medium">{xAxisValue}</div>
              )}
              {payload.map((item: any, index: number) => {
                const config = chartConfig[item.dataKey];
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="text-muted-foreground">
                      {config?.label || item.dataKey}
                    </span>
                    <span className="font-mono font-medium tabular-nums">
                      {valueFormatter(item.value)}
                      {unit || ""}
                    </span>
                  </div>
                );
              })}
              {showTotal && (
                <div className="flex items-center justify-between gap-2 border-t pt-1.5">
                  <span className="font-medium">{totalLabel}</span>
                  <span className="font-mono font-medium tabular-nums">
                    {valueFormatter(
                      payload.reduce(
                        (sum: number, item: any) => sum + (item.value || 0),
                        0
                      )
                    )}
                    {unit || ""}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="w-full" style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height={height}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-muted"
                vertical={false}
              />
              <XAxis
                dataKey={xAxisDataKey}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                className="text-xs"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs"
                tickFormatter={valueFormatter}
              />
              <ChartTooltip content={tooltipContent} />
              <ChartLegend content={<ChartLegendContent />} />
              {dataKeys.map((dataKey, index) => {
                const config = chartConfig[dataKey];
                if (!config) return null;

                const isFirst = index === 0;
                const isLast = index === dataKeys.length - 1;

                return (
                  <Bar
                    key={dataKey}
                    dataKey={dataKey}
                    stackId="stacked"
                    fill={config.color}
                    radius={
                      isFirst
                        ? [0, 0, 4, 4]
                        : isLast
                          ? [4, 4, 0, 0]
                          : [0, 0, 0, 0]
                    }
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

