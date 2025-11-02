/**
 * 総人口男女別割合ドーナツチャート表示コンポーネント（Client Component）
 */

"use client";

import {
  PieChart,
  Pie,
  Cell,
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

interface GenderRatioDonutChartClientProps {
  /** チャート用データ */
  chartData: Array<{
    name: string;
    value: number;
    percentage: string;
  }>;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
  /** 年度名 */
  timeName?: string;
}

/**
 * 総人口男女別割合ドーナツチャート表示コンポーネント
 */
export function GenderRatioDonutChartClient({
  chartData,
  title,
  description,
  timeName,
}: GenderRatioDonutChartClientProps) {
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
    male: {
      label: "男性",
      color: "hsl(221, 83%, 53%)", // Blue（青色）
    },
    female: {
      label: "女性",
      color: "hsl(346, 77%, 50%)", // Pink（ピンク色）
    },
  };

  // 色定義
  const COLORS = [
    "hsl(221, 83%, 53%)", // 男性（青）
    "hsl(346, 77%, 50%)", // 女性（ピンク）
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
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <ChartTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length > 0) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid gap-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">
                              {data.name}
                            </span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatValue(data.value)}人 ({data.percentage}%)
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
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry: any) => {
                  const data = chartData.find((d) => d.name === value);
                  return `${value} ${data?.percentage || "0"}%`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

