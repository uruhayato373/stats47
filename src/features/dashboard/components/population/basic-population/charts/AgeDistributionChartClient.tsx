/**
 * 年齢別人口分布チャート表示コンポーネント（Client Component）
 */

"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
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

interface AgeDistributionChartClientProps {
  /** チャート用データ */
  chartData: Array<{
    ageRange: string;
    ageGroup: string;
    value: number;
    unit: string;
  }>;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
  /** 年度名 */
  timeName?: string;
}

/**
 * 年齢別人口分布チャート表示コンポーネント
 */
export function AgeDistributionChartClient({
  chartData,
  title,
  description,
  timeName,
}: AgeDistributionChartClientProps) {
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
    value: {
      label: title,
      color: "hsl(var(--chart-2))",
    },
  };

  // 数値をカンマ区切りでフォーマット
  const formatValue = (value: number): string => {
    return new Intl.NumberFormat("ja-JP").format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {timeName && <CardDescription>{timeName}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="ageRange"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                angle={-45}
                textAnchor="end"
                height={80}
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
                              {data.ageGroup}
                            </span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatValue(data.value)} {data.unit}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="value"
                fill="hsl(var(--chart-2))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

