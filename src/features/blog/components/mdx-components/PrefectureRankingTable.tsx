/**
 * 都道府県ランキングテーブルコンポーネント（MDX用）
 * 
 * MDXコンテンツ内で使用する都道府県ランキングテーブル表示コンポーネント
 * ArticleContextからstatsDataIdを取得してRankingDataTableを表示
 */

"use client";

import { useEffect, useState } from "react";

import { getRankingData } from "@/features/ranking/items/actions/getRankingData";
import { getRankingItem } from "@/features/ranking/items/actions/getRankingItem";
import { RankingDataTable } from "@/features/ranking/shared/components/RankingDataTable";

import { useArticleContext } from "../../contexts/ArticleContext";

import type { StatsSchema } from "@/types/stats";
import type { RankingItem } from "@/features/ranking/items/types";

/**
 * 都道府県ランキングテーブルコンポーネント
 * 
 * MDXコンテンツ内で使用する都道府県別ランキングテーブルを表示します。
 * ArticleContextからstatsDataIdを取得し、ランキングデータとランキング項目情報を取得して表示します。
 */
export function PrefectureRankingTable() {
  const { statsDataId, year } = useArticleContext();
  const [rankingData, setRankingData] = useState<StatsSchema[] | null>(null);
  const [rankingItem, setRankingItem] = useState<RankingItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!statsDataId) {
        setError("statsDataIdが指定されていません");
        setIsLoading(false);
        return;
      }

      // 年度が指定されていない場合はエラーとする
      if (!year) {
        setError("年度が指定されていません");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // ランキング項目情報を取得（statsDataIdをrankingKeyとして使用）
        const item = await getRankingItem(statsDataId);
        if (!item) {
          setError("ランキング項目が見つかりませんでした");
          setRankingItem(null);
          setRankingData(null);
          setIsLoading(false);
          return;
        }

        setRankingItem(item);

        // 都道府県データを取得（areaType: "prefecture"）
        const data = await getRankingData("prefecture", statsDataId, year);

        if (!data || data.length === 0) {
          setError("ランキングデータが見つかりませんでした");
          setRankingData(null);
        } else {
          setRankingData(data);
        }
      } catch (err) {
        console.error("Failed to fetch ranking data:", err);
        setError(
          err instanceof Error
            ? err.message
            : "ランキングデータの取得に失敗しました"
        );
        setRankingData(null);
        setRankingItem(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [statsDataId, year]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">ランキングデータを読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!rankingData || rankingData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        データがありません
      </div>
    );
  }

  return (
    <RankingDataTable
      data={rankingData}
      rankingItem={rankingItem || undefined}
    />
  );
}

