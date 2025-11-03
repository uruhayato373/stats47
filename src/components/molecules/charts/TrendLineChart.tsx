/**
 * 推移ラインチャート共通コンポーネント
 *
 * 年度別データの推移を表示するラインチャートの共通コンポーネント。
 * 複数のLineを表示可能で、TooltipやLegendもカスタマイズ可能。
 */

"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
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
} from "@/components/atoms/ui/chart";
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
 * Tooltip の設定
 */
export interface TooltipConfig {
  /** 表示するデータキーの配列 */
  dataKeys: string[];
  /** 各データキーのラベル（オプション） */
  labels?: Record<string, string>;
  /** 各データキーの色（オプション） */
  colors?: Record<string, string>;
  /** 単位のデータキー（デフォルト: "unit"） */
  unitKey?: string;
  /** X軸のラベルキー（デフォルト: "yearName"） */
  xLabelKey?: string;
}

/**
 * TrendLineChart の Props
 */
export interface TrendLineChartProps {
  /** チャート用データ */
  chartData: Array<Record<string, unknown>>;
  /** チャート設定（dataKey をキーとする） */
  chartConfig: Record<string, ChartConfig>;
  /** Line の設定配列 */
  lines: LineConfig[];
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
  /** X軸のデータキー（デフォルト: "yearName"） */
  xAxisDataKey?: string;
  /** Legend を表示するか（デフォルト: false） */
  showLegend?: boolean;
  /** Tooltip の設定（オプション、指定しない場合はデフォルトの tooltip を使用） */
  tooltipConfig?: TooltipConfig;
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
 * const chartConfig = {
 *   value: {
 *     label: "人口",
 *     color: "hsl(221, 83%, 53%)",
 *   },
 * };
 *
 * const lines = [
 *   {
 *     dataKey: "value",
 *     name: "value",
 *     color: "hsl(221, 83%, 53%)",
 *   },
 * ];
 *
 * <TrendLineChart
 *   chartData={data}
 *   chartConfig={chartConfig}
 *   lines={lines}
 *   title="人口推移"
 * />
 * ```
 */
export function TrendLineChart({
  chartData,
  chartConfig,
  lines,
  title,
  description,
  xAxisDataKey = "yearName",
  showLegend = false,
  tooltipConfig,
}: TrendLineChartProps) {
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
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey={xAxisDataKey}
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
                tickFormatter={formatNumber}
              />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) {
                    return null;
                  }

                  const data = payload[0].payload;

                  // tooltipConfig が指定されている場合はカスタム tooltip を表示
                  if (tooltipConfig) {
                    const unitKey = tooltipConfig.unitKey || "unit";
                    const xLabelKey = tooltipConfig.xLabelKey || "yearName";
                    const unit = data[unitKey] as string | undefined;
                    const xLabel = data[xLabelKey] as string | undefined;

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
                          {tooltipConfig.dataKeys.map((dataKey) => {
                            const value = data[dataKey] as number | undefined;
                            const label =
                              tooltipConfig.labels?.[dataKey] ||
                              chartConfig[dataKey]?.label ||
                              dataKey;
                            const color =
                              tooltipConfig.colors?.[dataKey] ||
                              chartConfig[dataKey]?.color ||
                              "inherit";

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
                                  {formatNumber(value)}
                                  {unit ? ` ${unit}` : ""}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  // デフォルトの tooltip を表示（Recharts のデフォルト動作）
                  return null;
                }}
              />
              {showLegend && (
                <Legend
                  formatter={(value) => {
                    const config = chartConfig[value as string];
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

