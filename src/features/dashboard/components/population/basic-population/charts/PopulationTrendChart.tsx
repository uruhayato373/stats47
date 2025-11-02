/**
 * 年度別人口推移チャートコンポーネント（LineChart）
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
import { ChartContainer, ChartTooltip } from "@/components/atoms/ui/chart";
import type { StatsSchema } from "@/types/stats";

interface PopulationTrendChartProps {
  /** 人口データ（年度別） */
  data: StatsSchema[];
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
}

/**
 * 年度別人口推移チャート
 */
export function PopulationTrendChart({
  data,
  title,
  description,
}: PopulationTrendChartProps) {
  // データが空の場合はエラーメッセージを表示
  if (!data || data.length === 0) {
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

  // StatsSchemaをチャート用のデータ形式に変換
  const chartData = data.map((item) => ({
    year: item.timeCode,
    yearName: item.timeName,
    value: typeof item.value === "number" ? item.value : Number(item.value) || 0,
    unit: item.unit,
  }));

  // デバッグ: データを確認
  console.log("[PopulationTrendChart] chartData:", chartData);

  const chartConfig = {
    value: {
      label: title,
      color: "hsl(var(--chart-1))",
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
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-1))", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

