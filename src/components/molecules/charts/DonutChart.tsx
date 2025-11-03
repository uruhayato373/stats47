/**
 * ドーナツチャート共通コンポーネント
 *
 * 円グラフの中央に穴があるドーナツチャートの共通コンポーネント。
 * 割合や構成比を表示するのに適しています。
 */

"use client";

import {
  PieChart,
  Pie,
  Cell,
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
import { ChartContainer, ChartTooltip } from "@/components/atoms/ui/chart";

export interface DonutChartData {
  /** カテゴリ名 */
  name: string;
  /** 数値 */
  value: number;
  /** パーセンテージ（文字列） */
  percentage: string;
}

export interface DonutChartConfig {
  /** ラベル名 */
  label: string;
  /** 色 */
  color: string;
}

export interface DonutChartProps {
  /** チャート用データ */
  chartData: Array<DonutChartData>;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
  /** 追加情報（例: 年度名） */
  extraInfo?: string;
  /** チャート設定（各カテゴリの設定） */
  chartConfig: Record<string, DonutChartConfig>;
  /** 色の配列（chartDataの順序に対応） */
  colors: Array<string>;
  /** 内側の半径（デフォルト: 60） */
  innerRadius?: number;
  /** 外側の半径（デフォルト: 100） */
  outerRadius?: number;
  /** パディング角度（デフォルト: 5） */
  paddingAngle?: number;
  /** チャートの高さ（ピクセル）デフォルト: 300 */
  height?: number;
  /** 単位（デフォルト: ""） */
  unit?: string;
  /** 合計値（ヘッダーに表示） */
  totalValue?: number;
  /** 合計値のラベル（デフォルト: "合計"） */
  totalLabel?: string;
  /** 数値フォーマッター */
  valueFormatter?: (value: number) => string;
  /** データキー（デフォルト: "value"） */
  dataKey?: string;
}

/**
 * ドーナツチャート共通コンポーネント
 */
export function DonutChart({
  chartData,
  title,
  description,
  extraInfo,
  chartConfig,
  colors,
  innerRadius = 60,
  outerRadius = 100,
  paddingAngle = 5,
  height = 300,
  unit = "",
  totalValue,
  totalLabel = "合計",
  valueFormatter = (value: number) =>
    new Intl.NumberFormat("ja-JP").format(value),
  dataKey = "value",
}: DonutChartProps) {
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
        {extraInfo && <CardDescription>{extraInfo}</CardDescription>}
        {totalValue !== undefined && (
          <CardDescription>
            {totalLabel}: {valueFormatter(totalValue)} {unit}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="w-full" style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                paddingAngle={paddingAngle}
                dataKey={dataKey}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index] || colors[0]} />
                ))}
              </Pie>
              <ChartTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length > 0) {
                    const data = payload[0]?.payload as DonutChartData | undefined;
                    if (!data) return null;

                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid gap-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">{data.name}</span>
                            <span className="font-mono font-medium tabular-nums">
                              {valueFormatter(data.value)} {unit} ({data.percentage}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => {
                  const data = chartData.find((d) => d.name === value);
                  return `${value} ${data?.percentage || "0"}%`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

