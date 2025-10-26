"use client";

import { useState } from "react";

import { MetaInfoPageView } from "@/features/estat-api/meta-info/components/MetaInfoPageView";
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
 * - プレゼンターコンポーネントへのprops渡し
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

  return (
    <MetaInfoPageView
      currentStatsId={currentStatsId}
      autoSaveStatus={autoSaveStatus}
      metaInfo={metaInfo}
      error={error}
      isLoading={isLoading}
      handleFetchMetaInfo={handleFetchMetaInfo}
      handleSidebarItemView={handleSidebarItemView}
    />
  );
}
