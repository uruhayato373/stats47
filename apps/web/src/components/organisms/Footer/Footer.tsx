import Link from "next/link";

import { FooterSocialLinks } from "./FooterSocialLinks";

const SITE_LINKS = [
  { href: "/about", label: "このサイトについて" },
  { href: "/privacy", label: "プライバシーポリシー" },
  { href: "/terms", label: "利用規約" },
] as const;

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="w-full border-t border-border bg-muted/30 pt-8 pb-[calc(1rem+var(--safe-area-bottom))]"
      suppressHydrationWarning
    >
      <div className="mx-auto max-w-[1700px] px-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* SNS アイコン */}
          <FooterSocialLinks />

          {/* サイト情報リンク */}
          <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
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
        </div>

        {/* 著作権・データソース */}
        <div className="mt-4 border-t border-border pt-4 text-center text-xs text-muted-foreground sm:flex sm:items-center sm:justify-between sm:text-left">
          <p>© {currentYear} 統計で見る都道府県</p>
          <p className="mt-1 sm:mt-0">
            データ提供: e-Stat (政府統計の総合窓口) ほか
          </p>
        </div>
      </div>
    </footer>
  );
}
