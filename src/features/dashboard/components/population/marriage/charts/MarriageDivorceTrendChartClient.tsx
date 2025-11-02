/**
 * 婚姻・離婚推移チャート表示コンポーネント（Client Component）
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
import { ChartContainer, ChartTooltip } from "@/components/atoms/ui/chart";

interface MarriageDivorceTrendChartClientProps {
  /** チャート用データ */
  chartData: Array<{
    year: string;
    yearName: string;
    marriageValue: number;
    divorceValue: number;
    unit: string;
  }>;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
}

/**
 * 婚姻・離婚推移チャート表示コンポーネント
 */
export function MarriageDivorceTrendChartClient({
  chartData,
  title,
  description,
}: MarriageDivorceTrendChartClientProps) {
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
    marriageValue: {
      label: "婚姻件数",
      color: "hsl(221, 83%, 53%)", // Blue（青色）
    },
    divorceValue: {
      label: "離婚件数",
      color: "hsl(346, 77%, 50%)", // Pink（ピンク色）
    },
  };

  const marriageColor = "hsl(221, 83%, 53%)"; // Blue
  const divorceColor = "hsl(346, 77%, 50%)"; // Pink

  // 数値をカンマ区切りでフォーマット
  const formatValue = (value: number): string => {
    return new Intl.NumberFormat("ja-JP").format(value);
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
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">
                              {data.yearName}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-blue-600">婚姻件数:</span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatValue(data.marriageValue)} {data.unit}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-pink-600">離婚件数:</span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatValue(data.divorceValue)} {data.unit}
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
                formatter={(value) => {
                  const config = chartConfig[value as keyof typeof chartConfig];
                  return config ? config.label : value;
                }}
              />
              <Line
                type="monotone"
                dataKey="marriageValue"
                name="marriageValue"
                stroke={marriageColor}
                strokeWidth={2}
                dot={{ fill: marriageColor, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="divorceValue"
                name="divorceValue"
                stroke={divorceColor}
                strokeWidth={2}
                dot={{ fill: divorceColor, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

