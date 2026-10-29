import { Children, type ReactNode } from 'react';

import { cn } from '../lib/cn';

import { PanelGrid } from './panel-grid';

/*
 * 数値タイルの格子 (部品の種類「数値タイルの格子」。2026-10-29)。数値タイル (StatTile) を並べる所はすべてこれを使う。
 *
 * 列の数は本文の幅 (コンテナクエリ) だけで決め、ページの側では指定させない:
 *   幅 480px 未満 = 1 列 / 480px 以上 = 2 列 / 768px 以上 = 4 列 (上限はタイルの枚数)。
 * 768px は県ページの本文 (約 844px) で 4 列、右レールのあるページの本文 (656px) で 2 列になる境界。
 * 3 列は使わない。男女の対比のように 2 枚で 1 組のタイルが、どの幅でも同じ行に並ぶようにするため。
 * チャート付きのタイルも同じ大きさのセルに入れる (2026-10-29 オーナー決定「すべて同じ列数」)。同じ行のタイルは
 * 高さがそろい、タイルのリンク行は下端にそろう。最終行の空きマスは白いセルで埋める (線の格子は空きマスが灰色に見えるため)。
 *
 * 仕様の正本は部品の台帳 data/design/components.json の stat-tile-grid。
 */

/** 列の数の上限ごとの class (幅の境界は @sm = 480px・@md = 768px。apps/web/src/app/globals.css の @custom-variant) */
const COLUMN_CLASS: Record<1 | 2 | 4, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 @sm:grid-cols-2',
  4: 'grid-cols-1 @sm:grid-cols-2 @md:grid-cols-4',
};

/** 枚数から列の数の上限を決める (1 枚 = 1 列、2〜3 枚 = 2 列、4 枚以上 = 4 列) */
export function statTileGridColumns(count: number): 1 | 2 | 4 {
  if (count <= 1) return 1;
  if (count <= 3) return 2;
  return 4;
}

/** 最終行の空きマスの数 (列数 cols で n 枚を並べたとき) */
function remainder(n: number, cols: number): number {
  return (cols - (n % cols)) % cols;
}

/** 幅ごとの空きマスを埋める白いセルの class。2 列の幅と 4 列の幅で必要な数が違うので、幅ごとに出し分ける */
export function statTileGridFillers(count: number): string[] {
  const columns = statTileGridColumns(count);
  const two = columns >= 2 ? remainder(count, 2) : 0;
  const four = columns === 4 ? remainder(count, 4) : 0;
  return Array.from({ length: Math.max(two, four) }, (_, i) =>
    cn('hidden', i < two && '@sm:block', columns === 4 && (i < four ? '@md:block' : '@md:hidden'))
  );
}

interface StatTileGridProps {
  /** 数値タイル (StatTile、またはそれを包むだけの要素)。数値の要約の表のカードも同じ大きさのセルとして並べてよい */
  children: ReactNode;
  /** 格子の最後の 1 行に全幅で置く注記 */
  footnote?: ReactNode;
}

export function StatTileGrid({ children, footnote }: StatTileGridProps) {
  const count = Children.toArray(children).length;
  if (count === 0) return null;
  return (
    <div data-slot-kind="stat-tile-grid" className="@container">
      <PanelGrid className={COLUMN_CLASS[statTileGridColumns(count)]}>
        {children}
        {statTileGridFillers(count).map((className, i) => (
          <div key={`filler-${i}`} aria-hidden="true" data-cell="flush" className={className} />
        ))}
        {footnote ? (
          <p className="col-span-full text-xs tabular-nums text-muted-foreground">{footnote}</p>
        ) : null}
      </PanelGrid>
    </div>
  );
}
