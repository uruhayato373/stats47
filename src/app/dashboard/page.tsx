"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { EstatDataFetcher } from "@/components/EstatDataFetcher";
import { StatisticsDisplay } from "@/components/StatisticsDisplay";
import { RegionSelector } from "@/components/RegionSelector";

export default function DashboardPage() {
  const [selectedRegion, setSelectedRegion] = useState("13"); // 東京都
  const [statisticsData, setStatisticsData] = useState(null);
  const [loading, setLoading] = useState(false);

  const regions = [
    { code: "13", name: "東京都" },
    { code: "27", name: "大阪府" },
    { code: "23", name: "愛知県" },
    { code: "14", name: "神奈川県" },
    { code: "11", name: "埼玉県" },
    { code: "12", name: "千葉県" },
    { code: "28", name: "兵庫県" },
    { code: "15", name: "新潟県" },
    { code: "16", name: "富山県" },
    { code: "17", name: "石川県" },
  ];

  const handleRegionChange = useCallback((regionCode: string) => {
    setSelectedRegion(regionCode);
  }, []);

  const handleDataUpdate = useCallback((data: any) => {
    setStatisticsData(data);
  }, []);

  const handleLoadingChange = useCallback((loadingState: boolean) => {
    setLoading(loadingState);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            地域統計ダッシュボード
          </h1>
          <p className="text-gray-600">
            e-Stat APIから取得した地域統計データを可視化します
          </p>
        </div>

        {/* 地域選択 */}
        <div className="mb-6">
          <RegionSelector
            regions={regions}
            selectedRegion={selectedRegion}
            onRegionChange={handleRegionChange}
          />
        </div>

        {/* データ取得コンポーネント */}
        <div className="mb-6">
          <EstatDataFetcher
            regionCode={selectedRegion}
            onDataUpdate={handleDataUpdate}
            onLoadingChange={handleLoadingChange}
          />
        </div>

        {/* 統計データ表示 */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">データを取得中...</p>
          </div>
        )}

        {statisticsData && !loading && (
          <StatisticsDisplay
            data={statisticsData}
            regionName={regions.find((r) => r.code === selectedRegion)?.name}
          />
        )}

        {/* データが取得できない場合のメッセージ */}
        {!statisticsData && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-600">
              地域を選択してデータを取得してください
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
