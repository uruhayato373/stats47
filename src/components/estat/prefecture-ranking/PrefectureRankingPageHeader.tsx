"use client";

import { RefreshCw, Map, ExternalLink } from "lucide-react";

interface PrefectureRankingPageHeaderProps {
  loading: boolean;
  currentStatsId: string;
  onRefresh: () => void;
}

export default function PrefectureRankingPageHeader({
  loading,
  currentStatsId,
  onRefresh,
}: PrefectureRankingPageHeaderProps) {
  return (
    <div className="bg-white dark:bg-neutral-800 ">
      <div className="py-3 px-4 flex flex-wrap justify-between items-center gap-2">
        <div>
          <h1 className="font-medium text-lg text-gray-800 dark:text-neutral-200 flex items-center gap-2">
            <Map className="w-6 h-6 text-indigo-600" />
            都道府県ランキング・コロプレス地図
          </h1>
          <p className="text-sm text-gray-600 dark:text-neutral-400 mt-1">
            e-STAT統計データを都道府県別に地図上で可視化し、ランキング形式で表示
          </p>
        </div>

        {/* アクションボタン */}
        <div className="flex items-center gap-x-2">
          {currentStatsId && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="py-1.5 px-2.5 inline-flex items-center gap-x-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-xs hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 transition-colors"
            >
              <RefreshCw
                className={`w-3 h-3 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "更新中..." : "更新"}
            </button>
          )}

          <a
            href="https://www.e-stat.go.jp/api/"
            target="_blank"
            rel="noopener noreferrer"
            className="py-1.5 px-2.5 inline-flex items-center gap-x-1.5 text-xs font-medium rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 focus:outline-hidden focus:bg-indigo-600 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            e-STAT API
          </a>
        </div>
      </div>
    </div>
  );
}
