import { cn } from "@stats47/components";

import Link from "@/components/atoms/SiteLink";
import { SHELL_WIDTH_CLASS } from "@/components/layout/PageShell";
import {
  ALL_THEMES_NAV_ITEM,
  PRIMARY_NAV_ITEMS,
} from "@/components/organisms/AppSidebar/site-navigation";

import { FooterSocialLinks } from "./FooterSocialLinks";

/** 主要な入口 (ランキング・都道府県・テーマ・統計ブログ・商品) とサイトの案内 */
const FOOTER_LINKS = [
  ...PRIMARY_NAV_ITEMS.filter((item) => item.key === "ranking" || item.key === "areas"),
  ALL_THEMES_NAV_ITEM,
  ...PRIMARY_NAV_ITEMS.filter((item) => item.key === "blog"),
  { href: "/products", label: "商品・書籍" },
  { href: "/about", label: "このサイトについて" },
  { href: "/privacy", label: "プライバシーポリシー" },
  { href: "/terms", label: "利用規約" },
] as const;

const LINK_CLASS = "text-xs text-muted-foreground transition-colors hover:text-foreground";

/**
 * 全ページ共通のフッター (2026-10-28 2 巡目: テンプレートに合わせて縮めた)。
 *
 * サイトの導線はサイドバー (AppSidebar) が持つので、フッターは主要な入口数個とサイトの案内・SNS・著作表記の
 * 1 段だけにする。本文とは border-t で区切る。lg (1024px) 未満でサイドバーが Sheet に替わって閉じている間も、
 * 一覧ページ (ランキング・都道府県・テーマ・ブログ) へのリンクはここから SSR の HTML に残る。
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      data-nav-surface="footer"
      className="w-full border-t border-border py-3 pb-[calc(0.75rem+var(--safe-area-bottom))]"
      suppressHydrationWarning
    >
      <div
        className={cn(
          SHELL_WIDTH_CLASS,
          "flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4"
        )}
      >
        <nav aria-label="サイトの案内">
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={LINK_CLASS}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-4">
          <FooterSocialLinks />
          <p className="text-xs text-muted-foreground" suppressHydrationWarning>
            © {year} stats47
          </p>
        </div>
      </div>
    </footer>
  );
}
