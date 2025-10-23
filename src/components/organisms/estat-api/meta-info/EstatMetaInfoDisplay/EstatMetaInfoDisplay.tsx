"use client";

import { Alert, AlertDescription } from "@/components/atoms/ui/alert";
import { Button } from "@/components/atoms/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/atoms/ui/card";
import { Skeleton } from "@/components/atoms/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/atoms/ui/tabs";
import { JsonDisplay } from "@/components/molecules/JsonDisplay";
import {
  useMetaInfoDownload,
  useMetaInfoSave,
} from "@/hooks/estat-api/meta-info";
import { EstatMetaInfoResponse } from "@/lib/estat-api";
import { EstatMetaInfoFormatter } from "@/lib/estat-api/meta-info/formatter";
import { AlertCircle, Calendar, Code, FileText, Info, MapPin, RefreshCw, Save, Tag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AreasTab from "./AreasTab";
import CategoriesTab from "./CategoriesTab";
import TableInfoTab from "./TableInfoTab";
import TimeAxisTab from "./TimeAxisTab";

/**
 * EstatMetaInfoDisplayProps - e-Statメタ情報表示コンポーネントのプロパティ
 */
interface EstatMetaInfoDisplayProps {
  /** e-Statメタ情報レスポンスデータ */
  metaInfo: EstatMetaInfoResponse | null;
  /** ローディング状態 */
  loading?: boolean;
  /** エラーメッセージ */
  error?: string | null;
}

/**
 * TabType - タブの種類
 */
type TabType = "table" | "categories" | "areas" | "time" | "json";

/**
 * EstatMetaInfoDisplay - e-Statメタ情報表示コンポーネント
 *
 * 機能:
 * - e-Statメタ情報の表示と管理
 * - 統計表基本情報の表示（タイトル、政府統計名、作成機関）
 * - カテゴリ分類とJSONレスポンスのタブ表示
 * - メタ情報の保存とダウンロード機能
 * - ローディング状態とエラーハンドリング
 *
 * レイアウト構成:
 * - ヘッダー: 統計表基本情報 + 保存ボタン
 * - タブナビゲーション: カテゴリ分類 / JSONレスポンス
 * - コンテンツエリア: タブに応じた内容表示
 *
 * 使用例:
 * ```tsx
 * <EstatMetaInfoDisplay
 *   metaInfo={metaInfoData}
 *   loading={isLoading}
 *   error={errorMessage}
 * />
 * ```
 */
export default function EstatMetaInfoDisplay({
  metaInfo,
  loading,
  error,
}: EstatMetaInfoDisplayProps) {
  // ===== 状態管理 =====
  /** アクティブなタブ */
  const [activeTab, setActiveTab] = useState<TabType>("table");

  // ===== カスタムフック =====
  /** メタ情報保存機能 */
  const { save, saving, saveResult } = useMetaInfoSave();
  /** メタ情報ダウンロード機能 */
  const { download } = useMetaInfoDownload();

  // ===== データ処理 =====
  /** フォーマット済みメタ情報 */
  const parsedData = useMemo(() => {
    if (!metaInfo) return null;
    try {
      return EstatMetaInfoFormatter.parseCompleteMetaInfo(metaInfo);
    } catch (error) {
      console.error("メタ情報の解析に失敗しました:", error);
      return null;
    }
  }, [metaInfo]);

  // ===== エフェクト =====
  /**
   * メタ情報が変更されたらタブをリセット
   * 新しいメタ情報が読み込まれた際に、デフォルトの統計表情報タブに戻す
   */
  useEffect(() => {
    setActiveTab("table");
  }, [metaInfo]);

  // ===== イベントハンドラー =====
  /**
   * メタ情報保存ハンドラー
   * 現在のメタ情報を保存する
   */
  const handleSave = () => {
    if (metaInfo) {
      save(metaInfo);
    }
  };

  /**
   * メタ情報ダウンロードハンドラー
   * 現在のメタ情報をJSONファイルとしてダウンロードする
   */
  const handleDownload = () => {
    if (metaInfo) {
      download(metaInfo);
    }
  };

  // ===== レンダリング条件分岐 =====

  /**
   * ローディング状態の表示
   * スケルトンローダーでコンテンツの読み込み中を表現
   */
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-3"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-300 rounded w-full"></div>
            <div className="h-3 bg-gray-300 rounded w-5/6"></div>
            <div className="h-3 bg-gray-300 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * ローディング状態の表示
   */
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    );
  }

  /**
   * エラー状態の表示
   */
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  /**
   * メタ情報が存在しない場合
   */
  if (!metaInfo || !parsedData) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>メタ情報が見つかりませんでした</AlertDescription>
      </Alert>
    );
  }

  // ===== メインコンテンツのレンダリング =====
  return (
    <div className="space-y-6">
      {/* ===== ヘッダーセクション ===== */}
      {/* 統計表IDとタイトル、保存ボタンを表示 */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="space-y-1.5">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              統計表ID: {parsedData.tableInfo.id}
            </CardTitle>
            <h2 className="text-lg font-semibold">{parsedData.tableInfo.title}</h2>
            <p className="text-sm text-muted-foreground">
              {parsedData.tableInfo.statName} • {parsedData.tableInfo.organization}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} size="icon" variant="outline">
              <Save className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* ===== タブナビゲーション ===== */}
      {/* 統計表情報、分類、地域、時間軸、JSONレスポンスのタブ切り替え */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="table" className="gap-2">
            <FileText className="h-4 w-4" />
            統計表情報
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <Tag className="h-4 w-4" />
            分類
          </TabsTrigger>
          <TabsTrigger value="areas" className="gap-2">
            <MapPin className="h-4 w-4" />
            地域
          </TabsTrigger>
          <TabsTrigger value="time" className="gap-2">
            <Calendar className="h-4 w-4" />
            時間軸
          </TabsTrigger>
          <TabsTrigger value="json" className="gap-2">
            <Code className="h-4 w-4" />
            JSON
          </TabsTrigger>
        </TabsList>

        {/* ===== タブコンテンツエリア ===== */}
        <TabsContent value="table">
          <TableInfoTab tableInfo={parsedData.tableInfo} />
        </TabsContent>
        <TabsContent value="categories">
          <CategoriesTab categories={parsedData.dimensions.categories} />
        </TabsContent>
        <TabsContent value="areas">
          <AreasTab areas={parsedData.dimensions.areas} />
        </TabsContent>
        <TabsContent value="time">
          <TimeAxisTab timeAxis={parsedData.dimensions.timeAxis} />
        </TabsContent>
        <TabsContent value="json">
          <JsonDisplay data={metaInfo} onDownload={handleDownload} />
        </TabsContent>
      </Tabs>

      {/* 保存結果の表示 */}
      {saveResult && (
        <Alert variant={saveResult.success ? "default" : "destructive"} className="mt-4">
          <AlertDescription className="flex items-center justify-between">
            <span>{saveResult.message}</span>
            {saveResult.success && (
              <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
                <RefreshCw className="h-3 w-3 mr-1" />
                更新
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
