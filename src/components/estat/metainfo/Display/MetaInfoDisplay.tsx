"use client";

import React, { useState, useEffect } from "react";
import { Code, Database } from "lucide-react";
import { EstatMetaInfoResponse } from "@/lib/estat/types";
import { useStyles } from "@/hooks/useStyles";
import ClassificationTabs from "./components/ClassificationTabs";
import JsonDisplay from "./components/JsonDisplay";
import AreaTimeSelectors from "./components/AreaTimeSelectors";
import MetaInfoHeader from "./components/MetaInfoHeader";

interface EstatMetaInfoDisplayProps {
  metaInfo: EstatMetaInfoResponse | null;
  loading?: boolean;
  error?: string | null;
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

    console.log("🔵 保存開始");
    setSaving(true);
    setSaveResult(null);

    // タイムアウト設定（60秒）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const statsDataId =
        metaInfo.GET_META_INFO?.METADATA_INF?.TABLE_INF?.["@id"];

      if (!statsDataId) {
        throw new Error("統計表IDが見つかりません");
      }

      console.log("🔵 API呼び出し開始:", statsDataId);

      const response = await fetch("/api/estat/metainfo/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ statsDataId }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log("🔵 API応答受信:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ APIエラー:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = (await response.json()) as { message?: string };
      console.log("✅ 保存成功:", result);

      setSaveResult({
        success: true,
        message: result.message || "メタ情報を正常に保存しました",
      });
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("❌ 保存エラー:", err);

      let errorMessage = "保存に失敗しました";
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          errorMessage = "保存処理がタイムアウトしました（60秒）";
        } else {
          errorMessage = err.message;
        }
      }

      setSaveResult({
        success: false,
        message: errorMessage,
      });
    } finally {
      console.log("🔵 保存処理終了");
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
      {/* ヘッダー部分 */}
      {metaInfo && (
        <MetaInfoHeader
          metaInfo={metaInfo}
          onSave={handleSave}
          saving={saving}
          saveResult={saveResult}
        />
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
            {/* 地域・年次セレクター */}
            {CLASS_INF &&
              CLASS_INF.CLASS_OBJ &&
              CLASS_INF.CLASS_OBJ.length > 0 && (
                <div className="lg:col-span-1">
                  <AreaTimeSelectors
                    classObjs={CLASS_INF.CLASS_OBJ}
                    metaInfoId={metaInfoId}
                  />
                </div>
              )}

            {/* カテゴリ情報 */}
            {CLASS_INF &&
              CLASS_INF.CLASS_OBJ &&
              CLASS_INF.CLASS_OBJ.length > 0 && (
                <div>
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
