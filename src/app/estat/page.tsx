"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import StatsIdInput from "@/components/estat/StatsIdInput";
import MetaInfoCard from "@/components/estat/MetaInfoCard";
import { estatAPI } from "@/services/estat-api";
import { EstatMetaInfoResponse } from "@/types/estat";

export default function EstatMetaPage() {
  const [metaInfo, setMetaInfo] = useState<EstatMetaInfoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStatsId, setCurrentStatsId] = useState<string>("");

  const handleFetchMetaInfo = async (statsDataId: string) => {
    setLoading(true);
    setError(null);
    setCurrentStatsId(statsDataId);

    try {
      const response = await estatAPI.getMetaInfo({ statsDataId });
      setMetaInfo(response);
    } catch (err) {
      console.error("Meta info fetch error:", err);
      setError(
        err instanceof Error ? err.message : "不明なエラーが発生しました"
      );
      setMetaInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (currentStatsId) {
      handleFetchMetaInfo(currentStatsId);
    }
  };

  return (
    <>
      <Header />
      <Sidebar />

      <main className="lg:ps-60 transition-all duration-300 pt-13 px-3 pb-3 min-h-screen">
        <div className="bg-white border border-gray-200 shadow-xs rounded-lg dark:bg-neutral-800 dark:border-neutral-700">
          <div className="py-3 px-4 flex flex-wrap justify-between items-center gap-2 bg-white border-b border-gray-200 dark:bg-neutral-800 dark:border-neutral-700">
            <div>
              <h1 className="font-medium text-lg text-gray-800 dark:text-neutral-200">
                e-STAT メタ情報
              </h1>
              {currentStatsId && (
                <p className="text-sm text-gray-600 dark:text-neutral-400 mt-1">
                  統計表ID:{" "}
                  <span className="font-mono bg-white border border-gray-200 text-gray-800 px-2 py-1 rounded dark:bg-neutral-700 dark:text-neutral-300">
                    {currentStatsId}
                  </span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-x-2">
              {currentStatsId && (
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={loading}
                  className="py-1.5 px-2.5 inline-flex items-center gap-x-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-xs hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
                >
                  <svg
                    className="size-3"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9 0 0 1-6.74-2.74L3 16" />
                    <path d="M8 16H3v5" />
                  </svg>
                  更新
                </button>
              )}
              <a
                href="https://www.e-stat.go.jp/api/"
                target="_blank"
                rel="noopener noreferrer"
                className="py-1.5 px-2.5 inline-flex items-center gap-x-1.5 text-xs font-medium rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 focus:outline-hidden focus:bg-indigo-600"
              >
                <svg
                  className="size-3"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15,3 21,3 21,9" />
                  <line x1="10" x2="21" y1="14" y2="3" />
                </svg>
                e-STAT API
              </a>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-neutral-900">
            <div className="max-w-7xl mx-auto space-y-4">
              <StatsIdInput onSubmit={handleFetchMetaInfo} loading={loading} />

              <MetaInfoCard
                metaInfo={metaInfo}
                loading={loading}
                error={error}
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
