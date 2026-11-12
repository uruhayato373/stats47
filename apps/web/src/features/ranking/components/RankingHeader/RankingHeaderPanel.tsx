import { buildRankingPageTitle } from "@stats47/ranking";

import { PageHeader } from "@/components/layout";

import type { AreaType } from "@stats47/types";

interface RankingHeaderPanelProps {
  /** 表示中の指標の短い名称（計算方法の補足を含む） */
  metricTitle: string;
  areaType: AreaType;
  updatedAt?: string | null;
}

/**
 * ランキング詳細ページの見出し。
 *
 * h1 と最終更新を共通 PageHeader にまとめる。集計条件は可視化直下、
 * 年度は地図・テーブルの見出し、出典はページ末尾の一覧に置く。
 *
 * eyebrow は置かない。直上のパンくずが同じ `breadcrumbCategory.name` を
 * リンクとして既に出しており、eyebrow はその語をリンクでない形で繰り返すだけで
 * 情報も機能も増えなかった (2026-07-29 是正。/ranking 索引の eyebrow 撤去と同じ理由)。
 */
export function RankingHeaderPanel({ metricTitle, areaType, updatedAt }: RankingHeaderPanelProps) {
  const updated = updatedAt ? new Date(updatedAt) : null;
  const date = updated && !Number.isNaN(updated.getTime())
    ? updated.toISOString().slice(0, 10)
    : null;

  return (
    <PageHeader
      className="mb-0"
      title={buildRankingPageTitle(metricTitle, areaType)}
      actions={date && (
        <p className="whitespace-nowrap text-xs text-muted-foreground sm:leading-8">
          最終更新 <time dateTime={date}>{date}</time>
        </p>
      )}
    />
  );
}
