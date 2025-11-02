/**
 * 出生・死亡推移チャート表示コンポーネント（Client Component）
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

interface BirthDeathTrendChartClientProps {
  /** チャート用データ */
  chartData: Array<{
    year: string;
    yearName: string;
    birthValue: number;
    deathValue: number;
    unit: string;
  }>;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
}

/**
 * 出生・死亡推移チャート表示コンポーネント
 */
export function BirthDeathTrendChartClient({
  chartData,
  title,
  description,
}: BirthDeathTrendChartClientProps) {
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
    birthValue: {
      label: "出生数",
      color: "hsl(221, 83%, 53%)", // Blue（青色）
    },
    deathValue: {
      label: "死亡数",
      color: "hsl(346, 77%, 50%)", // Pink（ピンク色）
    },
  };

  const birthColor = "hsl(221, 83%, 53%)"; // Blue
  const deathColor = "hsl(346, 77%, 50%)"; // Pink

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
                            <span className="text-blue-600">出生数:</span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatValue(data.birthValue)} {data.unit}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-pink-600">死亡数:</span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatValue(data.deathValue)} {data.unit}
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
                dataKey="birthValue"
                name="birthValue"
                stroke={birthColor}
                strokeWidth={2}
                dot={{ fill: birthColor, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="deathValue"
                name="deathValue"
                stroke={deathColor}
                strokeWidth={2}
                dot={{ fill: deathColor, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

