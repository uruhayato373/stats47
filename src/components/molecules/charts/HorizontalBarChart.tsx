/**
 * 横向きバーチャート共通コンポーネント
 *
 * LabelList を使用してラベルを表示する横向きバーチャートの共通コンポーネント。
 * バーの内側（左側）にカテゴリ名、右側に数値を表示します。
 */

"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
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
} from "@/components/atoms/ui/chart";

export interface HorizontalBarChartData {
  /** Y軸のカテゴリキー（表示用） */
  categoryKey: string;
  /** バーの内側左側に表示するラベル */
  labelKey: string;
  /** 数値 */
  value: number;
  /** 単位（オプション） */
  unit?: string;
  /** その他のデータ */
  [key: string]: any;
}

export interface HorizontalBarChartProps {
  /** チャート用データ */
  chartData: Array<HorizontalBarChartData>;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
  /** 追加情報（例: 年度名） */
  extraInfo?: string;
  /** バーの色 */
  barColor?: string;
  /** チャートの高さ（ピクセル）デフォルト: 400 */
  height?: number;
  /** Y軸のカテゴリキー（dataKey）デフォルト: "categoryKey" */
  categoryDataKey?: string;
  /** バーの内側左側に表示するラベルのキー（dataKey）デフォルト: "labelKey" */
  labelDataKey?: string;
  /** 数値のキー（dataKey）デフォルト: "valueKey" */
  valueDataKey?: string;
  /** 数値フォーマッター */
  valueFormatter?: (value: number) => string;
}

/**
 * 横向きバーチャート共通コンポーネント
 */
export function HorizontalBarChart({
  chartData,
  title,
  description,
  extraInfo,
  barColor = "hsl(142, 76%, 36%)",
  height = 400,
  categoryDataKey = "categoryKey",
  labelDataKey = "labelKey",
  valueDataKey = "valueKey",
  valueFormatter = (value: number) =>
    new Intl.NumberFormat("ja-JP").format(value),
}: HorizontalBarChartProps) {
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

  const chartConfig = {
    [valueDataKey]: {
      label: title,
      color: barColor,
    },
    label: {
      color: "var(--background)",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {extraInfo && <CardDescription>{extraInfo}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="w-full" style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height={height}>
            <BarChart
              accessibilityLayer
              data={chartData}
              layout="vertical"
              margin={{
                right: 16,
              }}
            >
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey={categoryDataKey}
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value}
                hide
              />
              <XAxis dataKey={valueDataKey} type="number" hide />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Bar
                dataKey={valueDataKey}
                layout="vertical"
                fill={barColor}
                radius={4}
              >
                <LabelList
                  dataKey={labelDataKey}
                  position="insideLeft"
                  offset={8}
                  fill={chartConfig.label.color}
                  fontSize={12}
                />
                <LabelList
                  dataKey={valueDataKey}
                  position="right"
                  offset={8}
                  fill="hsl(var(--foreground))"
                  fontSize={12}
                  formatter={valueFormatter}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

