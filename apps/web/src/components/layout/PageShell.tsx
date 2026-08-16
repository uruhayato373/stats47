import { type ReactNode } from "react";

import { cn } from "@stats47/components";

interface PageShellProps {
  /** 中央メインコンテンツ */
  children: ReactNode;
  /**
   * 本文の性質
   * - `default`: ダッシュボード / 一覧（幅いっぱい使う）
   * - `reading`: 記事本文（本文カラムを READING_MAX に制限して可読性を確保）
   */
  variant?: "default" | "reading";
  /** xl+ で右に表示するサイドレール（関連 widget / 広告）。省略すると右レールなし */
  rightRail?: ReactNode;
  /**
   * lg+ で左に表示するサイドレール（テーマナビ等）。省略すると左レールなし。
   * 表示開始幅は home / ランキング一覧の本文内 aside と同じ lg に揃えてある。
   */
  leftRail?: ReactNode;
  /**
   * lg 未満で左レールをどう扱うか。
   * - `stack`（既定）: 本文の下に積む。関連リンク集など「読み終えた後で見る」もの向け
   * - `hide`: 描画しない。**ページ内容を切り替えるナビ**はページ末尾に置くと操作対象より
   *   後ろに来て意味を失うため、狭幅では非表示にし、代替 UI をページ側が本文上部に出す
   *   （テーマページ = ヘッダーの `lg:hidden` セレクタ）。
   *   ★代替 UI 側の境界も同じ lg にすること。ずれると両方出る幅ができる
   */
  leftRailNarrowBehavior?: "stack" | "hide";
  /**
   * 右 rail の表示開始幅。
   * - `xl`: 通常ページ。right rail は xl+ で表示
   * - `lg`: ブログ詳細など。right rail は lg+ で表示
   */
  rightRailBreakpoint?: "xl" | "lg";
  /** 追加 className（外側コンテナに当てる） */
  className?: string;
}

/**
 * サイト chrome (Header / Footer / 固定バナー等) がページ本文と横幅を揃えるための
 * 共有トークン。page.tsx は PageShell を使い、これを直接使うのは chrome のみ。
 *
 * 2026-07-11: 1700px → 1280px に統一 (ArticleShell = blog/ranking 詳細と同一幅。
 * doboku-note スタイルのサイト全体固定幅)。
 * 2026-08-03: lg+ の左右余白を 24px → 40px にし doboku-note と揃えた
 * (同サイトも header 含め `max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10`)。
 */
export const SHELL_WIDTH_CLASS =
  "mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-10";

/**
 * 全ページ共通の単一レイアウト Shell。
 *
 * 横幅・サイドレール・余白の SSOT。各 page.tsx は `container mx-auto` や
 * `max-w-[…]` を直接書かず、必ず本コンポーネントを経由する。
 *
 * 設計仕様: docs/01_技術設計/04_デザインシステム.md
 *
 * グリッド:
 * - レールなし     : 1280px 中央寄せ
 * - 右レールのみ   : [minmax(0,1fr) 316px]
 * - 左レールのみ   : [280px minmax(0,1fr)]
 * - 右レール lg    : lg [minmax(0,1fr) 316px]
 *
 * 右レール 316px と gap 40px は ArticleShell と同値 (doboku-note 準拠)。
 * 同じ `RightRailWidgets` を描画するため、両 Shell で幅を揃える。300×250 の
 * `SidebarPromoBanner` は Card で囲まず、このレール内に等倍で表示する。
 *
 * 通常は xl 未満で 1 カラム。`rightRailBreakpoint="lg"` の場合、右 rail は lg+ で表示する。
 *
 * NOTE: grid-template-columns は Tailwind JIT のため静的クラス文字列で持つ
 * （動的 px 連結は purge されるため不可）。
 */
export function PageShell({
  children,
  variant = "default",
  rightRail,
  leftRail,
  rightRailBreakpoint = "xl",
  leftRailNarrowBehavior = "stack",
  className,
}: PageShellProps) {
  const hasRight = !!rightRail;
  const hasLeft = !!leftRail;
  const showLeft = hasLeft && !hasRight;

  const gridClass =
    rightRailBreakpoint === "lg" && hasRight
      ? "lg:grid lg:grid-cols-[minmax(0,1fr)_316px] lg:gap-10 lg:items-start"
      : showLeft
        ? // 左レールは lg+ で出す。home / ランキング一覧が本文内 aside で同じナビを
          // lg から出しているため、同じ幅のウィンドウで「home には出るがテーマには
          // 出ない」という食い違いが起きていた (2026-08-05 指摘)。列幅と gap も home
          // (page.tsx の lg:grid-cols-[264px…] lg:gap-6 xl:grid-cols-[280px…]) に合わせる。
          "lg:grid lg:grid-cols-[264px_minmax(0,1fr)] lg:gap-6 lg:items-start xl:grid-cols-[280px_minmax(0,1fr)] xl:gap-10"
        : hasRight
          ? "xl:grid xl:grid-cols-[minmax(0,1fr)_316px] xl:gap-10 xl:items-start"
          : "";

  // 左レールと右レールは併存しない (showLeft = hasLeft && !hasRight) ので、
  // 積み下ろしの境界はどちらか一方だけを見ればよい。
  const narrowHiddenClass = showLeft
    ? "lg:hidden"
    : rightRailBreakpoint === "lg"
      ? "lg:hidden"
      : "xl:hidden";

  // reading variant は本文カラムを可読幅に制限（レールが無い場合は中央寄せ）
  const mainClass = cn(
    "min-w-0",
    variant === "reading" && "mx-auto w-full max-w-[760px] xl:mx-0",
  );

  return (
    <div className={cn(SHELL_WIDTH_CLASS, "py-8", className)}>
      {hasRight || hasLeft ? (
        <>
          <div className={gridClass}>
            {showLeft && <div className="hidden lg:block">{leftRail}</div>}
            <div className={mainClass}>{children}</div>
            {hasRight && (
              <div className={rightRailBreakpoint === "lg" ? "hidden lg:block" : "hidden xl:block"}>
                {rightRail}
              </div>
            )}
          </div>
          {/* レール表示幅未満でレールを本文下に積み下ろす */}
          <div className={cn("mt-10 space-y-8", narrowHiddenClass)}>
            {hasRight && rightRail}
            {showLeft && leftRailNarrowBehavior === "stack" && leftRail}
          </div>
        </>
      ) : (
        <div className={mainClass}>{children}</div>
      )}
    </div>
  );
}
