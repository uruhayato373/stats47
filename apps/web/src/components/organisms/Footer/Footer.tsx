import { cn } from "@stats47/components";

import Link from "@/components/atoms/SiteLink";
import { SHELL_WIDTH_CLASS } from "@/components/layout/PageShell";
import {
  ALL_THEMES_NAV_ITEM,
  PRIMARY_NAV_ITEMS,
} from "@/components/organisms/AppSidebar/site-navigation";

import { NAV_THEMES, themeHref } from "@/features/theme-dashboard/config/theme-urls";

import { FooterSocialLinks } from "./FooterSocialLinks";

const SITE_LINKS = [
  { href: "/products", label: "商品・書籍" },
  { href: "/about", label: "このサイトについて" },
  { href: "/privacy", label: "プライバシーポリシー" },
  { href: "/terms", label: "利用規約" },
] as const;

const LINK_CLASS = "text-xs text-muted-foreground transition-colors hover:text-foreground";

/**
 * 全ページ共通のフッター。
 *
 * lg (1024px) 未満ではサイドバーが Sheet に替わり、閉じている間は DOM からナビのリンクが消える。
 * 検索エンジンと狭い画面の利用者がサイトの主要な入口へ辿れるよう、主要ナビとテーマへのリンクを
 * ここに常に出す (項目とラベルは AppSidebar と同じ site-navigation.ts から取る)。
 */
export function Footer() {
  const themeLinks = [
    ...NAV_THEMES.map((theme) => ({ href: themeHref(theme.themeKey), label: theme.title })),
    { href: ALL_THEMES_NAV_ITEM.href, label: ALL_THEMES_NAV_ITEM.label },
  ];

  return (
    <footer
      data-nav-surface="footer"
      className="w-full border-t border-border bg-muted/30 py-4 pb-[calc(1rem+var(--safe-area-bottom))]"
      suppressHydrationWarning
    >
      <div className={cn(SHELL_WIDTH_CLASS, "flex flex-col gap-3")}>
        <nav aria-label="主要ナビ">
          <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
            {PRIMARY_NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={cn(LINK_CLASS, "font-medium text-foreground/80")}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="テーマ">
          <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
            {themeLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={LINK_CLASS}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <FooterSocialLinks />
          <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
            {SITE_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={LINK_CLASS}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
