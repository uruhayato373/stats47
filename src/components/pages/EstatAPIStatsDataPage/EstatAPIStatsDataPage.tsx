"use client";

/**
 * @fileoverview e-STAT APIを使用して統計データを取得・表示するページコンポーネント
 *
 * このページは以下の主要な機能を提供します：
 * - e-STAT APIからの統計データ取得
 * - 取得したデータの表示
 * - エラーハンドリングとローディング状態の管理
 * - データ更新機能
 *
 * @module EstatAPIStatsDataPage
 */

import { useState } from "react";
import { RefreshCw, Database } from "lucide-react";
import {
  EstatDataFetcher,
  EstatDataDisplay,
} from "@/components/organisms/estat-api/stats-data";
import { EstatAPIPageLayout } from "@/components/templates/EstatAPIPageLayout";
import { EstatStatsDataResponse, GetStatsDataParams } from "@/lib/estat-api";

/**
 * EstatAPIStatsDataPage コンポーネントの Props
 */
interface EstatAPIStatsDataPageProps {
  /**
   * サーバーサイドで取得した初期データ
   */
  initialData?: EstatStatsDataResponse | null;
}

/**
 * e-STAT APIを使用して統計データを取得・表示するメインページコンポーネント
 *
 * @param {EstatAPIStatsDataPageProps} props - コンポーネントのプロパティ
 * @returns {JSX.Element} レンダリングされたページコンポーネント
 */
export default function EstatAPIStatsDataPage({
  initialData = null,
}: EstatAPIStatsDataPageProps) {
  /**
   * APIからの応答データを保持するstate
   * @type {[EstatStatsDataResponse | null, React.Dispatch<React.SetStateAction<EstatStatsDataResponse | null>>]}
   */
  const [apiResponse, setApiResponse] = useState<EstatStatsDataResponse | null>(
    initialData // 初期データをstateの初期値として設定
  );

  /**
   * データ取得中のローディング状態を管理するstate
   * @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]}
   */
  const [loading, setLoading] = useState(false);

  /**
   * エラーメッセージを管理するstate
   * @type {[string | null, React.Dispatch<React.SetStateAction<string | null>>]}
   */
  const [error, setError] = useState<string | null>(null);

  /**
   * 現在のAPIリクエストパラメータを保持するstate
   * @type {[GetStatsDataParams | null, React.Dispatch<React.SetStateAction<GetStatsDataParams | null>>]}
   */
  const [currentParams, setCurrentParams] = useState<GetStatsDataParams | null>(
    null
  );

  /**
   * e-STAT APIから統計データを取得する関数
   *
   * @param {GetStatsDataParams} params - APIリクエストのパラメータ
   * @returns {Promise<void>} データ取得処理の完了を示すPromise
   * @throws {Error} APIリクエストが失敗した場合のエラー
   */
  const handleFetchData = async (params: GetStatsDataParams) => {
    setLoading(true);
    setError(null);
    setCurrentParams(params);

    try {
      const queryParams = new URLSearchParams();

      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          queryParams.append(key, String(value));
        }
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒でタイムアウト

      const response = await fetch(
        `/api/estat-api/stats-data?${queryParams.toString()}`,
        {
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = (await response.json()) as { error?: string };
          errorMessage = errorData.error || errorMessage;
        } catch {
          const textResponse = await response.text();
          errorMessage = `HTTP ${response.status}: ${textResponse.substring(
            0,
            100
          )}`;
        }
        throw new Error(errorMessage);
      }

      let data: EstatStatsDataResponse;
      try {
        const responseText = await response.text();
        data = JSON.parse(responseText) as EstatStatsDataResponse;
      } catch (jsonError) {
        throw new Error(
          `Invalid JSON response: ${
            jsonError instanceof Error ? jsonError.message : "Unknown error"
          }`
        );
      }

      setApiResponse(data);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError(
          "リクエストがタイムアウトしました。e-STAT APIが応答していない可能性があります。"
        );
      } else {
        setError(
          err instanceof Error ? err.message : "データ取得に失敗しました"
        );
      }
      setApiResponse(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 現在のパラメータを使用してデータを再取得する関数
   *
   * @returns {void}
   */
  const handleRefresh = () => {
    if (currentParams) {
      handleFetchData(currentParams);
    }
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
