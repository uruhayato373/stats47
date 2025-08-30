"use client";

import { useState } from "react";
import { SAMPLE_STATS_DATA_IDS } from "@/lib/constants";

interface StatsIdInputProps {
  onSubmit: (statsDataId: string) => void;
  loading?: boolean;
}

export default function StatsIdInput({ onSubmit, loading }: StatsIdInputProps) {
  const [statsDataId, setStatsDataId] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (statsDataId.trim()) {
      onSubmit(statsDataId.trim());
    }
  };

  const handleSampleSelect = (sampleId: string) => {
    setStatsDataId(sampleId);
    onSubmit(sampleId);
  };

  return (
    <div className="bg-white rounded-lg shadow-xs border border-gray-200 p-4 dark:bg-neutral-800 dark:border-neutral-700">
      <h2 className="text-base font-medium text-gray-800 mb-3 dark:text-neutral-200">
        統計表IDを入力
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label
            htmlFor="statsDataId"
            className="block text-sm font-medium text-gray-700 mb-2 dark:text-neutral-300"
          >
            統計表ID
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="statsDataId"
              value={statsDataId}
              onChange={(e) => setStatsDataId(e.target.value)}
              placeholder="例: 0003448237"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg shadow-xs placeholder-gray-500 bg-white text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-100 dark:placeholder-neutral-400"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !statsDataId.trim()}
              className="px-3 py-2 bg-indigo-500 text-white text-sm font-medium rounded-lg hover:bg-indigo-600 focus:outline-hidden focus:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  取得中...
                </div>
              ) : (
                "取得"
              )}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2 dark:text-neutral-300">
          サンプル統計表
        </h3>
        <div className="space-y-1">
          {Object.entries(SAMPLE_STATS_DATA_IDS).map(([key, value]) => (
            <button
              key={key}
              onClick={() => handleSampleSelect(value)}
              disabled={loading}
              className="w-full text-left px-3 py-2 text-sm bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:border-neutral-600 dark:text-neutral-300"
            >
              <span className="font-medium">
                {key === "POPULATION" && "人口推計"}
                {key === "HOUSEHOLD" && "世帯数"}
                {key === "ECONOMY" && "県民経済計算"}
              </span>
              <span className="text-gray-600 ml-2 dark:text-neutral-400">
                ({value})
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 p-3 bg-white border border-gray-200 rounded-lg dark:bg-neutral-700 dark:border-neutral-600">
        <div className="flex items-start">
          <svg
            className="w-4 h-4 text-gray-600 mt-0.5 mr-2 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-gray-700 dark:text-neutral-300">
            <p className="font-medium mb-1">統計表IDについて</p>
            <p>
              e-STAT APIで利用可能な統計表のIDです。
              <a
                href="https://www.e-stat.go.jp/api/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-700 underline dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                公式サイト
              </a>
              で詳細を確認できます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
