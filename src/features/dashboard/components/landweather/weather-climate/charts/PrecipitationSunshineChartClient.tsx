/**
 * 年度別降水量・日照時間推移チャート表示コンポーネント（Client Component）
 * 2軸チャート（降水量: mm、日照時間: 時間）
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

interface PrecipitationSunshineChartClientProps {
  /** チャート用データ */
  chartData: Array<{
    year: string;
    yearName: string;
    precipitation: number;
    sunshine: number;
  }>;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
}

/**
 * 年度別降水量・日照時間推移チャート表示コンポーネント
 */
export function PrecipitationSunshineChartClient({
  chartData,
  title,
  description,
}: PrecipitationSunshineChartClientProps) {
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
    precipitation: {
      label: "年間降水量",
      color: "hsl(221, 83%, 53%)", // Blue（青色）
    },
    sunshine: {
      label: "年間日照時間",
      color: "hsl(38, 92%, 50%)", // Orange（オレンジ色）
    },
  };

  // 数値をカンマ区切りでフォーマット
  const formatValue = (value: number): string => {
    return new Intl.NumberFormat("ja-JP", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs"
                tickFormatter={formatValue}
                label={{ value: "降水量 (mm)", angle: -90, position: "insideLeft" }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs"
                tickFormatter={formatValue}
                label={{ value: "日照時間 (時間)", angle: 90, position: "insideRight" }}
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
                            <span className="text-muted-foreground">年間降水量</span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatValue(data.precipitation)}mm
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">年間日照時間</span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatValue(data.sunshine)}時間
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
                yAxisId="left"
                type="monotone"
                dataKey="precipitation"
                stroke={chartConfig.precipitation.color}
                strokeWidth={2}
                dot={{ fill: chartConfig.precipitation.color, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="sunshine"
                stroke={chartConfig.sunshine.color}
                strokeWidth={2}
                dot={{ fill: chartConfig.sunshine.color, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

