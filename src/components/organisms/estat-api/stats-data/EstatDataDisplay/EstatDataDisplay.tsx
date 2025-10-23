"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/atoms/ui/tabs";
import { EstatStatsDataResponse } from "@/lib/estat-api";
import { AlertTriangle, BarChart3, Database, Info } from "lucide-react";
import { useState } from "react";
import { EstatCategoriesTable } from "../EstatCategoriesTable";
import { EstatOverview } from "../EstatOverview";
import { EstatRawData } from "../EstatRawData";
import { EstatValuesTable } from "../EstatValuesTable";
import { EstatYearsTable } from "../EstatYearsTable";

interface EstatDataDisplayProps {
  data: EstatStatsDataResponse | null;
  loading: boolean;
  error: string | null;
}

function EstatDataDisplay({ data, loading, error }: EstatDataDisplayProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "categories" | "years" | "values" | "raw"
  >("overview");

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-xs dark:bg-neutral-800 dark:border-neutral-700">
        <div className="p-8 text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-indigo-600 rounded-full"></div>
          <p className="mt-4 text-gray-600 dark:text-neutral-400">
            データを取得中...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-lg shadow-xs dark:bg-neutral-800 dark:border-red-700">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <div>
              <h3 className="font-medium text-red-800 dark:text-red-200">
                データ取得エラー
              </h3>
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-xs dark:bg-neutral-800 dark:border-neutral-700">
        <div className="p-8 text-center">
          <Database className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100 mb-2">
            データ取得前
          </h3>
          <p className="text-gray-600 dark:text-neutral-400">
            上のフォームからパラメータを入力してデータを取得してください
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* タブナビゲーション */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList className="w-full justify-start px-4">
          <TabsTrigger value="overview" className="gap-2">
            <Info className="h-4 w-4" />
            概要
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            カテゴリ
          </TabsTrigger>
          <TabsTrigger value="years" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            年度
          </TabsTrigger>
          <TabsTrigger value="values" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            値
          </TabsTrigger>
          <TabsTrigger value="raw" className="gap-2">
            <Database className="h-4 w-4" />
            Raw JSON
          </TabsTrigger>
        </TabsList>

        {/* タブコンテンツ */}
        <TabsContent value="overview" className="p-4">
          <EstatOverview data={data} />
        </TabsContent>
        <TabsContent value="categories" className="p-4">
          <EstatCategoriesTable data={data} />
        </TabsContent>
        <TabsContent value="years" className="p-4">
          <EstatYearsTable data={data} />
        </TabsContent>
        <TabsContent value="values" className="p-4">
          <EstatValuesTable data={data} />
        </TabsContent>
        <TabsContent value="raw" className="p-4">
          <EstatRawData data={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EstatDataDisplay;
