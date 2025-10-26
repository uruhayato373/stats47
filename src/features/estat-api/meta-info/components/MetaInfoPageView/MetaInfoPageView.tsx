/**
 * MetaInfoPageView - e-Statメタ情報管理ページのプレゼンターコンポーネント
 * 責務: UIレンダリングのみ
 */

import { BarChart3, RefreshCw } from "lucide-react";

import { Alert, AlertDescription } from "@/components/atoms/ui/alert";
import { EstatAPIPageLayout } from "@/components/templates/EstatAPIPageLayout";

import { EstatMetaInfoDisplay } from "@/features/estat-api/meta-info/components/EstatMetaInfoDisplay";
import { EstatMetaInfoFetcher } from "@/features/estat-api/meta-info/components/EstatMetaInfoFetcher";
import { EstatMetaInfoSidebar } from "@/features/estat-api/meta-info/components/EstatMetaInfoSidebar";

import {
  AutoSaveStatus,
  EstatMetaInfo,
} from "@/features/estat-api/meta-info/types";

/**
 * MetaInfoPageViewのProps型定義
 */
export interface MetaInfoPageViewProps {
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
 * MetaInfoPageView - e-Statメタ情報管理ページのプレゼンターコンポーネント
 *
 * 責務:
 * - UIレンダリングのみ
 * - props経由でデータとハンドラーを受け取る
 * - 純粋なプレゼンテーションロジック
 * - 条件分岐による表示制御
 *
 * レイアウト:
 * - ヘッダー: 現在の統計表ID表示、リフレッシュボタン
 * - メインエリア: メタ情報取得フォーム、詳細表示
 * - サイドバー: 保存済み統計表一覧
 */
export function MetaInfoPageView({
  currentStatsId,
  autoSaveStatus,
  metaInfo,
  error,
  isLoading,
  handleFetchMetaInfo,
  handleRefresh,
  handleSidebarItemView,
}: MetaInfoPageViewProps) {
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
