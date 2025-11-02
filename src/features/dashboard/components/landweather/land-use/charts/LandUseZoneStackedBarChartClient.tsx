/**
 * 用途地域内訳スタックバーチャート表示コンポーネント（Client Component）
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

interface LandUseZoneStackedBarChartClientProps {
  /** チャート用データ */
  chartData: Array<{
    year: string;
    yearName: string;
    residentialOnly: number;
    residential: number;
    neighborhoodCommercial: number;
    commercial: number;
    quasiIndustrial: number;
    industrial: number;
    industrialOnly: number;
    total: number;
  }>;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
}

/**
 * 用途地域内訳スタックバーチャート表示コンポーネント
 */
export function LandUseZoneStackedBarChartClient({
  chartData,
  title,
  description,
}: LandUseZoneStackedBarChartClientProps) {
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
    residentialOnly: {
      label: "住居専用地域",
      color: "hsl(142, 76%, 36%)", // Green（緑色）
    },
    residential: {
      label: "住居地域",
      color: "hsl(173, 80%, 40%)", // Cyan（シアン色）
    },
    neighborhoodCommercial: {
      label: "近隣商業地域",
      color: "hsl(38, 92%, 50%)", // Orange（オレンジ色）
    },
    commercial: {
      label: "商業地域",
      color: "hsl(346, 77%, 50%)", // Pink（ピンク色）
    },
    quasiIndustrial: {
      label: "準工業地域",
      color: "hsl(221, 83%, 53%)", // Blue（青色）
    },
    industrial: {
      label: "工業地域",
      color: "hsl(280, 70%, 50%)", // Purple（紫色）
    },
    industrialOnly: {
      label: "工業専用地域",
      color: "hsl(0, 0%, 40%)", // Dark Gray（ダークグレー）
    },
  };

  // 数値をカンマ区切りでフォーマット
  const formatValue = (value: number): string => {
    return new Intl.NumberFormat("ja-JP", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
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
                            <span className="text-muted-foreground">住居専用地域</span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatValue(data.residentialOnly)}ｈａ
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">住居地域</span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatValue(data.residential)}ｈａ
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">近隣商業地域</span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatValue(data.neighborhoodCommercial)}ｈａ
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">商業地域</span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatValue(data.commercial)}ｈａ
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">準工業地域</span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatValue(data.quasiIndustrial)}ｈａ
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">工業地域</span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatValue(data.industrial)}ｈａ
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">工業専用地域</span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatValue(data.industrialOnly)}ｈａ
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 border-t pt-1.5">
                            <span className="font-medium">合計</span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatValue(data.total)}ｈａ
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
                dataKey="residentialOnly"
                stackId="a"
                fill={chartConfig.residentialOnly.color}
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="residential"
                stackId="a"
                fill={chartConfig.residential.color}
              />
              <Bar
                dataKey="neighborhoodCommercial"
                stackId="a"
                fill={chartConfig.neighborhoodCommercial.color}
              />
              <Bar
                dataKey="commercial"
                stackId="a"
                fill={chartConfig.commercial.color}
              />
              <Bar
                dataKey="quasiIndustrial"
                stackId="a"
                fill={chartConfig.quasiIndustrial.color}
              />
              <Bar
                dataKey="industrial"
                stackId="a"
                fill={chartConfig.industrial.color}
              />
              <Bar
                dataKey="industrialOnly"
                stackId="a"
                fill={chartConfig.industrialOnly.color}
                radius={[0, 0, 4, 4]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

