import { computeTopRankings, resolveNationalFigure, type RankingValue } from "@stats47/ranking";

import { resolveRankingPrecision } from "./compute-ranking-header-stats";

/**
 * 文中 (meta description・構造化データ) に書く値の丸め方を、データ全体から 1 度だけ決める。
 * 桁数は表と同じ `resolveRankingPrecision` で決め、3 桁区切りは付けない (既存の文の書き方を変えない)。
 * 観測値が 27.840522873303406 のような計算値のとき、FAQ の答えに丸めていない値が出ていた (2026-11-17)。
 */
export function createSummaryValueFormatter(rankingValues: readonly RankingValue[]): (value: number) => string {
  const precision = resolveRankingPrecision(
    rankingValues.map((v) => v.value).filter((v): v is number => v != null && Number.isFinite(v)),
  );
  return (value) => String(Number(value.toFixed(precision)));
}

/**
 * ランキングデータの要約情報（meta description / JSON-LD description 共通）
 */
interface RankingSummary {
  /** 1位の地域名 */
  top1Name: string;
  /** 1位の値（単位付き） */
  top1ValueText: string;
  /** 上位3位の地域名（カンマ区切り） */
  top3Names: string;
  /** 全国の基準値（例: "全国値123.4人" / "47都道府県の単純平均123.4人"） */
  avgText: string;
}

/**
 * ランキングデータから要約情報を抽出する。
 * データがない場合は null を返す。
 */
export function buildRankingSummary(
  rankingValues: RankingValue[],
  unit: string,
): RankingSummary | null {
  if (!rankingValues || rankingValues.length === 0) return null;

  const topRankings = computeTopRankings(rankingValues);
  if (topRankings.length === 0) return null;

  const top1 = topRankings[0];
  const formatValue = createSummaryValueFormatter(rankingValues);
  const top1ValueText = top1.value != null ? `${formatValue(top1.value)}${unit}` : "";
  const top3Names = topRankings
    .slice(0, 3)
    .map((d) => d.areaName)
    .join("、");

  const national = resolveNationalFigure(rankingValues);
  const avgText = national
    ? `${national.label}${Math.round(national.value * 10) / 10}${unit}`
    : "";

  return { top1Name: top1.areaName, top1ValueText, top3Names, avgText };
}
