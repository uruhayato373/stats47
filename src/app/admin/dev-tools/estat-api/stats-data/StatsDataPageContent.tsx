"use client";

/**
 * @fileoverview e-STAT APIを使用して統計データを取得・表示するページコンポーネント（useSWR最適化版）
 *
 * このページは以下の主要な機能を提供します：
 * - e-STAT APIからの統計データ取得（useSWRで最適化）
 * - 取得したデータの表示
 * - エラーハンドリングとローディング状態の管理
 * - データ更新機能
 *
 * @module EstatAPIStatsDataPage
 */

import { useState } from "react";

import { Database, RefreshCw } from "lucide-react";

import { EstatAPIPageLayout } from "@/components/templates/EstatAPIPageLayout";

import {
  EstatDataDisplay,
  EstatDataFetcher,
} from "@/features/estat-api/stats-data/components";

import { EstatStatsDataResponse, GetStatsDataParams } from "@/lib/estat-api";

import { useEstatStatsData } from "@/hooks/estat-api/useEstatStatsData";

/**
 * StatsDataPageContent コンポーネントの Props
 */
interface StatsDataPageContentProps {
  /**
   * サーバーサイドで取得した初期データ
   */
  initialData?: EstatStatsDataResponse | null;
}

/**
 * e-STAT APIを使用して統計データを取得・表示するメインページコンポーネント（useSWR最適化版）
 *
 * @param {EstatAPIStatsDataPageProps} props - コンポーネントのプロパティ
 * @returns {JSX.Element} レンダリングされたページコンポーネント
 */
export default function StatsDataPageContent({
  initialData: _initialData = null,
}: StatsDataPageContentProps) {
  /**
   * 現在のAPIリクエストパラメータを保持するstate
   * @type {[GetStatsDataParams | null, React.Dispatch<React.SetStateAction<GetStatsDataParams | null>>]}
   */
  const [currentParams, setCurrentParams] = useState<GetStatsDataParams | null>(
    null
  );

  // useSWRでデータ取得を管理
  const {
    data: apiResponse,
    error,
    isLoading: loading,
    refetch,
  } = useEstatStatsData(currentParams);

  /**
   * e-STAT APIから統計データを取得する関数（useSWRに移譲）
   *
   * @param {GetStatsDataParams} params - APIリクエストのパラメータ
   */
  const handleFetchData = (params: GetStatsDataParams) => {
    console.log("🔵 Page: データ取得開始", params);
    setCurrentParams(params);
  };

  /**
   * 現在のパラメータを使用してデータを再取得する関数（useSWRのrefetchを使用）
   */
  const handleRefresh = () => {
    console.log("🔵 Page: データ再取得開始");
    refetch();
  };

  return (
    <EstatAPIPageLayout
      title="e-STAT データ取得・確認"
      icon={Database}
      actions={
        currentParams && (
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
    >
      {/* データ取得フォーム */}
      <EstatDataFetcher onSubmit={handleFetchData} loading={loading} />

      {/* データ表示エリア */}
      <EstatDataDisplay data={apiResponse} loading={loading} error={error} />
    </EstatAPIPageLayout>
  );
}
