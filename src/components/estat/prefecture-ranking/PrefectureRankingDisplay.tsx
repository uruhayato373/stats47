"use client";

import { AlertTriangle, Map, Database } from "lucide-react";
import { EstatStatsDataResponse } from "@/lib/estat/types";

interface PrefectureRankingDisplayProps {
  data: EstatStatsDataResponse | null;
  loading: boolean;
  error: string | null;
}

export default function PrefectureRankingDisplay({
  data,
  loading,
  error,
}: PrefectureRankingDisplayProps) {

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-xs dark:bg-neutral-800 dark:border-neutral-700">
        <div className="p-8 text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-indigo-600 rounded-full"></div>
          <p className="mt-4 text-gray-600 dark:text-neutral-400">
            データを取得中...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-lg shadow-xs dark:bg-neutral-800 dark:border-red-700">
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
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-xs dark:bg-neutral-800 dark:border-neutral-700">
        <div className="p-8 text-center">
          <Database className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100 mb-2">
            データ取得前
          </h3>
          <p className="text-gray-600 dark:text-neutral-400">
            上のフォームから統計表IDを入力してデータを取得してください
          </p>
          <p className="text-sm text-gray-500 dark:text-neutral-500 mt-2">
            取得したデータは右側のサイドバーに表示されます
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-xs dark:bg-neutral-800 dark:border-neutral-700">
      <div className="p-8 text-center">
        <Map className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100 mb-2">
          データ取得完了
        </h3>
        <p className="text-gray-600 dark:text-neutral-400 mb-2">
          統計データの取得が完了しました
        </p>
        <p className="text-sm text-gray-500 dark:text-neutral-500">
          取得したデータとランキングは右側のサイドバーでご確認ください
        </p>
      </div>
    </div>
  );
}