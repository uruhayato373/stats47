"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/ui/card";
import React from "react";
// Props simplified - category and subcategory are now handled by layout

// モックデータ
const mockData = {
  metrics: [
    { title: "指標1", value: "1,234", unit: "人" },
    { title: "指標2", value: "56.7", unit: "%" },
    { title: "指標3", value: "890", unit: "件" },
  ],
  chartData: [
    { year: "2020", value: 100 },
    { year: "2021", value: 120 },
    { year: "2022", value: 150 },
    { year: "2023", value: 180 },
  ],
};

export const ExpenditurePrefectureDashboard: React.FC<{ areaCode: string }> = ({
  areaCode,
}) => {
  return (
    <div className="px-4 pt-4">
      {/* メトリックカード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {mockData.metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">{metric.unit}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* チャートエリア（後でshadcn/ui chartsを使用） */}
      <Card>
        <CardHeader>
          <CardTitle>データ推移</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            チャート表示エリア（後で実装）
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
