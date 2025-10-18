"use client";

import React, { useState, useEffect } from "react";
import { Code, Tag } from "lucide-react";
import { EstatMetaInfoResponse } from "@/lib/estat-api";
import { JsonDisplay } from "@/components/molecules/JsonDisplay";
import { EstatUnifiedClassificationTabs } from "@/components/organisms/estat-api/EstatUnifiedClassificationTabs";
import { SaveButton } from "@/components/atoms/SaveButton";
import {
  TabNavigation,
  type TabItem,
} from "@/components/molecules/TabNavigation";
import { safeRender } from "@/lib/estat-api/meta-info";
import {
  useMetaInfoSave,
  useMetaInfoDownload,
} from "@/hooks/estat-api/meta-info";

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
type TabType = "category" | "json";

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
  const [activeTab, setActiveTab] = useState<TabType>("category");

  // ===== カスタムフック =====
  /** メタ情報保存機能 */
  const { save, saving, saveResult } = useMetaInfoSave();
  /** メタ情報ダウンロード機能 */
  const { download } = useMetaInfoDownload();

  // ===== エフェクト =====
  /**
   * メタ情報が変更されたらタブをリセット
   * 新しいメタ情報が読み込まれた際に、デフォルトのカテゴリタブに戻す
   */
  useEffect(() => {
    setActiveTab("category");
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
  if (!metaInfo) {
    return null;
  }

  // ===== データ抽出 =====
  /** e-Statメタ情報のメインデータ */
  const { GET_META_INFO } = metaInfo;
  /** 統計表情報と分類情報 */
  const { TABLE_INF, CLASS_INF } = GET_META_INFO.METADATA_INF;
  /** メタ情報ID（統計表ID） */
  const metaInfoId = TABLE_INF?.["@id"];

  // ===== タブ設定 =====
  /**
   * 指定されたタブIDのカテゴリ数を取得
   * @param tabId - タブID（例: "cat01"）
   * @returns カテゴリ数
   */
  const getTabCount = (tabId: string) => {
    const classObj = CLASS_INF?.CLASS_OBJ?.find((obj) => obj["@id"] === tabId);
    if (!classObj?.CLASS) return 0;
    return Array.isArray(classObj.CLASS) ? classObj.CLASS.length : 1;
  };

  /**
   * タブ設定配列
   * カテゴリタブは分類データが存在する場合のみ表示
   * JSONタブは常に表示
   */
  const tabs: TabItem[] = [
    {
      id: "category",
      label: "カテゴリ",
      icon: Tag,
      count: getTabCount("cat01"),
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
      {/* 統計表基本情報と保存ボタンを表示 */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between border-b border-gray-200 pb-4">
        {/* 統計情報をグリッドレイアウトで表示 */}
        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {[
              {
                label: "統計表題名",
                value: safeRender(
                  metaInfo.GET_META_INFO.METADATA_INF.TABLE_INF.TITLE
                ),
              },
              {
                label: "政府統計名",
                value: safeRender(
                  metaInfo.GET_META_INFO.METADATA_INF.TABLE_INF.STAT_NAME
                ),
              },
              {
                label: "作成機関",
                value: safeRender(
                  metaInfo.GET_META_INFO.METADATA_INF.TABLE_INF.GOV_ORG
                ),
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-3"
              >
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {item.label}
                </div>
                <div className="text-sm text-gray-900 dark:text-gray-100 truncate">
                  {item.value || "-"}
                </div>
              </div>
            ))}
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
      {/* カテゴリ分類とJSONレスポンスのタブ切り替え */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as TabType)}
      />

      {/* ===== タブコンテンツエリア ===== */}
      <div className="mt-6">
        {/* カテゴリ分類タブのコンテンツ */}
        {activeTab === "category" &&
          CLASS_INF &&
          CLASS_INF.CLASS_OBJ &&
          CLASS_INF.CLASS_OBJ.length > 0 && (
            <EstatUnifiedClassificationTabs
              classObjs={CLASS_INF.CLASS_OBJ}
              metaInfoId={metaInfoId}
            />
          )}

        {/* JSONレスポンスタブのコンテンツ */}
        {activeTab === "json" && (
          <JsonDisplay data={metaInfo} onDownload={handleDownload} />
        )}
      </div>
    </div>
  );
}
