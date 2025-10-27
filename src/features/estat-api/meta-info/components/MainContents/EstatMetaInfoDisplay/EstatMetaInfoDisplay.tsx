"use client";

import { useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  Calendar,
  Code,
  FileText,
  Info,
  MapPin,
  RefreshCw,
  Save,
  Tag,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/atoms/ui/alert";
import { Button } from "@/components/atoms/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/atoms/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/atoms/ui/tabs";
import { JsonDisplay } from "@/components/molecules/JsonDisplay";



import { useMetaInfoDownload, useMetaInfoSave } from "../../../hooks";
import { parseCompleteMetaInfo } from "../../../services/formatter";
import { EstatMetaInfoResponse } from "../../../types";

import AreasTab from "./tabs/AreasTab";
import CategoriesTab from "./tabs/CategoriesTab";
import TableInfoTab from "./tabs/TableInfoTab";
import TimeAxisTab from "./tabs/TimeAxisTab";

/**
 * EstatMetaInfoDisplayProps - e-Statメタ情報表示コンポーネントのプロパティ
 */
interface EstatMetaInfoDisplayProps {
  /** メタ情報データ */
  metaInfo: EstatMetaInfoResponse | null;
  /** 統計表ID */
  statsId: string | null;
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
 * - URL paramsからstatsIdを自動取得
 * - e-Statメタ情報の取得と表示
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
 * <EstatMetaInfoDisplay />
 * ```
 */
export default function EstatMetaInfoDisplay({
  metaInfo,
  statsId,
  error: serverError,
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
    if (!metaInfo || !statsId) return null;
    try {
      return parseCompleteMetaInfo(metaInfo);
    } catch (error) {
      console.error("メタ情報の解析に失敗しました:", error);
      return null;
    }
  }, [metaInfo, statsId]);

  // ===== エフェクト =====
  /**
   * メタ情報が変更されたらタブをリセット
   * 新しいメタ情報が読み込まれた際に、デフォルトの統計表情報タブに戻す
   */
  useEffect(() => {
    setActiveTab("table");
  }, [metaInfo]);

  // ===== レンダリング条件分岐 =====

  /**
   * statsId未指定時の表示
   */
  if (!statsId) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        <p>統計表IDを入力してメタ情報を取得してください</p>
      </div>
    );
  }

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

  /**
   * エラー状態の表示
   */
  if (serverError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{serverError}</AlertDescription>
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
            <h2 className="text-lg font-semibold">
              {parsedData.tableInfo.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {parsedData.tableInfo.statName} •{" "}
              {parsedData.tableInfo.organization}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              size="icon"
              variant="outline"
            >
              <Save className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* ===== タブナビゲーション ===== */}
      {/* 統計表情報、分類、地域、時間軸、JSONレスポンスのタブ切り替え */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabType)}
      >
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
        <Alert
          variant={saveResult.success ? "default" : "destructive"}
          className="mt-4"
        >
          <AlertDescription className="flex items-center justify-between">
            <span>{saveResult.message}</span>
            {saveResult.success && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.reload()}
              >
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
