"use client";

import { useMemo } from "react";

import { formatValueWithPrecision } from "@stats47/utils";

import { ChartCard } from "@/components/charts/ChartCard";
import { MiniLineChart } from "@/components/charts/MiniCharts";

import type { RankingNationalTrendSnapshot } from "@stats47/ranking";

interface NationalTrendCardProps {
  /** 事前生成済み全国時系列 (app/ranking/<key>/national-trend.json)。未生成なら null */
  nationalTrend: RankingNationalTrendSnapshot | null;
  /**
   * 現在選択中の正規化基準。undefined / 未知の値は "original" として扱う
   * (URL の ?norm= はユーザー制御値なので信頼しない)。
   */
  normalizationType?: string;
  decimalPlaces?: number;
}

const DEFAULT_BASIS = "original";

/**
 * 全国平均の推移カード。
 *
 * 値は writer が事前計算した「47 都道府県の単純算術平均」で、ヒーローカードが単年で出す
 * 「全国平均」と同じ定義。基準 (総数 / 人口10万人あたり / 面積100km²あたり) を切り替えると
 * 対応する series に切り替わる。追加 fetch は無い (snapshot 1 つに全 series が入っている)。
 *
 * データが無い (未生成 / 1 年しか無い) 場合は何も描画しない。
 */
export function NationalTrendCard({
  nationalTrend,
  normalizationType,
  decimalPlaces = 1,
}: NationalTrendCardProps) {
  const series = useMemo(() => {
    if (!nationalTrend) return null;
    const basis = normalizationType ?? DEFAULT_BASIS;
    return (
      nationalTrend.series.find((s) => s.basis === basis) ??
      nationalTrend.series.find((s) => s.basis === DEFAULT_BASIS) ??
      null
    );
  }, [nationalTrend, normalizationType]);

  const points = useMemo(() => {
    if (!series) return [];
    // snapshot は年降順。折れ線は年昇順で描く
    return [...series.points]
      .map((p) => ({ year: Number.parseInt(p.yearCode, 10), value: p.average }))
      .filter((p) => Number.isFinite(p.year) && Number.isFinite(p.value))
      .sort((a, b) => a.year - b.year);
  }, [series]);

  // 1 点だけでは推移にならないので描画しない
  if (!series || points.length < 2) return null;

  const latest = points[points.length - 1];
  const oldest = points[0];
  const deltaRatio = oldest.value !== 0 ? (latest.value - oldest.value) / oldest.value : null;

  return (
    <ChartCard
      label={`全国平均の推移 (${series.label})`}
      value={`${formatValueWithPrecision(latest.value, decimalPlaces)}${series.unit}`}
      chart={
        <MiniLineChart points={points} seriesName="全国平均" unit={series.unit} />
      }
      footer={
        <span>
          {oldest.year}〜{latest.year}年
          {deltaRatio !== null && (
            <>
              {" ・ "}
              {deltaRatio >= 0 ? "+" : ""}
              {(deltaRatio * 100).toFixed(1)}%
            </>
          )}
          {" ・ 47都道府県の単純平均"}
        </span>
      }
    />
  );
}
