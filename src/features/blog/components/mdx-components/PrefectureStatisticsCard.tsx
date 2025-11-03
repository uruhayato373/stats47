/**
 * 都道府県統計カードコンポーネント（MDX用）
 * 
 * MDXコンテンツ内で使用する統計カード表示コンポーネント
 * ArticleContextからstatsDataIdを取得してランキングデータの統計情報を表示
 */

"use client";

import { useEffect, useMemo, useState } from "react";

import { getRankingData } from "@/features/ranking/items/actions/getRankingData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/ui/card";

import { useArticleContext } from "../../contexts/ArticleContext";

import type { StatsSchema } from "@/types/stats";

/**
 * PrefectureStatisticsCardコンポーネントのprops
 */
interface PrefectureStatisticsCardProps {
  /** ランキングキー（オプショナル、propsがない場合はArticleContextから取得） */
  rankingKey?: string;
  /** 時間（年度など、オプショナル、propsがない場合はArticleContextから取得） */
  time?: string;
}

/**
 * 都道府県統計カードコンポーネント
 * 
 * MDXコンテンツ内で使用する統計情報カードを表示します。
 * propsでrankingKeyとtimeが渡された場合はそれを使用し、
 * 渡されていない場合はArticleContextから取得します。
 */
export function PrefectureStatisticsCard({
  rankingKey: propsRankingKey,
  time: propsTime,
}: PrefectureStatisticsCardProps = {}) {
  const context = useArticleContext();
  const { chartSettings, year: contextYear } = context;
  
  // propsが渡された場合はそれを優先、なければcontextから取得
  const rankingKey = propsRankingKey || (context as any).statsDataId;
  const time = propsTime || contextYear;
  const [rankingData, setRankingData] = useState<StatsSchema[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // 統計情報を計算
  const statistics = useMemo(() => {
    if (!rankingData || rankingData.length === 0) {
      return null;
    }

    // areaCode=00000（全国合計）を除外
    const filtered = rankingData.filter((item) => item.areaCode !== "00000");

    if (filtered.length === 0) {
      return null;
    }

    const values = filtered.map((item) => item.value).sort((a, b) => a - b);
    const unit = filtered[0]?.unit || "";

    const sum = values.reduce((s, v) => s + v, 0);
    const average = sum / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);

    // 中央値の計算
    const median =
      values.length % 2 === 0
        ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2
        : values[Math.floor(values.length / 2)];

    // 最大・最小の都道府県
    const maxItem = filtered.find((item) => item.value === max);
    const minItem = filtered.find((item) => item.value === min);

    return {
      count: filtered.length,
      sum,
      average,
      median,
      max,
      min,
      maxPrefecture: maxItem?.areaName || "",
      minPrefecture: minItem?.areaName || "",
      unit,
    };
  }, [rankingData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">統計データを読み込み中...</p>
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

  if (!rankingData || rankingData.length === 0 || !statistics) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        データがありません
      </div>
    );
  }

  // 数値をフォーマット（カンマ区切り）
  const formatValue = (value: number): string => {
    return value.toLocaleString("ja-JP");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">統計情報</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* 平均 */}
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">平均</div>
            <div className="text-2xl font-bold">
              {formatValue(statistics.average)}
            </div>
            {statistics.unit && (
              <div className="text-xs text-muted-foreground">
                {statistics.unit}
              </div>
            )}
          </div>

          {/* 中央値 */}
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">中央値</div>
            <div className="text-2xl font-bold">
              {formatValue(statistics.median)}
            </div>
            {statistics.unit && (
              <div className="text-xs text-muted-foreground">
                {statistics.unit}
              </div>
            )}
          </div>

          {/* 最大値 */}
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">最大値</div>
            <div className="text-2xl font-bold">
              {formatValue(statistics.max)}
            </div>
            {statistics.unit && (
              <div className="text-xs text-muted-foreground">
                {statistics.unit}
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              ({statistics.maxPrefecture})
            </div>
          </div>

          {/* 最小値 */}
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">最小値</div>
            <div className="text-2xl font-bold">
              {formatValue(statistics.min)}
            </div>
            {statistics.unit && (
              <div className="text-xs text-muted-foreground">
                {statistics.unit}
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              ({statistics.minPrefecture})
            </div>
          </div>

          {/* 合計 */}
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">合計</div>
            <div className="text-2xl font-bold">
              {formatValue(statistics.sum)}
            </div>
            {statistics.unit && (
              <div className="text-xs text-muted-foreground">
                {statistics.unit}
              </div>
            )}
          </div>

          {/* 都道府県数 */}
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">都道府県数</div>
            <div className="text-2xl font-bold">{statistics.count}</div>
            <div className="text-xs text-muted-foreground">件</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

