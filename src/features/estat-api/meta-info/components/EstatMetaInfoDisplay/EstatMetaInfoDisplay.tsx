"use client";

import { useEffect, useMemo, useState } from "react";

import { AlertCircle, Code, FileText, Info, Layers, Save } from "lucide-react";

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

import type { MetaInfoSource } from "@/features/estat-api/meta-info";

import { useMetaInfoDownload, useMetaInfoSave } from "../../hooks";
import { parseCompleteMetaInfo } from "../../services/formatter";
import { EstatMetaInfoResponse } from "../../types";
import { EstatMetaInfoFetcher } from "../EstatMetaInfoFetcher";

import DimensionsTab from "./tabs/DimensionsTab";
import TableInfoTab from "./tabs/TableInfoTab";

interface EstatMetaInfoDisplayProps {
  /** メタ情報データ */
  metaInfo: EstatMetaInfoResponse | null;
  /** 統計表ID */
  statsId: string | null;
  /** データ取得元（'r2': R2ストレージ, 'api': e-Stat API） */
  dataSource?: MetaInfoSource | null;
  /** エラーメッセージ */
  error?: string | null;
}

type TabType = "basic" | "dimensions" | "json";

/**
 * e-Statメタ情報表示コンポーネント
 *
 * 機能:
 * - e-Statメタ情報の表示
 * - 統計表基本情報の表示（タイトル、政府統計名、作成機関）
 * - 次元情報（分類、地域、時間軸）の表示
 * - JSONレスポンスの表示
 * - メタ情報の保存とダウンロード機能
 * - エラーハンドリング
 *
 * レイアウト構成:
 * - ヘッダー: 統計表基本情報 + 保存ボタン
 * - タブナビゲーション: 基本情報 / 次元 / JSON
 * - コンテンツエリア: タブに応じた内容表示
 *
 * 使用例:
 * ```tsx
 * <EstatMetaInfoDisplay
 *   metaInfo={metaInfo}
 *   statsId="0000010101"
 *   dataSource="r2"
 * />
 * ```
 */
export default function EstatMetaInfoDisplay({
  metaInfo,
  statsId,
  dataSource,
  error: serverError,
}: EstatMetaInfoDisplayProps) {
  const [activeTab, setActiveTab] = useState<TabType>("basic");

  const { save, saving } = useMetaInfoSave();
  const { download } = useMetaInfoDownload();

  const parsedData = useMemo(() => {
    if (!metaInfo || !statsId) return null;
    try {
      return parseCompleteMetaInfo(metaInfo);
    } catch (error) {
      console.error("メタ情報の解析に失敗しました:", error);
      return null;
    }
  }, [metaInfo, statsId]);

  /**
   * メタ情報が変更されたらタブをリセット
   *
   * 新しいメタ情報が読み込まれた際に、デフォルトの基本情報タブに戻します。
   */
  useEffect(() => {
    setActiveTab("basic");
  }, [metaInfo]);

  if (!statsId) {
    return (
      <div className="space-y-6">
        <div className="p-8 text-center text-muted-foreground">
          <p className="mb-6">統計表IDを入力してメタ情報を取得してください</p>
          <div className="max-w-md mx-auto">
            <EstatMetaInfoFetcher
              clearOnSuccess={false}
              statsId={statsId}
              dataSource={dataSource}
            />
          </div>
        </div>
      </div>
    );
  }

  /**
   * メタ情報を保存
   */
  const handleSave = () => {
    if (metaInfo) {
      save(metaInfo);
    }
  };

  /**
   * メタ情報をJSONファイルとしてダウンロード
   */
  const handleDownload = () => {
    if (metaInfo) {
      download(metaInfo);
    }
  };

  if (serverError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{serverError}</AlertDescription>
      </Alert>
    );
  }

  if (!metaInfo || !parsedData) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>メタ情報が見つかりませんでした</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="max-w-md">
        <EstatMetaInfoFetcher
          clearOnSuccess={false}
          statsId={statsId}
          dataSource={dataSource}
        />
      </div>

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

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabType)}
      >
        <TabsList className="w-full justify-start">
          <TabsTrigger value="basic" className="gap-2">
            <FileText className="h-4 w-4" />
            基本情報
          </TabsTrigger>
          <TabsTrigger value="dimensions" className="gap-2">
            <Layers className="h-4 w-4" />
            次元
          </TabsTrigger>
          <TabsTrigger value="json" className="gap-2">
            <Code className="h-4 w-4" />
            JSON
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <TableInfoTab tableInfo={parsedData.tableInfo} />
        </TabsContent>
        <TabsContent value="dimensions">
          <DimensionsTab
            categories={parsedData.dimensions.categories}
            areas={parsedData.dimensions.areas}
            timeAxis={parsedData.dimensions.timeAxis}
          />
        </TabsContent>
        <TabsContent value="json">
          <JsonDisplay data={metaInfo} onDownload={handleDownload} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
