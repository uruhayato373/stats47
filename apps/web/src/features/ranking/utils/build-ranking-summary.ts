import { computeTopRankings, resolveNationalFigure, type RankingValue } from "@stats47/ranking";

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
  const top1ValueText = top1.value != null ? `${top1.value}${unit}` : "";
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
