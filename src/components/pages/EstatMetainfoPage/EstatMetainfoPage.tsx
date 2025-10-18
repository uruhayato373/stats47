"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, BarChart3, Save, Check, AlertCircle } from "lucide-react";
import { EstatMetaInfoFetcher } from "@/components/organisms/estat-api/meta-info/EstatMetaInfoFetcher";
import { EstatMetaInfoDisplay } from "@/components/organisms/estat-api/meta-info/EstatMetaInfoDisplay";
import { EstatMetaInfoSidebar } from "@/components/organisms/estat-api/meta-info/EstatMetaInfoSidebar";
import { EstatAPIPageLayout } from "@/components/templates/EstatAPIPageLayout";
import { estatAPI, EstatMetaInfoResponse } from "@/lib/estat-api";
import { EstatMetaInfoCacheService } from "@/lib/database/estat/services";

/**
 * 地域タイプの定義（クライアントサイド用）
 */
type AreaType = "country" | "prefecture" | "municipality";

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

  /** 初回実行フラグ（不要な再実行を防ぐ） */
  const hasInitializedRef = useRef(false);

  // ===== イベントハンドラー =====

  /**
   * e-Stat APIからメタ情報を取得する（メモ化）
   * @param statsDataId - 取得対象の統計表ID
   */
  const handleFetchMetaInfo = useCallback(async (statsDataId: string) => {
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
  }, []); // 依存配列は空（estatAPIは外部ライブラリなので安定）

  /**
   * 現在の統計表のメタ情報を再取得する（リフレッシュ）（メモ化）
   */
  const handleRefresh = useCallback(() => {
    if (currentStatsId) {
      handleFetchMetaInfo(currentStatsId);
    }
  }, [currentStatsId, handleFetchMetaInfo]);

  /**
   * サイドバーの統計表アイテムがクリックされた時の処理（メモ化）
   * @param item - クリックされた統計表のメタデータ
   */
  const handleSidebarItemView = useCallback(
    (item: EstatMetaInfo) => {
      if (item.stats_data_id) {
        handleFetchMetaInfo(item.stats_data_id);
      }
    },
    [handleFetchMetaInfo]
  );

  /**
   * メタ情報をR2に保存する（メモ化）
   */
  const handleSaveToR2 = useCallback(async () => {
    if (!metaInfo || !currentStatsId) {
      setSaveStatus({
        type: "error",
        message: "保存するメタ情報がありません",
      });
      return;
    }

    setIsSaving(true);
    setSaveStatus({ type: null, message: "" });

    try {
      const result = await EstatMetaInfoCacheService.saveToR2(
        currentStatsId,
        metaInfo
      );

      setSaveStatus({
        type: "success",
        message: result.message || "保存が完了しました",
      });

      setTimeout(() => {
        setSaveStatus({ type: null, message: "" });
      }, 3000);
    } catch (error) {
      console.error("R2保存エラー:", error);
      setSaveStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "保存中にエラーが発生しました",
      });
    } finally {
      setIsSaving(false);
    }
  }, [metaInfo, currentStatsId]);

  // ===== 副作用（useEffect） =====

  /**
   * 初回マウント時の自動読み込み処理（最適化版）
   * 保存済み統計表一覧がある場合、最初のアイテムを自動的に読み込む
   * 初回のみ実行し、不要な再実行を防ぐ
   */
  useEffect(() => {
    // 初回のみ実行し、同じデータの場合はスキップ
    if (
      hasInitializedRef.current ||
      !savedStatsList ||
      savedStatsList.length === 0
    ) {
      return;
    }

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
      hasInitializedRef.current = true;
    }
  }, [savedStatsList, handleFetchMetaInfo]); // 依存配列にhandleFetchMetaInfoを追加

  // ===== レンダリング =====

  return (
    <EstatAPIPageLayout
      title="e-STAT メタ情報管理"
      icon={BarChart3}
      actions={
        currentStatsId && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="py-1.5 px-2.5 inline-flex items-center gap-x-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-xs hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 transition-colors"
            >
              <RefreshCw
                className={`w-3 h-3 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "更新中..." : "更新"}
            </button>
            <button
              type="button"
              onClick={handleSaveToR2}
              disabled={loading || isSaving || !metaInfo}
              className="py-1.5 px-2.5 inline-flex items-center gap-x-1.5 text-xs font-medium rounded-lg border border-blue-200 bg-blue-500 text-white shadow-xs hover:bg-blue-600 focus:outline-hidden focus:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : saveStatus.type === "success" ? (
                <Check className="w-3 h-3" />
              ) : (
                <Save className="w-3 h-3" />
              )}
              {isSaving ? "保存中..." : "R2に保存"}
            </button>
          </div>
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
      {/* ステータスメッセージ表示 */}
      {saveStatus.type && (
        <div
          className={`mb-4 p-3 rounded-lg border ${
            saveStatus.type === "success"
              ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
              : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {saveStatus.type === "success" ? (
              <Check className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">{saveStatus.message}</span>
          </div>
        </div>
      )}

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
