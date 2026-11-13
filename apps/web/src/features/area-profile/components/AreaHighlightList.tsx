import { hrefFor } from "@stats47/data-configs/content/href";
import { formatChartValue, formatUnitForDisplay } from '@stats47/data-configs/unit';
import { formatValueWithPrecision, resolveValuePrecision } from '@stats47/utils';

import Link from '@/components/atoms/SiteLink';
import { ValueTable } from '@/components/surface';

import type { HighlightTone } from '@stats47/area-profile';
import type { RankingValueDisplay } from '@stats47/ranking';

/** 一覧の 1 行。県は選定関数の AreaHighlight、市区町村はデータブックの指標を渡す。 */
export interface AreaHighlightListItem {
  rankingKey: string;
  /** リンク先。既定は都道府県ランキング (`/ranking/<key>`)。 */
  href?: string;
  label: string;
  rank: number;
  value: number;
  unit: string;
  /**
   * 表示単位 (`resolveRankingValueDisplay` が決めた単位・倍率・小数桁)。県の行が渡し、「113,685,917百万円」を「113.7兆円」と書く。
   * 市区町村の値は元の単位のまま書くので渡さない。
   */
  display?: RankingValueDisplay | null;
  year: string;
  /** 良否の色。極性が確定していない指標は neutral (選定関数が決める) */
  tone: HighlightTone;
  /** 家計調査など、値の範囲の注記 (例: 県庁所在市の値) */
  note?: string;
  /** 全国の順位 (例: 「全国 1位/1,015」)。市区町村ページだけが渡す */
  detail?: string;
}

interface AreaHighlightListProps {
  items: readonly AreaHighlightListItem[];
  /** 順位の列の見出し (「全国順位」「県内順位」など) */
  rankScope: string;
}

/**
 * 「指標・値・順位」の表。県ページの「特徴」カードと市区町村ページで共用する唯一の部品
 * (AREA-HIGHLIGHTS-SSOT-01 step 3)。2026-11-03 に色付きの順位チップのリストから共通の静的な表 (ValueTable) にした。
 * 市区町村ページは、すぐ下の「分野別のデータ」の表と同じ列 (指標・値・県内・全国) になる。
 * クリックは共通の NavClickTracker が `data-nav-surface="area_highlights"` で nav_click として数える。
 */
export function AreaHighlightList({ items, rankScope }: AreaHighlightListProps) {
  if (items.length === 0) return null;
  const hasNational = items.some((item) => item.detail);
  return (
    <div data-nav-surface="area_highlights">
      <ValueTable
        ariaLabel={rankScope}
        columns={[
          { key: 'metric', header: '指標', rowHeader: true, className: 'min-w-40' },
          { key: 'value', header: '値' },
          { key: 'rank', header: rankScope },
          ...(hasNational ? [{ key: 'national', header: '全国' }] : []),
        ]}
        rows={items.map((item) => ({
          key: item.rankingKey,
          cells: [
            <>
              <Link
                href={item.href ?? hrefFor('ranking', { rankingKey: item.rankingKey })}
                data-nav-label={item.rankingKey}
              >
                {item.label}
              </Link>
              <small className="block">
                {item.year}
                {item.note ? ` ※${item.note}` : ''}
              </small>
            </>,
            <>
              {item.display
                ? formatChartValue(item.value, { factor: item.display.factor, decimals: item.display.precision })
                : formatValueWithPrecision(item.value, resolveValuePrecision([item.value]))}
              <small className="ml-0.5">{item.display?.unit ?? formatUnitForDisplay(item.unit)}</small>
            </>,
            `${item.rank}位`,
            ...(hasNational ? [item.detail?.replace(/^全国\s*/, '') ?? '—'] : []),
          ],
        }))}
      />
    </div>
  );
}
