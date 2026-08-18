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
    title: "運用",
    items: [
      { href: "/dashboard", label: "プロジェクト現況" },
      { href: "/todo", label: "TODO" },
    ],
  },
];

export function ConsoleSidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col gap-6 overflow-y-auto border-r border-console-border bg-console-card px-3 py-5">
      <div className="px-3">
        <span className="block text-sm font-bold leading-tight tracking-tight text-console-fg">
          stats47
        </span>
        <span className="block text-xs text-console-muted">
          統合メディアコンソール
        </span>
        <span className="mt-1 block text-[11px] text-console-muted/70">
          local · :4747
        </span>
      </div>

      <ConsoleNavLinks groups={NAV_GROUPS} />

      {/* spacer: テーマ切替を最下部へ落とす */}
      <div className="flex-1" />

      <div className="px-1 pb-1">
        <ThemeToggle />
      </div>
    </aside>
  );
}
