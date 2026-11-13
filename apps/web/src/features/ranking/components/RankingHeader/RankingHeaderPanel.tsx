import { buildRankingPageTitle } from "@stats47/ranking";

import { PageHeader } from "@/components/layout";

import type { AreaType } from "@stats47/types";

/** 最新年がこの年数以上前なら、古いデータとして目立たせる */
const STALE_AFTER_YEARS = 10;

interface RankingHeaderPanelProps {
  /** 表示中の指標の短い名称（計算方法の補足を含む） */
  metricTitle: string;
  areaType: AreaType;
  updatedAt?: string | null;
  /** 表示中の指標が持つ最新の年。無い指標は年を出さない */
  latestYear?: { yearCode: string; yearName: string } | null;
  /**
   * 古さを測る基準の年 (西暦)。サーバーが描画時に決めて渡す。ここで `new Date()` を読むと、
   * 年をまたいだ ISR キャッシュとブラウザで結果が食い違い、ハイドレーションが合わなくなる。
   */
  nowYear: number;
}

/**
 * ランキング詳細ページの見出し。
 *
 * h1 と最終更新を共通 PageHeader にまとめる。集計条件は可視化直下、
 * 年度は地図・テーブルの見出し、出典はページ末尾の一覧に置く。
 *
 * h1 の直下に「最新 2023年度」を添える (2026-10-26 オーナー決定)。年が上部のカードの小見出しと
 * 年の切り替えにしか無く、データが 2006 年度までの指標も最初の画面で最新に見えていたため。
 * h1 は検索結果のタイトルにも関わるので文言を変えない。最新年が 10 年以上前の指標だけ、
 * 注意の色と「10年以上前のデータ」の語で示す (色だけで意味を伝えない)。
 *
 * eyebrow は置かない。直上のパンくずが同じ `breadcrumbCategory.name` を
 * リンクとして既に出しており、eyebrow はその語をリンクでない形で繰り返すだけで
 * 情報も機能も増えなかった (2026-07-29 是正。/ranking 索引の eyebrow 撤去と同じ理由)。
 */
export function RankingHeaderPanel({
  metricTitle,
  areaType,
  updatedAt,
  latestYear,
  nowYear,
}: RankingHeaderPanelProps) {
  const updated = updatedAt ? new Date(updatedAt) : null;
  const date = updated && !Number.isNaN(updated.getTime())
    ? updated.toISOString().slice(0, 10)
    : null;

  // 年コードは先頭 4 桁が西暦 (formatYearName と同じ読み方)。年として読めないときは古いと決めつけない
  const latest = latestYear ? Number(latestYear.yearCode.slice(0, 4)) : Number.NaN;
  const isStale = Number.isInteger(latest) && nowYear - latest >= STALE_AFTER_YEARS;

  return (
    <PageHeader
      className="mb-0"
      title={buildRankingPageTitle(metricTitle, areaType)}
      meta={latestYear && (
        <span
          data-latest-year
          data-stale={isStale ? "true" : undefined}
          className={isStale ? "font-medium text-warning" : undefined}
        >
          最新 {latestYear.yearName}
          {isStale && "（10年以上前のデータ）"}
        </span>
      )}
      actions={date && (
        <p className="whitespace-nowrap text-xs text-muted-foreground sm:leading-8">
          最終更新 <time dateTime={date}>{date}</time>
        </p>
      )}
    />
  );
}
