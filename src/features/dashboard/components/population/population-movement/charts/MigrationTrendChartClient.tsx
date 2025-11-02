/**
 * 転入・転出推移チャート表示コンポーネント（Client Component）
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

interface MigrationTrendChartClientProps {
  /** チャート用データ */
  chartData: Array<{
    year: string;
    yearName: string;
    inValue: number;
    outValue: number;
    netValue: number;
    unit: string;
  }>;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
}

/**
 * 転入・転出推移チャート表示コンポーネント
 */
export function MigrationTrendChartClient({
  chartData,
  title,
  description,
}: MigrationTrendChartClientProps) {
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
    inValue: {
      label: "転入者数",
      color: "hsl(221, 83%, 53%)", // Blue（青色）
    },
    outValue: {
      label: "転出者数",
      color: "hsl(346, 77%, 50%)", // Pink（ピンク色）
    },
    netValue: {
      label: "転入超過数",
      color: "hsl(142, 76%, 36%)", // Green（緑色）
    },
  };

  const inColor = "hsl(221, 83%, 53%)"; // Blue
  const outColor = "hsl(346, 77%, 50%)"; // Pink
  const netColor = "hsl(142, 76%, 36%)"; // Green

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
                            <span className="text-blue-600">転入者数:</span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatValue(data.inValue)} {data.unit}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-pink-600">転出者数:</span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatValue(data.outValue)} {data.unit}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-green-600">転入超過数:</span>
                            <span className="font-mono font-medium tabular-nums">
                              {data.netValue >= 0 ? "+" : ""}
                              {formatValue(data.netValue)} {data.unit}
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
                dataKey="inValue"
                name="inValue"
                stroke={inColor}
                strokeWidth={2}
                dot={{ fill: inColor, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="outValue"
                name="outValue"
                stroke={outColor}
                strokeWidth={2}
                dot={{ fill: outColor, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="netValue"
                name="netValue"
                stroke={netColor}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: netColor, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

