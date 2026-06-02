/**
 * Mega Footer (D 最適化版)
 *
 * 全カテゴリ + 全テーマを Server Component で SSG。
 * サイドバー閉じた分の内部リンク密度を補完し、SEO 維持。
 */

import Link from "next/link";

import { isOk } from "@stats47/types";

import { listCategories } from "@/features/category/server";
import { ALL_THEMES } from "@/features/theme-dashboard/server";

import { FooterSocialLinks } from "./FooterSocialLinks";

const NAV_LINKS = [
  { href: "/", label: "ホーム" },
  { href: "/areas", label: "都道府県別" },
  { href: "/themes", label: "テーマ" },
  { href: "/category/population", label: "カテゴリ" },
  { href: "/survey", label: "調査" },
  { href: "/blog", label: "ブログ" },
  { href: "/search", label: "検索" },
] as const;

const SITE_LINKS = [
  { href: "/about", label: "このサイトについて" },
  { href: "/privacy", label: "プライバシーポリシー" },
  { href: "/terms", label: "利用規約" },
] as const;

export async function Footer() {
  const currentYear = new Date().getFullYear();

  // カテゴリ取得 (R2 cached)。失敗時は空配列で fallback
  const catResult = await listCategories().catch(() => null);
  const categories = catResult && isOk(catResult) ? catResult.data : [];

  return (
    <footer
      className="w-full border-t border-border bg-muted/30 pt-8 pb-[calc(1rem+var(--safe-area-bottom))]"
      suppressHydrationWarning
    >
      <div className="mx-auto max-w-[1700px] px-4 sm:px-6">
        {/* メインリンクグリッド */}
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:grid-cols-5">
          {/* コンテンツ */}
          <div>
            <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-foreground">
              コンテンツ
            </h3>
            <ul className="space-y-1.5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* カテゴリ */}
          {categories.length > 0 && (
            <div>
              <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-foreground">
                カテゴリ
              </h3>
              <ul className="space-y-1.5">
                {categories.slice(0, 9).map((cat) => (
                  <li key={cat.categoryKey}>
                    <Link
                      href={`/category/${cat.categoryKey}`}
                      className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {cat.categoryName}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* テーマ (前半) */}
          <div>
            <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-foreground">
              テーマ
            </h3>
            <ul className="space-y-1.5">
              {ALL_THEMES.slice(0, 9).map((theme) => (
                <li key={theme.themeKey}>
                  <Link
                    href={`/themes/${theme.themeKey}`}
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {theme.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* テーマ (後半) */}
          {ALL_THEMES.length > 9 && (
            <div>
              <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-foreground sm:invisible">
                テーマ続き
              </h3>
              <ul className="space-y-1.5">
                {ALL_THEMES.slice(9).map((theme) => (
                  <li key={theme.themeKey}>
                    <Link
                      href={`/themes/${theme.themeKey}`}
                      className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {theme.title}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/themes"
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    すべて見る →
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* サイト情報 */}
          <div>
            <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-foreground">
              サイト情報
            </h3>
            <ul className="space-y-1.5">
              {SITE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            {/* SNS アイコン */}
            <div className="mt-4">
              <FooterSocialLinks />
            </div>
          </div>
        </div>

        {/* 著作権・データソース */}
        <div className="mt-8 border-t border-border pt-4 text-center text-xs text-muted-foreground sm:flex sm:items-center sm:justify-between sm:text-left">
          <p>© {currentYear} 統計で見る都道府県</p>
          <p className="mt-1 sm:mt-0">
            データ提供: e-Stat (政府統計の総合窓口) ほか
          </p>
        </div>
      </div>
    </footer>
  );
}
