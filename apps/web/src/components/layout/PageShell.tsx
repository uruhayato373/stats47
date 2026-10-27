import { type ReactNode } from 'react';

import { cn } from '@stats47/components';

import { LEFT_RAIL_NARROW_ONLY_CLASS, LeftRailLayout } from './LeftRailLayout';

interface PageShellProps {
  /** 中央メインコンテンツ */
  children: ReactNode;
  /**
   * 本文の性質
   * - `default`: ダッシュボード / 一覧（幅いっぱい使う）
   * - `reading`: 記事本文（本文カラムを READING_MAX に制限して可読性を確保）
   */
  variant?: 'default' | 'reading';
  /**
   * shell コンテナ 988px 以上で右に表示するサイドレール（関連 widget / 広告）。
   * 省略すると右レールなし
   */
  rightRail?: ReactNode;
  /**
   * shell コンテナ 936px 以上で左に表示するサイドレール（ページ内ナビ）。省略すると左レールなし。
   */
  leftRail?: ReactNode;
  /** 左ナビを狭め、データの表示幅を優先する。寸法は LeftRailLayout が所有。 */
  leftRailDensity?: 'default' | 'compact';
  /**
   * 左レールが出ない幅で左レールをどう扱うか。
   * - `stack`（既定）: 本文の下に積む。関連リンク集など「読み終えた後で見る」もの向け
   * - `hide`: 描画しない。**ページ内容を切り替えるナビ**はページ末尾に置くと操作対象より
   *   後ろに来て意味を失うため、狭幅では非表示にし、代替 UI をページ側が本文上部に出す
   *   （テーマページ = ヘッダーの `LEFT_RAIL_NARROW_ONLY_CLASS`）。
   *   ★代替 UI 側も同じ共有クラスを使うこと。ずれると両方出る幅ができる
   */
  leftRailNarrowBehavior?: 'stack' | 'hide';
  /** 追加 className（外側コンテナに当てる） */
  className?: string;
}

/**
 * サイト chrome (Footer / 固定バナー等) がページ本文と横幅を揃えるための共有トークン。
 * page.tsx は PageShell を使い、これを直接使うのは chrome のみ。
 *
 * 2026-07-11: 1700px → 1280px に統一 (ArticleShell = blog/ranking 詳細と同一幅)。
 * 2026-10-27: 横の余白はテンプレートの p-4 に寄せた。本文の余白はルートレイアウトの
 * main#main-content (p-4) が持つので、PageShell / ArticleShell 自身は余白を持たない。
 * chrome は main の外にあるため、同じ 16px をこのトークンで付ける。
 */
export const SHELL_WIDTH_CLASS = 'mx-auto w-full max-w-[1280px] px-4';

/**
 * PageShell / ArticleShell の外枠。幅の上限と、レール境界を判定する名前付きコンテナ
 * `@container/shell` を持つ。余白は main#main-content の p-4 に任せる。
 *
 * サイドバーの開閉で本文の幅が変わるため、レールの出現はビューポートではなく
 * このコンテナの幅で決める (左 936px・右 988px。どちらも本文 656px を保つ値)。
 */
export const SHELL_CONTAINER_CLASS = '@container/shell mx-auto w-full max-w-[1280px]';

/**
 * 右レールの列と表示境界。PageShell / ArticleShell で共有する。
 * 988px = 本文 656px + gap 16px + 右レール 316px。
 */
export const RIGHT_RAIL_GRID_CLASS =
  '@min-[988px]/shell:grid @min-[988px]/shell:grid-cols-[minmax(0,1fr)_316px] @min-[988px]/shell:gap-4 @min-[988px]/shell:items-start';

/**
 * 全ページ共通の単一レイアウト Shell。
 *
 * 横幅・サイドレールの SSOT。各 page.tsx は `container mx-auto` や
 * `max-w-[…]` を直接書かず、必ず本コンポーネントを経由する。
 *
 * 設計仕様: docs/01_技術設計/04_デザインシステム.md
 *
 * グリッド (境界はすべて shell コンテナの幅):
 * - レールなし     : 1280px 中央寄せ
 * - 右レールのみ   : 988px 以上で [minmax(0,1fr) 316px]
 * - 左レールのみ   : 936px 以上で [264px minmax(0,1fr)] (compact は 896px 以上で 224px)
 *
 * 右レール 316px と gap 16px は ArticleShell と同値。同じ `RightRailWidgets` を描画するため、
 * 両 Shell で幅を揃える。300×250 の `SidebarPromoBanner` は Card で囲まず、このレール内に
 * 等倍で表示する。
 *
 * NOTE: grid-template-columns は Tailwind JIT のため静的クラス文字列で持つ
 * （動的 px 連結は purge されるため不可）。
 */
export function PageShell({
  children,
  variant = 'default',
  rightRail,
  leftRail,
  leftRailDensity,
  leftRailNarrowBehavior = 'stack',
  className,
}: PageShellProps) {
  const hasRight = !!rightRail;
  const hasLeft = !!leftRail;
  const showLeft = hasLeft && !hasRight;

  // reading variant は本文カラムを可読幅に制限（レールが無い場合は中央寄せ）
  const mainClass = cn(
    'min-w-0',
    variant === 'reading' &&
      'mx-auto w-full max-w-[760px] @min-[988px]/shell:mx-0'
  );

  return (
    <div className={cn(SHELL_CONTAINER_CLASS, className)}>
      {showLeft ? (
        <>
          <LeftRailLayout
            leftRail={leftRail}
            mainClassName={mainClass}
            density={leftRailDensity}
          >
            {children}
          </LeftRailLayout>
          {leftRailNarrowBehavior === 'stack' && (
            <div className={cn('mt-4 space-y-4', LEFT_RAIL_NARROW_ONLY_CLASS)}>
              {leftRail}
            </div>
          )}
        </>
      ) : hasRight ? (
        <div className={RIGHT_RAIL_GRID_CLASS}>
          <div data-slot="shell-main" className={mainClass}>
            {children}
          </div>
          <div className="mt-4 space-y-4 @min-[988px]/shell:mt-0">
            {rightRail}
          </div>
        </div>
      ) : (
        <div data-slot="shell-main" className={mainClass}>
          {children}
        </div>
      )}
    </div>
  );
}
