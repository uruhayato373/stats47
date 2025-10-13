"use client";

import { AlertTriangle, Database, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";
import { RankingDataContainer } from "@/components/ranking/containers/RankingDataContainer";
import { useEstatData } from "@/hooks/ranking/useEstatData";
import { EstatStatsDataResponse } from "@/types/models/estat";
import { DisplayProps } from "./types";

export default function Display({ params, onSettingsChange }: DisplayProps) {
  // データ取得をここで行う
  const { data, error, isLoading } = useEstatData(params);
  const [rankingKey, setRankingKey] = useState<string | null>(null);
  const [rankingKeyLoading, setRankingKeyLoading] = useState(false);

  // paramsが変更されたときにranking_keyを検索
  useEffect(() => {
    if (params?.statsDataId && params?.categoryCode) {
      setRankingKeyLoading(true);
      fetch(
        `/api/estat/metainfo/ranking-key?statsDataId=${params.statsDataId}&cat01=${params.categoryCode}`
      )
        .then((res) => res.json())
        .then((data: unknown) => {
          const response = data as { rankingKey?: string };
          setRankingKey(response.rankingKey || null);
        })
        .catch((error) => {
          console.error("Failed to fetch ranking_key:", error);
          setRankingKey(null);
        })
        .finally(() => {
          setRankingKeyLoading(false);
        });
    } else {
      setRankingKey(null);
    }
  }, [params?.statsDataId, params?.categoryCode]);

  // データ取得成功時に自動保存
  useEffect(() => {
    if (data && params?.statsDataId && params?.categoryCode && rankingKey) {
      saveToDatabase(
        data as EstatStatsDataResponse,
        params.statsDataId,
        params.categoryCode
      );
    }
  }, [data, params, rankingKey]);

  const saveToDatabase = async (
    rawData: EstatStatsDataResponse,
    statsDataId: string,
    categoryCode: string
  ) => {
    try {
      const response = await fetch("/api/estat/ranking-values/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statsDataId,
          categoryCode,
          timeCode: "latest", // サーバーサイドでtimeCodeを決定
          rawData, // 生データを送信してサーバーサイドで変換
        }),
      });

      if (!response.ok) {
        console.error("保存失敗:", await response.text());
      } else {
        const result = (await response.json()) as {
          savedCount: number;
          timeCode: string;
        };
        console.log("データ保存成功:", {
          statsDataId,
          categoryCode,
          savedCount: result.savedCount,
          timeCode: result.timeCode,
        });
      }
    } catch (error) {
      console.error("保存エラー:", error);
    }
  };

  // ローディング状態
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
      {/* ランキングキー情報表示 */}
      {params && (
        <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <h3 className="font-medium text-gray-900 dark:text-neutral-100">
              ランキング情報
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700 dark:text-neutral-300">
                統計表ID:
              </span>
              <span className="ml-2 font-mono text-gray-600 dark:text-neutral-400 bg-gray-100 dark:bg-neutral-700 px-2 py-1 rounded">
                {params.statsDataId}
              </span>
            </div>

            {params.categoryCode && (
              <div>
                <span className="font-medium text-gray-700 dark:text-neutral-300">
                  カテゴリ:
                </span>
                <span className="ml-2 font-mono text-gray-600 dark:text-neutral-400 bg-gray-100 dark:bg-neutral-700 px-2 py-1 rounded">
                  {params.categoryCode}
                </span>
              </div>
            )}

            <div className="md:col-span-2">
              <span className="font-medium text-gray-700 dark:text-neutral-300">
                ランキングキー:
              </span>
              {rankingKeyLoading ? (
                <span className="ml-2 text-gray-500 dark:text-neutral-500">
                  検索中...
                </span>
              ) : rankingKey ? (
                <span className="ml-2 text-indigo-600 dark:text-indigo-400 font-mono text-sm bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded">
                  {rankingKey}
                </span>
              ) : (
                <span className="ml-2 text-gray-500 dark:text-neutral-500">
                  未設定
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RankingDataContainer（データ表示） */}
      {params && rankingKeyLoading && (
        <div className="p-8 text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-indigo-600 rounded-full"></div>
          <p className="mt-4 text-gray-600 dark:text-neutral-400">
            ランキングキーを検索中...
          </p>
        </div>
      )}

      {params && !rankingKeyLoading && !rankingKey && (
        <div className="p-6 text-center">
          <p className="text-gray-600 dark:text-neutral-400">
            このデータにはランキングキーが設定されていません
          </p>
        </div>
      )}

      {params && rankingKey && (
        <RankingDataContainer
          rankingKey={rankingKey}
          subcategory={{
            id: rankingKey,
            categoryId: "prefecture-ranking",
            name: "都道府県ランキング",
            unit: "",
          }}
          onSettingsChange={onSettingsChange}
        />
      )}
    </div>
  );
}
