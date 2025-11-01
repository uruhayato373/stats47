"use client";

import { useEffect, useState } from "react";

import { AlertTriangle, BarChart3, Database, Info } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/atoms/ui/alert";
import { Skeleton } from "@/components/atoms/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/atoms/ui/tabs";
import { JsonDisplay } from "@/components/molecules/JsonDisplay";

import type { StatsDataSource } from "@/features/estat-api/stats-data/services/fetcher";
import type { EstatStatsDataResponse } from "@/features/estat-api/stats-data/types";

import { EstatStatsDataFetcher } from "../EstatStatsDataFetcher";

import EstatOverview from "./tabs/EstatOverview";
import EstatValuesTable from "./tabs/EstatValuesTable";

interface EstatDataDisplayProps {
  data: EstatStatsDataResponse | null;
  loading: boolean;
  error: string | null;
  /** データ取得元（'r2': R2ストレージ, 'api': e-Stat API） */
  dataSource?: StatsDataSource | null;
}

export default function EstatDataDisplay({
  data,
  loading,
  error,
  dataSource,
}: EstatDataDisplayProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "values" | "raw">(
    "overview"
  );

  // デバッグログ: コンポーネントの状態を確認
  console.log("[EstatDataDisplay] コンポーネント状態:", {
    hasData: !!data,
    data: data ? { hasGetStatsData: !!data.GET_STATS_DATA } : null,
    loading,
    error,
  });

  /**
   * データ取得元のtoast通知を表示
   */
  useEffect(() => {
    if (data && dataSource) {
      if (dataSource === "r2") {
        toast.success("データ取得完了", {
          description: "R2ストレージから取得しました",
          duration: 3000,
        });
      } else {
        toast.info("データ取得完了", {
          description: "e-Stat APIから取得しました",
          duration: 3000,
        });
      }
    }
  }, [data, dataSource]);

  /**
   * データダウンロードハンドラー
   * 現在のデータをJSONファイルとしてダウンロードする
   */
  const handleDownload = () => {
    if (!data) return;

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `estat-data-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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

  if (!data) {
    return (
      <div className="space-y-6">
        <EstatStatsDataFetcher />
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>データ取得エラー:</strong> {error}
            </AlertDescription>
          </Alert>
        )}
        <div className="bg-card border border-border rounded-lg shadow-sm">
          <div className="p-8 text-center">
            <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              データ取得前
            </h3>
            <p className="text-muted-foreground">
              {error
                ? "エラーが発生しました。パラメータを確認して再試行してください"
                : "上のフォームからパラメータを入力してデータを取得してください"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EstatStatsDataFetcher />
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>データ取得エラー:</strong> {error}
          </AlertDescription>
        </Alert>
      )}
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
            {data ? (
              <EstatOverview data={data} />
            ) : (
              <div>データがありません</div>
            )}
          </TabsContent>
          <TabsContent value="values" className="p-4">
            {data ? (
              <EstatValuesTable data={data} />
            ) : (
              <div>データがありません</div>
            )}
          </TabsContent>
          <TabsContent value="raw" className="p-4">
            {data ? (
              <JsonDisplay data={data} onDownload={handleDownload} />
            ) : (
              <div>データがありません</div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
