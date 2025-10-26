"use client";

import { useState } from "react";

import { BarChart3 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/atoms/ui/alert";

import {
  EstatMetaInfoDisplay,
  EstatMetaInfoFetcher,
  EstatMetaInfoSidebar,
} from "@/features/estat-api/meta-info/components";
import { useEstatMetaInfo } from "@/features/estat-api/meta-info/hooks/useEstatMetaInfo";
import { AutoSaveStatus } from "@/features/estat-api/meta-info/types";

import { buildEnvironmentConfig } from "@/infrastructure/config";

/**
 * MetaInfoPage - e-Statメタ情報管理ページ
 *
 * 責務:
 * - 状態管理（currentStatsId、autoSaveStatus）
 * - データフェッチング（useEstatMetaInfo）
 * - イベントハンドリング
 * - ビジネスロジック（環境判定、自動保存処理）
 * - UIレンダリング
 */
export default function MetaInfoPage() {
  // 状態管理
  const [currentStatsId, setCurrentStatsId] = useState<string>(() => {
    const config = buildEnvironmentConfig();
    return config.isMock ? "0000010101" : "";
  });

  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>({
    type: null,
    message: "",
  });

  // データフェッチング
  const { metaInfo, error, isLoading } = useEstatMetaInfo(
    currentStatsId || null,
    {
      autoSave: true,
      onSaveSuccess: (message) => {
        setAutoSaveStatus({ type: "success", message });
        setTimeout(() => {
          setAutoSaveStatus({ type: null, message: "" });
        }, 3000);
      },
      onSaveError: (error) => {
        setAutoSaveStatus({
          type: "error",
          message: error,
        });
        setTimeout(() => {
          setAutoSaveStatus({ type: null, message: "" });
        }, 5000);
      },
    }
  );

  // イベントハンドラー
  const handleFetchMetaInfo = (statsDataId: string) => {
    setCurrentStatsId(statsDataId);
  };

  const handleSidebarItemView = (item: { stats_data_id?: string }) => {
    if (item.stats_data_id) {
      setCurrentStatsId(item.stats_data_id);
    }
  };

  // ===== レイアウト構築 =====

  // ヘッダー
  const header = (
    <div className="py-3 px-4 flex flex-wrap justify-between items-center gap-2 bg-white border-b border-gray-200 dark:bg-neutral-800 dark:border-neutral-700">
      <div>
        <h1 className="font-medium text-lg text-gray-800 dark:text-neutral-200 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-600" />
          e-STAT メタ情報管理
        </h1>
      </div>
    </div>
  );

  // メインコンテンツ
  const mainContent = (
    <div className="flex-1 bg-white dark:bg-neutral-800">
      <div className="p-4 md:p-6 space-y-6">
        {/* 自動保存ステータス表示 */}
        {autoSaveStatus.type && (
          <Alert
            variant={
              autoSaveStatus.type === "success" ? "default" : "destructive"
            }
            className="mb-4"
          >
            <AlertDescription>{autoSaveStatus.message}</AlertDescription>
          </Alert>
        )}

        {/* メタ情報取得フォーム - 統計表IDを入力してAPI呼び出し */}
        <EstatMetaInfoFetcher
          onSubmit={handleFetchMetaInfo}
          loading={isLoading}
        />

        {/* メタ情報表示エリア - APIレスポンスの詳細表示 */}
        {currentStatsId ? (
          <EstatMetaInfoDisplay
            key={
              // 統計表IDをキーとして使用（同じIDの場合は再レンダリングを防ぐ）
              metaInfo?.GET_META_INFO?.METADATA_INF?.TABLE_INF?.["@id"] ||
              "empty"
            }
            metaInfo={metaInfo}
            loading={isLoading}
            error={error}
          />
        ) : (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <p>統計表IDを入力してメタ情報を取得してください</p>
          </div>
        )}
      </div>
    </div>
  );

  // サイドバー
  const sidebar = (
    <EstatMetaInfoSidebar className="h-full" onView={handleSidebarItemView} />
  );

  // ===== レスポンシブレイアウト =====
  return (
    <div className="transition-all duration-300 min-h-screen bg-white dark:bg-neutral-900">
      {header}

      {/* サイドバーありレイアウト（レスポンシブ対応） */}
      <div className="flex flex-col lg:flex-row min-h-full">
        {/* メインコンテンツ */}
        {mainContent}

        {/* サイドバー区切り線（デスクトップのみ） */}
        <div className="hidden lg:block w-px border-s border-gray-200 dark:border-neutral-700"></div>

        {/* サイドバーコンテンツ */}
        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">{sidebar}</div>
      </div>
    </div>
  );
}
