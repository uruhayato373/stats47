/**
 * 年度別気温推移チャート表示コンポーネント（Client Component）
 */

"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/ui/card";
import { ChartContainer, ChartTooltip, ChartLegend, ChartLegendContent } from "@/components/atoms/ui/chart";

interface TemperatureTrendChartClientProps {
  /** チャート用データ */
  chartData: Array<{
    year: string;
    yearName: string;
    average: number;
    maximum: number;
    minimum: number;
  }>;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
}

/**
 * 年度別気温推移チャート表示コンポーネント
 */
export function TemperatureTrendChartClient({
  chartData,
  title,
  description,
}: TemperatureTrendChartClientProps) {
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
    average: {
      label: "年平均気温",
      color: "hsl(221, 83%, 53%)", // Blue（青色）
    },
    maximum: {
      label: "最高気温",
      color: "hsl(0, 84%, 60%)", // Red（赤色）
    },
    minimum: {
      label: "最低気温",
      color: "hsl(221, 83%, 60%)", // Light Blue（ライトブルー）
    },
  };

  // 数値を小数点以下1桁でフォーマット
  const formatValue = (value: number): string => {
    return new Intl.NumberFormat("ja-JP", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  };

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
                dataKey="yearName"
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
                tickFormatter={formatValue}
              />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length > 0) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid gap-1.5">
                          <div className="font-medium">{data.yearName}</div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">年平均気温</span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatValue(data.average)}℃
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">最高気温</span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatValue(data.maximum)}℃
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">最低気温</span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatValue(data.minimum)}℃
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                type="monotone"
                dataKey="average"
                stroke={chartConfig.average.color}
                strokeWidth={2}
                dot={{ fill: chartConfig.average.color, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="maximum"
                stroke={chartConfig.maximum.color}
                strokeWidth={2}
                dot={{ fill: chartConfig.maximum.color, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="minimum"
                stroke={chartConfig.minimum.color}
                strokeWidth={2}
                dot={{ fill: chartConfig.minimum.color, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

