"use client";

import { AlertTriangle, Database } from "lucide-react";
import { EstatRankingDataContainer } from "@/components/estat/ranking-settings/containers";
import { useEstatStatsData } from "@/hooks/ranking/useEstatStatsData";
import { EstatStatsDataResponse } from "@/lib/estat/types";
import { DisplayProps } from "./types";

export default function Display({ params, onSettingsChange }: DisplayProps) {
  // ===== Step 1: e-Stat APIからデータ取得 =====
  // useEstatStatsData()フックを使用してe-Stat APIから統計データを取得
  const { data, error, isLoading } = useEstatStatsData(params);

  // パラメータがnullの場合はデータ取得前状態を表示
  if (!params) {
    return (
      <div className="p-8 text-center">
        <Database className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100 mb-2">
          データ取得前
        </h3>
        <p className="text-gray-600 dark:text-neutral-400">
          上のフォームから統計表IDを入力してデータを取得してください
        </p>
        <p className="text-sm text-gray-500 dark:text-neutral-500 mt-2">
          取得したデータの地図表示とランキングが表示されます
        </p>
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-indigo-600 rounded-full"></div>
        <p className="mt-4 text-gray-600 dark:text-neutral-400">
          データを取得中...
        </p>
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <div>
            <h3 className="font-medium text-red-800 dark:text-red-200">
              データ取得エラー
            </h3>
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // データなし状態
  if (!data) {
    return (
      <div className="p-8 text-center">
        <Database className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100 mb-2">
          データ取得前
        </h3>
        <p className="text-gray-600 dark:text-neutral-400">
          上のフォームから統計表IDを入力してデータを取得してください
        </p>
        <p className="text-sm text-gray-500 dark:text-neutral-500 mt-2">
          取得したデータの地図表示とランキングが表示されます
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ===== Step 2: EstatRankingDataContainerでデータ表示 ===== */}
      {/* e-Stat生データをEstatRankingDataContainerに渡して地図・テーブル・統計を表示 */}
      {data && params?.categoryCode && (
        <EstatRankingDataContainer
          rawData={data as EstatStatsDataResponse}
          statsDataId={params.statsDataId}
          categoryCode={params.categoryCode}
          onSettingsChange={onSettingsChange}
        />
      )}
    </div>
  );
}
