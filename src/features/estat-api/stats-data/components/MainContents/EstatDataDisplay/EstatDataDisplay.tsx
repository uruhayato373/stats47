"use client";

import { useState } from "react";

import { AlertTriangle, BarChart3, Database, Info } from "lucide-react";

import { Alert, AlertDescription } from "@/components/atoms/ui/alert";
import { Skeleton } from "@/components/atoms/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/atoms/ui/tabs";

import type { EstatStatsDataResponse } from "@/features/estat-api/stats-data/types";

import EstatCategoriesTable from "./components/EstatCategoriesTable";
import EstatOverview from "./components/EstatOverview";
import EstatRawData from "./components/EstatRawData";
import EstatValuesTable from "./components/EstatValuesTable";
import EstatYearsTable from "./components/EstatYearsTable";

interface EstatDataDisplayProps {
  data: EstatStatsDataResponse | null;
  loading: boolean;
  error: string | null;
}

export default function EstatDataDisplay({
  data,
  loading,
  error,
}: EstatDataDisplayProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "categories" | "years" | "values" | "raw"
  >("overview");

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="text-center text-muted-foreground">
          データを取得中...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>データ取得エラー:</strong> {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-sm">
        <div className="p-8 text-center">
          <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            データ取得前
          </h3>
          <p className="text-muted-foreground">
            上のフォームからパラメータを入力してデータを取得してください
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* タブナビゲーション */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as typeof activeTab)}
      >
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
            <BarChart3 className="h-4 w-4" />値
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
