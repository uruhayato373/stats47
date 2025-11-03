/**
 * 都道府県ランキングハイライトコンポーネント（MDX用）
 *
 * MDXコンテンツ内で使用する上位・下位県のハイライト表示コンポーネント
 */

"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/ui/card";

import { getRankingData } from "@/features/ranking/items/actions/getRankingData";

import type { StatsSchema } from "@/types/stats";

/**
 * PrefectureRankingHighlightsコンポーネントのprops
 */
interface PrefectureRankingHighlightsProps {
  /** ランキングキー */
  rankingKey: string;
  /** 時間（年度など） */
  time: string;
}

/**
 * 都道府県ランキングハイライトコンポーネント
 *
 * MDXコンテンツ内で使用する上位・下位県のハイライトを表示します。
 */
export function PrefectureRankingHighlights({
  rankingKey,
  time,
}: PrefectureRankingHighlightsProps) {
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

  // 上位5位と下位5位を計算
  const { top5, bottom5, unit } = useMemo(() => {
    if (!rankingData || rankingData.length === 0) {
      return { top5: [], bottom5: [], unit: "" };
    }

    // areaCode=00000（全国合計）を除外
    const filtered = rankingData.filter((item) => item.areaCode !== "00000");

    // 値でソート（降順）
    const sorted = [...filtered].sort((a, b) => b.value - a.value);

    // 単位を取得
    const firstItem = sorted[0];
    const itemUnit = firstItem?.unit || "";

    // 上位5位と下位5位
    const top = sorted.slice(0, 5).map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
    const bottom = sorted
      .slice(-5)
      .reverse()
      .map((item, index) => ({
        ...item,
        rank: sorted.length - 4 + index,
      }));

    return { top5: top, bottom5: bottom, unit: itemUnit };
  }, [rankingData]);

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

  if (!rankingData || rankingData.length === 0 || top5.length === 0) {
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
    <div className="grid gap-6 md:grid-cols-2">
      {/* 上位5位 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">上位5位</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {top5.map((item) => (
              <div
                key={item.areaCode}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                    {item.rank}
                  </span>
                  <span className="font-medium">{item.areaName}</span>
                </div>
                <div className="text-right">
                  <div className="font-mono font-semibold">
                    {formatValue(item.value)}
                  </div>
                  {unit && (
                    <div className="text-xs text-muted-foreground">{unit}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 下位5位 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">下位5位</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {bottom5.map((item) => (
              <div
                key={item.areaCode}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-bold">
                    {item.rank}
                  </span>
                  <span className="font-medium">{item.areaName}</span>
                </div>
                <div className="text-right">
                  <div className="font-mono font-semibold">
                    {formatValue(item.value)}
                  </div>
                  {unit && (
                    <div className="text-xs text-muted-foreground">{unit}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
