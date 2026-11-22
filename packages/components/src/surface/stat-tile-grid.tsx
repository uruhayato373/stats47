import { Children, type ReactNode } from 'react';

import { cn } from '../lib/cn';

import { PanelGrid } from './panel-grid';

/*
 * 数値タイルの格子 (部品の種類「数値タイルの格子」。2026-10-29)。数値タイル (StatTile) を並べる所はすべてこれを使う。
 *
 * 列の数は本文の幅 (コンテナクエリ) だけで決め、ページの側では指定させない:
 *   幅 768px 未満 = 2 列 / 768px 以上 = 4 列。
 * スマホの幅でも 2 列にする (2026-11-14 オーナー決定)。1 列だと 1 指標のカードが縦に積まれ、テーマの県別ページは
 * スマホの幅の中央値で約 6 画面、多いテーマは 12〜34 画面あった。幅 390px で 2 列にしても値と推移の図は収まる。
 * タイルの枚数では変えない (2026-10-29 オーナー決定「幅を 4 列にそろえる」)。1 枚・2 枚の章も同じ大きさのマスに入れ、
 * 残りのマスは白いセルで埋める。どのページ・どの章でも 1 マスの幅が同じになる。
 * 768px は県ページの本文 (約 844px) で 4 列、右レールのあるページの本文 (656px) で 2 列になる境界。
 * 3 列は使わない。男女の対比のように 2 枚で 1 組のタイルが、どの幅でも同じ行に並ぶようにするため。
 * チャート付きのタイルも同じ大きさのセルに入れる (2026-10-29 オーナー決定「すべて同じ列数」)。同じ行のタイルは
 * 高さがそろい、タイルのリンク行は下端にそろう。最終行の空きマスは白いセルで埋める (線の格子は空きマスが灰色に見えるため)。
 *
 * 例外 (2026-11-22): テーマの章のように 1 枚だけが単独で並ぶ所は、4 列の 1 マスだけを置いて残りの 3 マスを白いセルで埋めると
 * 空きが目立つ。`fillWhenSingle` を付けた格子は、1 枚のときだけ 1 列 (横幅いっぱい) にして白いセルを置かない。2 枚以上は上の規則のまま。
 *
 * 仕様の正本は部品の台帳 data/design/components.json の stat-tile-grid。
 */

/** 列の数 (幅の境界は @md = 768px。apps/web/src/app/globals.css の @custom-variant) */
const COLUMN_CLASS = 'grid-cols-2 @md:grid-cols-4';

/** 最終行の空きマスの数 (列数 cols で n 枚を並べたとき) */
function remainder(n: number, cols: number): number {
  return (cols - (n % cols)) % cols;
}

/** 幅ごとの空きマスを埋める白いセルの class。2 列の幅と 4 列の幅で必要な数が違うので、幅ごとに出し分ける */
export function statTileGridFillers(count: number): string[] {
  const two = remainder(count, 2);
  const four = remainder(count, 4);
  return Array.from({ length: Math.max(two, four) }, (_, i) =>
    cn(i < two ? 'block' : 'hidden', i < four ? '@md:block' : '@md:hidden')
  );
}

interface StatTileGridProps {
  /** 数値タイル (StatTile、またはそれを包むだけの要素)。数値の要約の表のカードも同じ大きさのセルとして並べてよい */
  children: ReactNode;
  /** 格子の最後の 1 行に全幅で置く注記 */
  footnote?: ReactNode;
  /** 1 枚だけのとき、4 列の 1 マスと白いセルにせず横幅いっぱいの 1 列にする (テーマの章の単独のカード) */
  fillWhenSingle?: boolean;
}

export function StatTileGrid({ children, footnote, fillWhenSingle = false }: StatTileGridProps) {
  const count = Children.toArray(children).length;
  if (count === 0) return null;
  const single = fillWhenSingle && count === 1;
  return (
    <div data-slot-kind="stat-tile-grid" className="@container">
      <PanelGrid className={single ? 'grid-cols-1' : COLUMN_CLASS}>
        {children}
        {(single ? [] : statTileGridFillers(count)).map((className, i) => (
          <div key={`filler-${i}`} aria-hidden="true" data-cell="flush" className={className} />
        ))}
        {footnote ? (
          <p className="col-span-full text-xs tabular-nums text-muted-foreground">{footnote}</p>
        ) : null}
      </PanelGrid>
    </div>
  );
}
