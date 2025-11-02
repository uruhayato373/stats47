/**
 * 年齢別人口分布チャートコンポーネント（BarChart）
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

interface AgeGroupData {
  itemCode: string;
  itemName: string;
  data: Array<{
    timeCode: string;
    timeName: string;
    value: number;
    unit: string;
  }>;
}

interface AgeDistributionChartProps {
  /** 年齢別人口データ */
  ageGroups: AgeGroupData[];
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
  /** 年度（最新年度を取得する場合は指定しない） */
  timeCode?: string;
}

/**
 * 年齢別人口分布チャート
 */
export function AgeDistributionChart({
  ageGroups,
  title,
  description,
  timeCode,
}: AgeDistributionChartProps) {
  // 指定年度のデータを取得（指定がない場合は最新年度）
  let targetTimeCode = timeCode;
  let targetTimeName = "";

  if (!targetTimeCode && ageGroups.length > 0) {
    // 最新年度を取得
    const latestData = ageGroups[0].data[ageGroups[0].data.length - 1];
    if (latestData) {
      targetTimeCode = latestData.timeCode;
      targetTimeName = latestData.timeName;
    }
  } else if (targetTimeCode) {
    // 指定年度の名前を取得
    const firstData = ageGroups[0]?.data.find(
      (d) => d.timeCode === targetTimeCode
    );
    if (firstData) {
      targetTimeName = firstData.timeName;
    }
  }

  // チャート用のデータ形式に変換
  const chartData = ageGroups
    .map((group) => {
      const data = group.data.find((d) => d.timeCode === targetTimeCode);
      if (!data) return null;

      // 年齢区分の範囲を取得（例: "0～4歳人口" → "0-4"）
      const ageRange = group.itemName.replace(/人口$/, "").replace(/～/g, "-");

      return {
        ageRange,
        ageGroup: group.itemName,
        value: data.value,
        unit: data.unit,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => {
      // 年齢順にソート（0-4, 5-9, ...）
      const ageA = parseInt(a.ageRange.split("-")[0]);
      const ageB = parseInt(b.ageRange.split("-")[0]);
      return ageA - ageB;
    });

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

  if (chartData.length === 0) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {targetTimeName && <CardDescription>{targetTimeName}</CardDescription>}
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
