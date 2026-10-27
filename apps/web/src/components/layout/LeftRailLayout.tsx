import { type ReactNode } from 'react';

import { cn } from '@stats47/components';

/**
 * ページ内ナビ用の左レール契約。
 *
 * PageShell / ArticleShell はページの surface が異なっても、この列幅・gap・表示境界を
 * 必ず共有する。feature 側へ responsive class を複製しない。
 *
 * 境界はビューポートではなく、Shell が名付けたコンテナ `@container/shell` の幅で判定する
 * (2026-10-27・テンプレート寄せ)。サイドバー (256px) を開いても畳んでも、左レールが
 * 出た時点の本文幅は 656px (936 - 264 - 16。compact は 896 - 224 - 16) を保つ。
 * 狭い幅の代替 UI (`LEFT_RAIL_NARROW_ONLY_CLASS`) も同じ shell コンテナの中に置かれる。
 */
export const LEFT_RAIL_GRID_CLASS =
  '@min-[936px]/shell:grid @min-[936px]/shell:grid-cols-[264px_minmax(0,1fr)] @min-[936px]/shell:gap-4 @min-[936px]/shell:items-start';
const COMPACT_LEFT_RAIL_GRID_CLASS =
  '@min-[896px]/shell:grid @min-[896px]/shell:grid-cols-[224px_minmax(0,1fr)] @min-[896px]/shell:gap-4 @min-[896px]/shell:items-start';

export const LEFT_RAIL_VISIBLE_CLASS = 'hidden @min-[936px]/shell:block';
const COMPACT_LEFT_RAIL_VISIBLE_CLASS = 'hidden @min-[896px]/shell:block';
export const LEFT_RAIL_NARROW_ONLY_CLASS = '@min-[936px]/shell:hidden';

interface LeftRailLayoutProps {
  leftRail: ReactNode;
  children: ReactNode;
  mainClassName?: string;
  /** データ中心のダッシュボードで、左ナビより本文幅を優先する。 */
  density?: 'default' | 'compact';
}

/**
 * 左レールと本文の横並びだけを所有する共有 composite。
 *
 * ページで唯一の `<main>` はルートレイアウトが持つため、本文の列は
 * `div[data-slot=shell-main]` で描く (main を入れ子にしない)。
 *
 * レールはページ本体と同じ自然スクロールに置く。sticky の有無を feature ごとに
 * 分岐させないことで、テーマ・調査・一覧ページの位置と到達性を揃える。
 */
export function LeftRailLayout({
  leftRail,
  children,
  mainClassName,
  density = 'default',
}: LeftRailLayoutProps) {
  const isCompact = density === 'compact';

  return (
    <div
      className={isCompact ? COMPACT_LEFT_RAIL_GRID_CLASS : LEFT_RAIL_GRID_CLASS}
    >
      <aside
        className={
          isCompact ? COMPACT_LEFT_RAIL_VISIBLE_CLASS : LEFT_RAIL_VISIBLE_CLASS
        }
      >
        {leftRail}
      </aside>
      <div data-slot="shell-main" className={cn('min-w-0', mainClassName)}>
        {children}
      </div>
    </div>
  );
}
