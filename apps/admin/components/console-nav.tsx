import { Suspense } from "react";

import { ConsoleNavLinks, type NavGroup } from "./console-nav-links";
import { ThemeToggle } from "./theme-toggle";

/** 左サイドメニューの並び。見る目的でグループ化する (doboku-note admin と同型)。 */
const NAV_GROUPS: readonly NavGroup[] = [
  { title: null, items: [{ href: "/", label: "ホーム" }] },
  {
    title: "制作・投稿",
    items: [
      { href: "/sns", label: "SNS" },
      { href: "/buzz-map", label: "バズ地図" },
    ],
  },
  {
    title: "資産",
    items: [
      { href: "/assets", label: "画像資産" },
      { href: "/svg", label: "SVG カタログ" },
    ],
  },
  {
    title: "調査・設計",
    items: [{ href: "/research", label: "調査カタログ" }],
  },
  {
    title: "収益",
    items: [
      { href: "/revenue", label: "収益 (AdSense)" },
      { href: "/ads", label: "アフィリエイト運用" },
    ],
  },
  {
    title: "品質・運用",
    items: [
      { href: "/dashboard", label: "プロジェクト現況" },
      { href: "/quality", label: "品質" },
      { href: "/ops", label: "CI・台帳" },
    ],
  },
  {
    title: "TODO",
    items: [
      { href: "/todo", label: "実行バックログ" },
      { href: "/todo?f=weekly", label: "今週の計画" },
      { href: "/todo?f=monthly", label: "今月の計画" },
      { href: "/todo?f=improvements", label: "効果測定・改善" },
    ],
  },
];

export function ConsoleSidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-44 shrink-0 flex-col gap-6 overflow-y-auto border-r border-console-border bg-console-card px-2 py-4 sm:w-60 sm:px-3 sm:py-5">
      <div className="px-3">
        <span className="block text-sm font-bold leading-tight tracking-tight text-console-fg">
          stats47
        </span>
        <span className="block text-xs text-console-muted">
          管理コンソール
        </span>
        <span className="mt-1 block text-[11px] text-console-muted/70">
          local · :4747
        </span>
      </div>

      <Suspense fallback={<div className="h-64" aria-hidden="true" />}>
        <ConsoleNavLinks groups={NAV_GROUPS} />
      </Suspense>

      {/* spacer: テーマ切替を最下部へ落とす */}
      <div className="flex-1" />

      <div className="px-1 pb-1">
        <ThemeToggle />
      </div>
    </aside>
  );
}
