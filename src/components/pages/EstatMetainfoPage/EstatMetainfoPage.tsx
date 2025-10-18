"use client";

import { useState, useEffect } from "react";
import { EstatMetaInfoFetcher } from "@/components/organisms/estat-api/EstatMetaInfoFetcher";
import { EstatMetaInfoDisplay } from "@/components/templates/EstatMetaInfoDisplay";
import { EstatMetaInfoPageHeader } from "@/components/organisms/estat-api/EstatMetaInfoPageHeader";
import { EstatMetaInfoSidebar } from "@/components/organisms/estat-api/EstatMetaInfoSidebar";
import { estatAPI, EstatMetaInfoResponse } from "@/lib/estat-api";
import { EstatMetaInfo } from "@/lib/database/estat/types";

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
  }, []); // 空の依存配列で初回マウント時のみ実行

  // ===== レンダリング =====

  return (
    <div className="transition-all duration-300 px-3 pb-3 min-h-screen">
      {/* ヘッダーセクション - 全幅表示 */}
      <div>
        <EstatMetaInfoPageHeader
          loading={loading}
          currentStatsId={currentStatsId}
          onRefresh={handleRefresh}
        />
      </div>

      {/* メインコンテンツとサイドバーを横並びレイアウト */}
      <div className="flex flex-col lg:flex-row min-h-full">
        {/* メイン作業エリア - 左側（可変幅） */}
        <div className="flex-1 bg-white dark:bg-neutral-800">
          <div className="p-4 md:p-6 space-y-6">
            {/* メタ情報取得フォーム - 統計表IDを入力してAPI呼び出し */}
            <EstatMetaInfoFetcher
              onSubmit={handleFetchMetaInfo}
              loading={loading}
            />

            {/* メタ情報表示エリア - APIレスポンスの詳細表示 */}
            <EstatMetaInfoDisplay
              key={
                // 統計表IDをキーとして使用（同じIDの場合は再レンダリングを防ぐ）
                metaInfo?.GET_META_INFO?.METADATA_INF?.TABLE_INF?.["@id"] ||
                "empty"
              }
              metaInfo={metaInfo}
              loading={loading}
              error={error}
            />
          </div>
        </div>

        {/* 区切り線 - デスクトップ表示時のみ */}
        <div className="hidden lg:block w-px border-s border-gray-200 dark:border-neutral-700"></div>

        {/* 保存済みデータサイドバー - 右側（固定幅） */}
        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
          <EstatMetaInfoSidebar
            className="h-full"
            initialData={savedStatsList}
            onView={handleSidebarItemView}
          />
        </div>
      </div>
    </div>
  );
}
