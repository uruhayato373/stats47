"use client";

import React, { useState, useEffect } from "react";
import { Code, Database } from "lucide-react";
import { EstatMetaInfoResponse } from "@/lib/estat/types";
import { useStyles } from "@/hooks/useStyles";
import JsonDisplay from "./components/JsonDisplay";
import MetaInfoHeader from "./components/MetaInfoHeader";
import UnifiedClassificationTabs from "./components/UnifiedClassificationTabs";
import { useMetaInfoSave, useMetaInfoDownload } from "./hooks";

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
  const [activeMainTab, setActiveMainTab] = useState(0);
  const { save, saving, saveResult } = useMetaInfoSave();
  const { download } = useMetaInfoDownload();

  // メタ情報が変更されたらタブをリセット
  useEffect(() => {
    setActiveMainTab(0);
  }, [metaInfo]);

  const handleSave = () => {
    if (metaInfo) {
      save(metaInfo);
    }
  };

  const handleDownload = () => {
    if (metaInfo) {
      download(metaInfo);
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

  const metaInfoId = TABLE_INF?.["@id"];

  return (
    <div className="space-y-6">
      {/* ヘッダー部分 */}
      <MetaInfoHeader
        metaInfo={metaInfo}
        onSave={handleSave}
        saving={saving}
        saveResult={saveResult}
      />

      {/* タブナビゲーション */}
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
            {CLASS_INF &&
              CLASS_INF.CLASS_OBJ &&
              CLASS_INF.CLASS_OBJ.length > 0 && (
                <UnifiedClassificationTabs
                  classObjs={CLASS_INF.CLASS_OBJ}
                  metaInfoId={metaInfoId}
                />
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
