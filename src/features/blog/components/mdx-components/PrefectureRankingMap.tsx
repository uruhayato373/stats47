/**
 * 都道府県ランキングマップコンポーネント（MDX用）
 *
 * MDXコンテンツ内で使用する都道府県ランキングマップ表示コンポーネント
 * ArticleContextからstatsDataIdとchartSettingsを取得してRankingMapCardを表示
 */

"use client";

import { useEffect, useState } from "react";

import { getRankingData } from "@/features/ranking/items/actions/getRankingData";
import { RankingMapCard } from "@/features/ranking/shared/components/RankingMapCard";

import type { StatsSchema } from "@/types/stats";

import { useArticleContext } from "../../contexts/ArticleContext";

/**
 * PrefectureRankingMapコンポーネントのprops
 */
interface PrefectureRankingMapProps {
  /** ランキングキー（オプショナル、propsがない場合はArticleContextから取得） */
  rankingKey?: string;
  /** 時間（年度など、オプショナル、propsがない場合はArticleContextから取得） */
  time?: string;
}

/**
 * 都道府県ランキングマップコンポーネント
 *
 * MDXコンテンツ内で使用する都道府県別ランキングマップを表示します。
 * propsでrankingKeyとtimeが渡された場合はそれを使用し、
 * 渡されていない場合はArticleContextから取得します。
 */
export function PrefectureRankingMap({
  rankingKey: propsRankingKey,
  time: propsTime,
}: PrefectureRankingMapProps = {}) {
  const context = useArticleContext();
  const { chartSettings, year: contextYear } = context;
  
  // propsが渡された場合はそれを優先、なければcontextから取得
  const rankingKey = propsRankingKey || (context as any).statsDataId;
  const time = propsTime || contextYear;
  const [rankingData, setRankingData] = useState<StatsSchema[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log("rankingKey", rankingKey);
  console.log("chartSettings", chartSettings);
  console.log("time", time);
  useEffect(() => {
    async function fetchData() {
      if (!rankingKey) {
        setError("rankingKeyが指定されていません");
        setIsLoading(false);
        return;
      }

      // 年度が指定されていない場合はエラーとする
      if (!time) {
        setError("timeが指定されていません");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // 都道府県データを取得（areaType: "prefecture"）
        // rankingKeyを使用
        const data = await getRankingData("prefecture", rankingKey, time);

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
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [rankingKey, time]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">地図データを読み込み中...</p>
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

  // chartSettingsからカラースキームと分岐点を取得
  const colorScheme = chartSettings?.colorScheme
    ? `interpolate${
        chartSettings.colorScheme.charAt(0).toUpperCase() +
        chartSettings.colorScheme.slice(1)
      }`
    : "interpolateBlues";

  // centerTypeを分岐点に変換
  let divergingMidpoint: "zero" | "mean" | "median" | undefined;
  if (chartSettings?.centerType) {
    divergingMidpoint = chartSettings.centerType;
  }

  return (
    <RankingMapCard
      data={rankingData}
      colorScheme={colorScheme}
      divergingMidpoint={divergingMidpoint}
      height={600}
    />
  );
}
