/**
 * 推移ラインチャート共通コンポーネント
 *
 * 年度別データの推移を表示するラインチャートの共通コンポーネント。
 * 複数のLineを表示可能で、TooltipやLegendもカスタマイズ可能。
 */

"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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
import { ChartContainer, ChartTooltip } from "@/components/atoms/ui/chart";

import { CHART_COLORS } from "@/lib/chart-colors";
import { formatNumber } from "@/lib/format";

/**
 * Line の設定
 */
export interface LineConfig {
  /** データキー（dataKey） */
  dataKey: string;
  /** Line の名前（name） */
  name: string;
  /** 線の色 */
  color: string;
}

/**
 * ChartConfig の設定
 */
export interface ChartConfig {
  /** ラベル */
  label: string;
  /** 色 */
  color: string;
}

/**
 * TrendLineChart の Props
 */
export interface TrendLineChartProps {
  /** チャート用データ */
  chartData: Array<Record<string, unknown>>;
  /** チャート設定（dataKey をキーとする、指定しない場合は chartData から自動生成） */
  chartConfig?: Record<string, ChartConfig>;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
  /** Legend を表示するか（デフォルト: false） */
  showLegend?: boolean;
  /** 値のフォーマッター（デフォルト: formatNumber） */
  valueFormatter?: (value: number) => string;
}

/**
 * 推移ラインチャートコンポーネント
 *
 * 年度別データの推移を表示するラインチャート。
 * 複数のLineを表示可能で、TooltipやLegendもカスタマイズ可能。
 *
 * @param props - TrendLineChartProps
 * @returns 推移ラインチャートのJSX要素
 *
 * @example
 * ```tsx
 * // chartConfig を指定する場合
 * const chartConfig = {
 *   value: {
 *     label: "人口",
 *     color: "hsl(221, 83%, 53%)",
 *   },
 * };
 *
 * <TrendLineChart
 *   chartData={data}
 *   chartConfig={chartConfig}
 *   title="人口推移"
 * />
 *
 * // chartConfig を省略する場合（chartData から自動生成）
 * const chartData = [
 *   {
 *     yearName: "2020年",
 *     value: 14047594,
 *     unit: "人",
 *     categoryName: "総人口",
 *     color: "hsl(221, 83%, 53%)",
 *   },
 * ];
 *
 * <TrendLineChart
 *   chartData={chartData}
 *   title="人口推移"
 * />
 * ```
 */
export function TrendLineChart({
  chartData,
  chartConfig,
  title,
  description,
  showLegend = false,
  valueFormatter = formatNumber,
}: TrendLineChartProps) {
  // プロジェクト共通の定数
  const X_AXIS_DATA_KEY = "yearName";
  const X_LABEL_KEY = "yearName";
  const UNIT_KEY = "unit";

  // メタデータキー（データ値ではないキー）
  const META_KEYS = ["year", "yearName", "unit"];

  // chartConfig が未指定の場合、chartData から自動生成
  const finalChartConfig: Record<string, ChartConfig> =
    chartConfig ||
    (chartData && chartData.length > 0
      ? (() => {
          const firstItem = chartData[0];
          const dataKeys = Object.keys(firstItem).filter(
            (key) => !META_KEYS.includes(key)
          );

          return dataKeys.reduce((acc, dataKey) => {
            // chartData から categoryName と color を取得
            // 単一データキーの場合: categoryName, color
            // 複数データキーの場合: {dataKey}CategoryName, {dataKey}Color
            const categoryName =
              (firstItem.categoryName as string | undefined) ||
              (firstItem[`${dataKey}CategoryName`] as string | undefined);
            const color =
              (firstItem.color as string | undefined) ||
              (firstItem[`${dataKey}Color`] as string | undefined);

            acc[dataKey] = {
              label: categoryName || dataKey,
              color: color || CHART_COLORS.primary,
            };
            return acc;
          }, {} as Record<string, ChartConfig>);
        })()
      : {});

  // chartConfig から lines を自動生成
  const lines: LineConfig[] = Object.keys(finalChartConfig).map((dataKey) => ({
    dataKey,
    name: dataKey,
    color: finalChartConfig[dataKey].color,
  }));

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={finalChartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey={X_AXIS_DATA_KEY}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs"
                tickFormatter={valueFormatter}
              />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) {
                    return null;
                  }

                  const data = payload[0].payload;
                  const unit = data[UNIT_KEY] as string | undefined;
                  const xLabel = data[X_LABEL_KEY] as string | undefined;

                  // chartConfig のキーを dataKeys として使用
                  const dataKeys = Object.keys(finalChartConfig);

                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid gap-1.5">
                        {xLabel && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">
                              {xLabel}
                            </span>
                          </div>
                        )}
                        {dataKeys.map((dataKey) => {
                          const value = data[dataKey] as number | undefined;
                          const label =
                            finalChartConfig[dataKey]?.label || dataKey;
                          const color =
                            finalChartConfig[dataKey]?.color || "inherit";

                          if (value === undefined) {
                            return null;
                          }

                          return (
                            <div
                              key={dataKey}
                              className="flex items-center justify-between gap-2"
                            >
                              <span style={{ color }}>{label}:</span>
                              <span className="font-mono font-medium tabular-nums">
                                {valueFormatter(value)}
                                {unit ? ` ${unit}` : ""}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }}
              />
              {showLegend && (
                <Legend
                  formatter={(value) => {
                    const config = finalChartConfig[value as string];
                    return config ? config.label : value;
                  }}
                />
              )}
              {lines.map((line) => (
                <Line
                  key={line.dataKey}
                  type="monotone"
                  dataKey={line.dataKey}
                  name={line.name}
                  stroke={line.color}
                  strokeWidth={2}
                  dot={{ fill: line.color, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
