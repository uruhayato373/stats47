/**
 * 年齢区分別人口スタックバーチャート表示コンポーネント（Client Component）
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/atoms/ui/chart";

interface AgeGroupStackedBarChartClientProps {
  /** チャート用データ */
  chartData: Array<{
    year: string;
    yearName: string;
    young: number;
    production: number;
    old: number;
    total: number;
  }>;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
}

/**
 * 年齢区分別人口スタックバーチャート表示コンポーネント
 */
export function AgeGroupStackedBarChartClient({
  chartData,
  title,
  description,
}: AgeGroupStackedBarChartClientProps) {
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
    young: {
      label: "15歳未満",
      color: "hsl(221, 83%, 53%)", // Blue（青色）
    },
    production: {
      label: "15～64歳",
      color: "hsl(142, 76%, 36%)", // Green（緑色）
    },
    old: {
      label: "65歳以上",
      color: "hsl(38, 92%, 50%)", // Orange（オレンジ色）
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
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis
                dataKey="yearName"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
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
                            <span className="text-muted-foreground">15歳未満</span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatValue(data.young)}人
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">15～64歳</span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatValue(data.production)}人
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">65歳以上</span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatValue(data.old)}人
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 border-t pt-1.5">
                            <span className="font-medium">合計</span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatValue(data.total)}人
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
              <Bar
                dataKey="young"
                stackId="a"
                fill={chartConfig.young.color}
                radius={[0, 0, 4, 4]}
              />
              <Bar
                dataKey="production"
                stackId="a"
                fill={chartConfig.production.color}
              />
              <Bar
                dataKey="old"
                stackId="a"
                fill={chartConfig.old.color}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

