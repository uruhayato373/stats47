"use client";

import { useState, useEffect } from "react";
import { RefreshCw, BarChart3, Save, Check, AlertCircle } from "lucide-react";
import { EstatMetaInfoFetcher } from "@/components/organisms/estat-api/meta-info/EstatMetaInfoFetcher";
import { EstatMetaInfoDisplay } from "@/components/organisms/estat-api/meta-info/EstatMetaInfoDisplay";
import { EstatMetaInfoSidebar } from "@/components/organisms/estat-api/meta-info/EstatMetaInfoSidebar";
import { EstatAPIPageLayout } from "@/components/templates/EstatAPIPageLayout";
import { estatAPI, EstatMetaInfoResponse } from "@/lib/estat-api";
import { EstatMetaInfo } from "@/lib/database/estat/types";
import { SaveMetaInfoCacheRequest } from "@/types/models/r2/estat-metainfo-cache";

/**
 * EstatMetainfoPageProps - e-Statメタ情報ページのプロパティ
 */
interface EstatMetainfoPageProps {
  /** 保存済み統計表一覧（データベースから取得した統計表メタデータ） */
  savedStatsList?: EstatMetaInfo[];
}

/**
 * EstatMetainfoPage - e-Statメタ情報管理ページ
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
export default function EstatMetainfoPage({
  savedStatsList = [],
}: EstatMetainfoPageProps) {
  // ===== 状態管理 =====

  /** 現在表示中のe-Stat APIメタ情報レスポンス */
  const [metaInfo, setMetaInfo] = useState<EstatMetaInfoResponse | null>(null);

  /** API通信中のローディング状態 */
  const [loading, setLoading] = useState(false);

  /** エラーメッセージ（API通信失敗時など） */
  const [error, setError] = useState<string | null>(null);

  /** 現在選択中の統計表ID */
  const [currentStatsId, setCurrentStatsId] = useState<string>("");

  /** R2保存状態管理 */
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  // ===== イベントハンドラー =====

  /**
   * e-Stat APIからメタ情報を取得する
   * @param statsDataId - 取得対象の統計表ID
   */
  const handleFetchMetaInfo = async (statsDataId: string) => {
    setLoading(true);
    setError(null);
    setCurrentStatsId(statsDataId);

    try {
      // e-Stat APIを呼び出してメタ情報を取得
      const response = await estatAPI.getMetaInfo({ statsDataId });
      setMetaInfo(response);
    } catch (err) {
      console.error("Meta info fetch error:", err);
      // エラー状態を設定（ユーザーに表示）
      setError(
        err instanceof Error ? err.message : "不明なエラーが発生しました"
      );
      setMetaInfo(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 現在の統計表のメタ情報を再取得する（リフレッシュ）
   */
  const handleRefresh = () => {
    if (currentStatsId) {
      handleFetchMetaInfo(currentStatsId);
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

  /**
   * 初回マウント時の自動読み込み処理
   * 保存済み統計表一覧がある場合、最初のアイテムを自動的に読み込む
   */
  useEffect(() => {
    // 保存済み統計表一覧が存在する場合のみ実行
    if (savedStatsList && savedStatsList.length > 0) {
      // stats_data_idでソートして最初のアイテムを取得
      // これにより一貫した順序で最初のアイテムが選択される
      const sortedData = [...savedStatsList].sort((a, b) => {
        const aId = a.stats_data_id || "";
        const bId = b.stats_data_id || "";
        return aId.localeCompare(bId);
      });

      const firstItem = sortedData[0];
      if (firstItem.stats_data_id) {
        // 最初の統計表のメタ情報を自動取得
        handleFetchMetaInfo(firstItem.stats_data_id);
      }
    }
  }, [savedStatsList]); // savedStatsList の変更を監視

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
            disabled={loading}
            className="py-1.5 px-2.5 inline-flex items-center gap-x-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-xs hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            {loading ? "更新中..." : "更新"}
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
      {/* メタ情報取得フォーム - 統計表IDを入力してAPI呼び出し */}
      <EstatMetaInfoFetcher onSubmit={handleFetchMetaInfo} loading={loading} />

      {/* メタ情報表示エリア - APIレスポンスの詳細表示 */}
      <EstatMetaInfoDisplay
        key={
          // 統計表IDをキーとして使用（同じIDの場合は再レンダリングを防ぐ）
          metaInfo?.GET_META_INFO?.METADATA_INF?.TABLE_INF?.["@id"] || "empty"
        }
        metaInfo={metaInfo}
        loading={loading}
        error={error}
      />
    </EstatAPIPageLayout>
  );
}
