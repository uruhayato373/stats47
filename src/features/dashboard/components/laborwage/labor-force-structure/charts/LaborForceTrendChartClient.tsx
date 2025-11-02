/**
 * 労働力人口・就業者数推移チャート表示コンポーネント（Client Component）
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

interface LaborForceTrendChartClientProps {
  /** チャート用データ */
  chartData: Array<{
    year: string;
    yearName: string;
    laborForceValue: number;
    employedValue: number;
    unit: string;
  }>;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
}

/**
 * 労働力人口・就業者数推移チャート表示コンポーネント
 */
export function LaborForceTrendChartClient({
  chartData,
  title,
  description,
}: LaborForceTrendChartClientProps) {
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
    laborForceValue: {
      label: "労働力人口",
      color: "hsl(221, 83%, 53%)", // Blue（青色）
    },
    employedValue: {
      label: "就業者数",
      color: "hsl(142, 76%, 36%)", // Green（緑色）
    },
  };

  const laborForceColor = "hsl(221, 83%, 53%)"; // Blue
  const employedColor = "hsl(142, 76%, 36%)"; // Green

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
                            <span className="text-blue-600">労働力人口:</span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatValue(data.laborForceValue)} {data.unit}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-green-600">就業者数:</span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatValue(data.employedValue)} {data.unit}
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
                dataKey="laborForceValue"
                name="laborForceValue"
                stroke={laborForceColor}
                strokeWidth={2}
                dot={{ fill: laborForceColor, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="employedValue"
                name="employedValue"
                stroke={employedColor}
                strokeWidth={2}
                dot={{ fill: employedColor, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

