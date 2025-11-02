/**
 * 世帯構成スタックバーチャート表示コンポーネント（Client Component）
 */

"use client";

import {
  BarChart,
  Bar,
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

interface HouseholdCompositionStackedBarChartClientProps {
  /** チャート用データ */
  chartData: Array<{
    category: string;
    "単独世帯": number;
    "核家族世帯": number;
    "核家族以外の世帯": number;
    "その他": number;
  }>;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
  /** 年度名 */
  timeName?: string;
  /** 単位 */
  unit?: string;
}

/**
 * 世帯構成スタックバーチャート表示コンポーネント
 */
export function HouseholdCompositionStackedBarChartClient({
  chartData,
  title,
  description,
  timeName,
  unit = "世帯",
}: HouseholdCompositionStackedBarChartClientProps) {
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
    単独世帯: {
      label: "単独世帯",
      color: "hsl(221, 83%, 53%)", // Blue（青色）
    },
    核家族世帯: {
      label: "核家族世帯",
      color: "hsl(142, 76%, 36%)", // Green（緑色）
    },
    核家族以外の世帯: {
      label: "核家族以外の世帯",
      color: "hsl(38, 92%, 50%)", // Orange（オレンジ色）
    },
    その他: {
      label: "その他",
      color: "hsl(346, 77%, 50%)", // Pink（ピンク色）
    },
  };

  // 色定義
  const COLORS = [
    "hsl(221, 83%, 53%)", // 単独世帯（青）
    "hsl(142, 76%, 36%)", // 核家族世帯（緑）
    "hsl(38, 92%, 50%)", // 核家族以外の世帯（オレンジ）
    "hsl(346, 77%, 50%)", // その他（ピンク）
  ];

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
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="category"
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
                    const total = payload.reduce(
                      (sum, entry) => sum + (entry.value as number),
                      0
                    );
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid gap-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">
                              合計:
                            </span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatValue(total)} {unit}
                            </span>
                          </div>
                          {payload.map((entry, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between gap-2"
                            >
                              <span
                                style={{ color: entry.color }}
                                className="text-sm"
                              >
                                {entry.name}:
                              </span>
                              <span className="font-mono font-medium tabular-nums">
                                {formatValue(entry.value as number)} {unit}
                              </span>
                            </div>
                          ))}
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
              <Bar
                dataKey="単独世帯"
                stackId="a"
                fill={COLORS[0]}
                radius={[0, 0, 4, 4]}
              />
              <Bar
                dataKey="核家族世帯"
                stackId="a"
                fill={COLORS[1]}
                radius={0}
              />
              <Bar
                dataKey="核家族以外の世帯"
                stackId="a"
                fill={COLORS[2]}
                radius={0}
              />
              <Bar
                dataKey="その他"
                stackId="a"
                fill={COLORS[3]}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

