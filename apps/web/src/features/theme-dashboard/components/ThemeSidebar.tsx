import Link from "next/link";

import { cn } from "@stats47/components";

import { ALL_THEMES } from "../config/all-themes";

import type { ThemeConfig } from "../types";

/**
 * テーマページの左ナビサイドバー (PageShell leftRail 用)。
 * グループ1: 全テーマ一覧 (現テーマ強調・切替)。グループ2: 現テーマの指標 (ランキングへ)。
 */
export function ThemeSidebar({ theme }: { theme: ThemeConfig }) {
  return (
    <nav
      aria-label="テーマナビゲーション"
      className="space-y-6 text-sm xl:sticky xl:top-20 xl:max-h-[calc(100vh-5.5rem)] xl:overflow-y-auto xl:pr-1"
    >
      <div>
        <h2 className="mb-2 px-2 text-xs font-semibold tracking-wide text-muted-foreground">
          テーマ
        </h2>
        <ul className="space-y-0.5">
          {ALL_THEMES.map((t) => {
            const active = t.themeKey === theme.themeKey;
            return (
              <li key={t.themeKey}>
                <Link
                  href={`/themes/${t.themeKey}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "block rounded-md px-2 py-1.5 transition-colors",
                    active
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-foreground hover:bg-muted",
                  )}
                >
                  {t.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {theme.tabIndicators.length > 0 && (
        <div>
          <h2 className="mb-2 px-2 text-xs font-semibold tracking-wide text-muted-foreground">
            {theme.title}の指標
          </h2>
          <ul className="space-y-0.5">
            {theme.tabIndicators.map((i) => (
              <li key={i.rankingKey}>
                <Link
                  href={`/ranking/${i.rankingKey}`}
                  className="block rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {i.tabLabel}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}
