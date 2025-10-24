"use client";

import { Alert, AlertDescription } from "@/components/atoms/ui/alert";
import { EstatAPIPageLayout } from "@/components/templates/EstatAPIPageLayout";
import { EstatMetaInfoDisplay } from "@/features/estat-api/meta-info/components/EstatMetaInfoDisplay";
import { EstatMetaInfoFetcher } from "@/features/estat-api/meta-info/components/EstatMetaInfoFetcher";
import { EstatMetaInfoSidebar } from "@/features/estat-api/meta-info/components/EstatMetaInfoSidebar";
import { useEstatMetaInfo } from "@/hooks/estat-api/useEstatMetaInfo";
import { AreaType } from "@/lib/area/types";
import { BarChart3, RefreshCw } from "lucide-react";
import { useState } from "react";

/**
 * e-Statメタ情報の型定義（クライアントサイド用）
 */
interface EstatMetaInfo {
  stats_data_id: string;
  stat_name: string;
  title: string;
  area_type: AreaType;
  cycle?: string;
  survey_date?: string;
  description?: string;
  last_fetched_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * MetaInfoPageContentProps - e-Statメタ情報ページのプロパティ
 */
interface MetaInfoPageContentProps {
  /** 保存済み統計表一覧（データベースから取得した統計表メタデータ） */
  savedStatsList?: EstatMetaInfo[];
  /** 初期統計表ID（mock環境などで初期表示用） */
  initialStatsId?: string;
}

/**
 * MetaInfoPageContent - e-Statメタ情報管理ページ
 *
 * 機能:
 * - e-Stat APIから統計表のメタ情報を取得・表示
 * - 保存済み統計表一覧の表示・管理
 * - 統計表の詳細情報表示
 * - サイドバーでの統計表選択・ナビゲーション
 *
 * レイアウト:
 * - ヘッダー: 現在の統計表ID表示、リフレッシュボタン
 * - メインエリア: メタ情報取得フォーム、詳細表示
 * - サイドバー: 保存済み統計表一覧
 */
export default function MetaInfoPageContent({
  savedStatsList = [],
  initialStatsId,
}: MetaInfoPageContentProps) {
  // ===== 状態管理 =====

  /** 現在選択中の統計表ID */
  const [currentStatsId, setCurrentStatsId] = useState<string>(
    initialStatsId || ""
  );

  // デバッグログ
  console.log("MetaInfoPageContent - initialStatsId:", initialStatsId);
  console.log("MetaInfoPageContent - currentStatsId:", currentStatsId);

  /** 自動保存ステータス管理 */
  const [autoSaveStatus, setAutoSaveStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  // ===== useSWRでメタ情報を取得（自動保存有効） =====
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
  console.log("MetaInfoPageContent - useEstatMetaInfo result:", {
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

  // ===== 副作用（useEffect） =====
  // 初期自動読み込みは削除 - ユーザーが明示的に選択した時のみ取得

  // ===== レンダリング =====

  return (
    <EstatAPIPageLayout
      title="e-STAT メタ情報管理"
      icon={BarChart3}
      actions={
        currentStatsId && (
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="py-1.5 px-2.5 inline-flex items-center gap-x-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-xs hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 transition-colors"
          >
            <RefreshCw
              className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`}
            />
            {isLoading ? "更新中..." : "更新"}
          </button>
        )
      }
      sidebar={
        <EstatMetaInfoSidebar
          className="h-full"
          initialData={savedStatsList}
          onView={handleSidebarItemView}
        />
      }
    >
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
            metaInfo?.GET_META_INFO?.METADATA_INF?.TABLE_INF?.["@id"] || "empty"
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
    </EstatAPIPageLayout>
  );
}
