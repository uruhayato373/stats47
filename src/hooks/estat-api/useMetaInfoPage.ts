/**
 * MetaInfoPage用カスタムフック
 * 責務: 状態管理、データフェッチング、イベントハンドリング、ビジネスロジック
 */

import { useState } from "react";

import {
  AutoSaveStatus,
  EstatMetaInfo,
} from "@/features/estat-api/meta-info/types";
import { useEstatMetaInfo } from "@/hooks/estat-api/useEstatMetaInfo";
import { buildEnvironmentConfig } from "@/infrastructure/config";

/**
 * useMetaInfoPageフックの戻り値の型定義
 */
export interface UseMetaInfoPageReturn {
  // 状態
  currentStatsId: string;
  autoSaveStatus: AutoSaveStatus;

  // データ
  metaInfo: any;
  error: string | null;
  isLoading: boolean;

  // イベントハンドラー
  handleFetchMetaInfo: (statsDataId: string) => void;
  handleRefresh: () => void;
  handleSidebarItemView: (item: EstatMetaInfo) => void;
}

/**
 * MetaInfoPage用カスタムフック
 *
 * 責務:
 * - 状態管理（currentStatsId、autoSaveStatus）
 * - データフェッチング（useEstatMetaInfo）
 * - イベントハンドリング
 * - ビジネスロジック（環境判定、自動保存処理）
 */
export function useMetaInfoPage(): UseMetaInfoPageReturn {
  // ===== 状態管理 =====

  /** 現在選択中の統計表ID */
  const [currentStatsId, setCurrentStatsId] = useState<string>(() => {
    // mock環境の場合は初期統計表IDを設定
    const config = buildEnvironmentConfig();
    return config.isMock ? "0000010101" : "";
  });

  // デバッグログ
  console.log("useMetaInfoPage - currentStatsId:", currentStatsId);

  /** 自動保存ステータス管理 */
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>({
    type: null,
    message: "",
  });

  // ===== データフェッチング =====

  /** useSWRでメタ情報を取得（自動保存有効） */
  const { metaInfo, error, isLoading, refetch } = useEstatMetaInfo(
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

  // デバッグログ
  console.log("useMetaInfoPage - useEstatMetaInfo result:", {
    currentStatsId,
    hasMetaInfo: !!metaInfo,
    error,
    isLoading,
  });

  // ===== イベントハンドラー =====

  /**
   * 統計表IDを変更してメタ情報を取得する
   * @param statsDataId - 取得対象の統計表ID
   */
  const handleFetchMetaInfo = (statsDataId: string) => {
    setCurrentStatsId(statsDataId);
  };

  /**
   * 現在の統計表のメタ情報を再取得する（リフレッシュ）
   */
  const handleRefresh = () => {
    if (currentStatsId) {
      refetch();
    }
  };

  /**
   * サイドバーの統計表アイテムがクリックされた時の処理
   * @param item - クリックされた統計表のメタデータ
   */
  const handleSidebarItemView = (item: EstatMetaInfo) => {
    if (item.stats_data_id) {
      handleFetchMetaInfo(item.stats_data_id);
    }
  };

  // ===== 戻り値 =====

  return {
    // 状態
    currentStatsId,
    autoSaveStatus,

    // データ
    metaInfo,
    error,
    isLoading,

    // イベントハンドラー
    handleFetchMetaInfo,
    handleRefresh,
    handleSidebarItemView,
  };
}
