"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Code, Tag, FileText, MapPin, Calendar } from "lucide-react";
import { EstatMetaInfoResponse } from "@/lib/estat-api";
import { EstatMetaInfoFormatter } from "@/lib/estat-api/meta-info/formatter";
import { JsonDisplay } from "@/components/molecules/JsonDisplay";
import { SaveButton } from "@/components/atoms/SaveButton";
import {
  TabNavigation,
  type TabItem,
} from "@/components/molecules/TabNavigation";
import {
  useMetaInfoSave,
  useMetaInfoDownload,
} from "@/hooks/estat-api/meta-info";
import TableInfoTab from "./TableInfoTab";
import CategoriesTab from "./CategoriesTab";
import AreasTab from "./AreasTab";
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
   * エラー状態の表示
   * エラーメッセージを赤色のアラートボックスで表示
   */
  if (error) {
    return (
      <div className="p-4 border rounded-lg bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200">
        <div className="flex items-center">
          <svg
            className="w-4 h-4 text-red-600 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-red-800 font-medium">エラー</h3>
        </div>
        <p className="text-red-700 mt-1">{error}</p>
      </div>
    );
  }

  /**
   * メタ情報が存在しない場合
   * 何も表示しない（nullを返す）
   */
  if (!metaInfo || !parsedData) {
    return null;
  }

  // ===== タブ設定 =====
  /**
   * タブ設定配列
   * 各タブは対応するデータが存在する場合のみ表示
   * JSONタブは常に表示
   */
  const tabs: TabItem[] = [
    {
      id: "table",
      label: "統計表情報",
      icon: FileText,
      count: 1,
    },
    {
      id: "categories",
      label: "分類",
      icon: Tag,
      count: parsedData.dimensions.categories.length,
    },
    {
      id: "areas",
      label: "地域",
      icon: MapPin,
      count: parsedData.dimensions.areas.length,
    },
    {
      id: "time",
      label: "時間軸",
      icon: Calendar,
      count: parsedData.dimensions.timeAxis.availableYears.length,
    },
    {
      id: "json",
      label: "JSON レスポンス",
      icon: Code,
      count: 0,
    },
  ].filter((tab) => tab.count > 0 || tab.id === "json");

  // ===== メインコンテンツのレンダリング =====
  return (
    <div className="space-y-6">
      {/* ===== ヘッダーセクション ===== */}
      {/* 統計表IDとタイトル、保存ボタンを表示 */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between border-b border-gray-200 pb-4">
        {/* 統計表基本情報 */}
        <div className="flex-1">
          <div className="space-y-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              統計表ID: {parsedData.tableInfo.id}
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {parsedData.tableInfo.title}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {parsedData.tableInfo.statName} •{" "}
              {parsedData.tableInfo.organization}
            </div>
          </div>
        </div>

        {/* 保存ボタン */}
        <SaveButton
          onSave={handleSave}
          saving={saving}
          saveResult={saveResult}
        />
      </div>

      {/* ===== タブナビゲーション ===== */}
      {/* 統計表情報、分類、地域、時間軸、JSONレスポンスのタブ切り替え */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as TabType)}
      />

      {/* ===== タブコンテンツエリア ===== */}
      <div className="mt-6">
        {/* 統計表情報タブのコンテンツ */}
        {activeTab === "table" && (
          <TableInfoTab tableInfo={parsedData.tableInfo} />
        )}

        {/* 分類タブのコンテンツ */}
        {activeTab === "categories" && (
          <CategoriesTab categories={parsedData.dimensions.categories} />
        )}

        {/* 地域タブのコンテンツ */}
        {activeTab === "areas" && (
          <AreasTab areas={parsedData.dimensions.areas} />
        )}

        {/* 時間軸タブのコンテンツ */}
        {activeTab === "time" && (
          <TimeAxisTab timeAxis={parsedData.dimensions.timeAxis} />
        )}

        {/* JSONレスポンスタブのコンテンツ */}
        {activeTab === "json" && (
          <JsonDisplay data={metaInfo} onDownload={handleDownload} />
        )}
      </div>
    </div>
  );
}
