"use client";

import React, { useState, useEffect } from "react";
import { Save, AlertCircle, Code, Database, CheckCircle } from "lucide-react";
import { EstatMetaInfoResponse } from "@/lib/estat/types";
import { useStyles } from "@/hooks/useStyles";
import ClassificationTabs from "./ClassificationTabs";
import JsonDisplay from "./JsonDisplay";

interface EstatMetaInfoDisplayProps {
  metaInfo: EstatMetaInfoResponse | null;
  loading?: boolean;
  error?: string | null;
}

// 安全にレンダリングするためのヘルパー関数
function safeRender(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number") {
    return value.toString();
  }
  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    // オブジェクトの場合は、$プロパティがあればそれを表示
    if ("$" in obj && typeof obj.$ === "string") {
      return obj.$;
    }
    // @noプロパティがあればそれを表示
    if ("@no" in obj && typeof obj["@no"] === "string") {
      return obj["@no"];
    }
    // その他の場合は、JSON.stringifyで表示
    return JSON.stringify(value);
  }
  return String(value);
}

export default function EstatMetaInfoDisplay({
  metaInfo,
  loading,
  error,
}: EstatMetaInfoDisplayProps) {
  const styles = useStyles();
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [activeMainTab, setActiveMainTab] = useState(0);

  // メタ情報が変更されたらタブをリセット
  useEffect(() => {
    setActiveMainTab(0);
    setSaveResult(null);
  }, [metaInfo]);

  const handleSave = async () => {
    if (!metaInfo) return;

    setSaving(true);
    setSaveResult(null);

    try {
      // 統計表IDを抽出
      const statsDataId =
        metaInfo.GET_META_INFO?.METADATA_INF?.TABLE_INF?.["@id"];

      if (!statsDataId) {
        throw new Error("統計表IDが見つかりません");
      }

      const response = await fetch("/api/estat/metainfo/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ statsDataId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const result = (await response.json()) as { message?: string };
      setSaveResult({
        success: true,
        message: result.message || "メタ情報を正常に保存しました",
      });
    } catch (err) {
      console.error("Save error:", err);
      setSaveResult({
        success: false,
        message: err instanceof Error ? err.message : "保存に失敗しました",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!metaInfo) return;

    try {
      // 統計表IDを抽出
      const statsDataId =
        metaInfo.GET_META_INFO?.METADATA_INF?.TABLE_INF?.["@id"];

      if (!statsDataId) {
        throw new Error("統計表IDが見つかりません");
      }

      // ファイル名を生成（統計表ID + 日時）
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `estat-metainfo-${statsDataId}-${timestamp}.json`;

      // JSONデータを準備
      const jsonData = {
        statsDataId,
        downloadedAt: new Date().toISOString(),
        metaInfo: metaInfo,
      };

      // Blobを作成してダウンロード
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      alert(
        "ダウンロードに失敗しました: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    }
  };

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

  if (error) {
    return (
      <div className={styles.message.error}>
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

  if (!metaInfo) {
    return null;
  }

  const { GET_META_INFO } = metaInfo;
  const { TABLE_INF, CLASS_INF } = GET_META_INFO.METADATA_INF;

  // メタ情報の一意IDを生成（統計表IDを使用）
  const metaInfoId = TABLE_INF?.["@id"];

  return (
    <div className="space-y-6">
      {/* 保存ボタンとステータス */}
      {metaInfo && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-gray-200 pb-4">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">
              メタ情報詳細
            </h2>
            <p className="text-sm text-gray-600 dark:text-neutral-400">
              データを確認後、データベースに保存できます
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Save className={`w-4 h-4 ${saving ? "animate-pulse" : ""}`} />
                {saving ? "保存中..." : "データベースに保存"}
              </button>
            </div>

            {saveResult && (
              <div
                className={`flex items-center gap-2 text-sm px-3 py-2 rounded ${
                  saveResult.success
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {saveResult.success ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                {saveResult.message}
              </div>
            )}
          </div>
        </div>
      )}

      {/* メインタブナビゲーション */}
      <div className="border-b border-gray-200 dark:border-neutral-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveMainTab(0)}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeMainTab === 0
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Database className="w-4 h-4" />
            基本情報・分類
          </button>
          <button
            onClick={() => setActiveMainTab(1)}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeMainTab === 1
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Code className="w-4 h-4" />
            JSON レスポンス
          </button>
        </nav>
      </div>

      {/* タブコンテンツ */}
      <div className="mt-6">
        {activeMainTab === 0 && (
          <div className="space-y-6">
            {/* 統計表基本情報 - コンパクトなテキスト表示 */}
            <div>
              <h3 className={styles.heading.md}>統計表基本情報</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
                  <tbody className="bg-white dark:bg-neutral-800 divide-y divide-gray-200 dark:divide-neutral-700">
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-neutral-200 bg-gray-50 dark:bg-neutral-700 w-32">
                        統計表題名
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 dark:text-neutral-100">
                        {safeRender(TABLE_INF.TITLE)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-neutral-200 bg-gray-50 dark:bg-neutral-700 w-32">
                        政府統計名
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 dark:text-neutral-100">
                        {safeRender(TABLE_INF.STAT_NAME)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-neutral-200 bg-gray-50 dark:bg-neutral-700 w-32">
                        作成機関
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 dark:text-neutral-100">
                        {safeRender(TABLE_INF.GOV_ORG)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-neutral-200 bg-gray-50 dark:bg-neutral-700 w-32">
                        調査年月
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 dark:text-neutral-100">
                        {safeRender(TABLE_INF.SURVEY_DATE)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-neutral-200 bg-gray-50 dark:bg-neutral-700 w-32">
                        公開日
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 dark:text-neutral-100">
                        {safeRender(TABLE_INF.OPEN_DATE)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-neutral-200 bg-gray-50 dark:bg-neutral-700 w-32">
                        更新日
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 dark:text-neutral-100">
                        {safeRender(TABLE_INF.UPDATED_DATE)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 分類情報 */}
            {CLASS_INF &&
              CLASS_INF.CLASS_OBJ &&
              CLASS_INF.CLASS_OBJ.length > 0 && (
                <div>
                  <h3 className={styles.heading.md}>分類情報</h3>
                  <ClassificationTabs
                    classObjs={CLASS_INF.CLASS_OBJ}
                    metaInfoId={metaInfoId}
                  />
                </div>
              )}
          </div>
        )}

        {activeMainTab === 1 && (
          <JsonDisplay data={metaInfo} onDownload={handleDownload} />
        )}
      </div>
    </div>
  );
}
