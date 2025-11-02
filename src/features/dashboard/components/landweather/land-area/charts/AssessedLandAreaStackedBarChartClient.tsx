/**
 * 評価総地積内訳スタックバーチャート表示コンポーネント（Client Component）
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
  ChartLegend,
  ChartLegendContent,
} from "@/components/atoms/ui/chart";

interface AssessedLandAreaStackedBarChartClientProps {
  /** チャート用データ */
  chartData: Array<{
    year: string;
    yearName: string;
    paddy: number;
    field: number;
    residential: number;
    mountainForest: number;
    pasture: number;
    wilderness: number;
    other: number;
    total: number;
  }>;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
}

/**
 * 評価総地積内訳スタックバーチャート表示コンポーネント
 */
export function AssessedLandAreaStackedBarChartClient({
  chartData,
  title,
  description,
}: AssessedLandAreaStackedBarChartClientProps) {
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
    paddy: {
      label: "田",
      color: "hsl(142, 76%, 36%)", // Green（緑色）
    },
    field: {
      label: "畑",
      color: "hsl(38, 92%, 50%)", // Orange（オレンジ色）
    },
    residential: {
      label: "宅地",
      color: "hsl(346, 77%, 50%)", // Pink（ピンク色）
    },
    mountainForest: {
      label: "山林",
      color: "hsl(221, 83%, 53%)", // Blue（青色）
    },
    pasture: {
      label: "牧場",
      color: "hsl(173, 80%, 40%)", // Cyan（シアン色）
    },
    wilderness: {
      label: "原野",
      color: "hsl(280, 70%, 50%)", // Purple（紫色）
    },
    other: {
      label: "その他",
      color: "hsl(0, 0%, 60%)", // Gray（灰色）
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
                            <span className="text-muted-foreground">田</span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatValue(data.paddy)}㎡
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">畑</span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatValue(data.field)}㎡
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">宅地</span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatValue(data.residential)}㎡
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">山林</span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatValue(data.mountainForest)}㎡
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">牧場</span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatValue(data.pasture)}㎡
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">原野</span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatValue(data.wilderness)}㎡
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">その他</span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatValue(data.other)}㎡
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 border-t pt-1.5">
                            <span className="font-medium">合計</span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatValue(data.total)}㎡
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
                dataKey="paddy"
                stackId="a"
                fill={chartConfig.paddy.color}
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="field"
                stackId="a"
                fill={chartConfig.field.color}
              />
              <Bar
                dataKey="residential"
                stackId="a"
                fill={chartConfig.residential.color}
              />
              <Bar
                dataKey="mountainForest"
                stackId="a"
                fill={chartConfig.mountainForest.color}
              />
              <Bar
                dataKey="pasture"
                stackId="a"
                fill={chartConfig.pasture.color}
              />
              <Bar
                dataKey="wilderness"
                stackId="a"
                fill={chartConfig.wilderness.color}
              />
              <Bar
                dataKey="other"
                stackId="a"
                fill={chartConfig.other.color}
                radius={[0, 0, 4, 4]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

