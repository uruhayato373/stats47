/**
 * 都道府県ランキング地域別分析コンポーネント（MDX用）
 *
 * MDXコンテンツ内で使用する地域別分析表示コンポーネント
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
 * PrefectureRankingRegionコンポーネントのprops
 */
interface PrefectureRankingRegionProps {
  /** ランキングキー */
  rankingKey: string;
  /** 時間（年度など） */
  time: string;
}

/**
 * 地域定義
 */
const REGIONS = {
  北海道: ["北海道"],
  東北: ["青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"],
  関東: [
    "茨城県",
    "栃木県",
    "群馬県",
    "埼玉県",
    "千葉県",
    "東京都",
    "神奈川県",
  ],
  中部: [
    "新潟県",
    "富山県",
    "石川県",
    "福井県",
    "山梨県",
    "長野県",
    "岐阜県",
    "静岡県",
    "愛知県",
  ],
  近畿: [
    "三重県",
    "滋賀県",
    "京都府",
    "大阪府",
    "兵庫県",
    "奈良県",
    "和歌山県",
  ],
  中国: ["鳥取県", "島根県", "岡山県", "広島県", "山口県"],
  四国: ["徳島県", "香川県", "愛媛県", "高知県"],
  九州: [
    "福岡県",
    "佐賀県",
    "長崎県",
    "熊本県",
    "大分県",
    "宮崎県",
    "鹿児島県",
    "沖縄県",
  ],
} as const;

type RegionName = keyof typeof REGIONS;

/**
 * 地域別集計結果
 */
interface RegionSummary {
  region: RegionName;
  count: number;
  total: number;
  average: number;
  max: number;
  min: number;
  maxPrefecture: string;
  minPrefecture: string;
  unit: string;
}

/**
 * 都道府県ランキング地域別分析コンポーネント
 *
 * MDXコンテンツ内で使用する地域別分析を表示します。
 */
export function PrefectureRankingRegion({
  rankingKey,
  time,
}: PrefectureRankingRegionProps) {
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

  // 地域別集計
  const regionSummaries = useMemo<RegionSummary[]>(() => {
    if (!rankingData || rankingData.length === 0) {
      return [];
    }

    // areaCode=00000（全国合計）を除外
    const filtered = rankingData.filter((item) => item.areaCode !== "00000");

    // 単位を取得
    const unit = filtered[0]?.unit || "";

    // 地域別に集計
    const summaries: RegionSummary[] = Object.entries(REGIONS).map(
      ([regionName, prefectureNames]) => {
        const regionData = filtered.filter((item) =>
          (prefectureNames as readonly string[]).includes(item.areaName)
        );

        if (regionData.length === 0) {
          return {
            region: regionName as RegionName,
            count: 0,
            total: 0,
            average: 0,
            max: 0,
            min: 0,
            maxPrefecture: "",
            minPrefecture: "",
            unit,
          };
        }

        const values = regionData.map((item) => item.value);
        const total = values.reduce((sum, val) => sum + val, 0);
        const average = total / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);
        const maxItem = regionData.find((item) => item.value === max);
        const minItem = regionData.find((item) => item.value === min);

        return {
          region: regionName as RegionName,
          count: regionData.length,
          total,
          average,
          max,
          min,
          maxPrefecture: maxItem?.areaName || "",
          minPrefecture: minItem?.areaName || "",
          unit,
        };
      }
    );

    // 集計方法に応じてソート（デフォルトは平均でソート）
    summaries.sort((a, b) => {
      // 平均でソート（デフォルト）
      return b.average - a.average;
    });

    return summaries;
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

  if (
    !rankingData ||
    rankingData.length === 0 ||
    regionSummaries.length === 0
  ) {
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

  // 集計方法のラベル（デフォルトは平均）
  const aggregateLabel = "平均";

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {regionSummaries.map((summary) => (
        <Card key={summary.region}>
          <CardHeader>
            <CardTitle className="text-lg">{summary.region}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{aggregateLabel}:</span>
                <span className="font-mono font-semibold">
                  {formatValue(summary.average)}
                </span>
                {summary.unit && (
                  <span className="text-xs text-muted-foreground">
                    {summary.unit}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">最高:</span>
                <span className="font-mono">
                  {formatValue(summary.max)} {summary.unit}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                ({summary.maxPrefecture})
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">最低:</span>
                <span className="font-mono">
                  {formatValue(summary.min)} {summary.unit}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                ({summary.minPrefecture})
              </div>
              <div className="flex items-center justify-between text-sm border-t pt-2">
                <span className="text-muted-foreground">都道府県数:</span>
                <span className="font-medium">{summary.count}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
