/**
 * アプリケーションフッターコンポーネント
 * 全ページ共通のフッター要素を提供
 */

"use client";

import Link from "next/link";

import { Instagram, Youtube, Twitter, PenLine } from "lucide-react";

/**
 * フッターリンクの型定義
 */
type FooterLink = {
  href: string;
  label: string;
};

/**
 * フッターリンクの定義
 */
const FOOTER_LINKS: FooterLink[] = [
  { href: "/", label: "ホーム" },
  { href: "/about", label: "このサイトについて" },
  { href: "/privacy", label: "プライバシーポリシー" },
  { href: "/terms", label: "利用規約" },
] as const;

// 外部リンクURL
const EXTERNAL_LINKS = {
  x: "https://x.com/stats47jp373",
  instagram: "https://www.instagram.com/stats47jp/",
  youtube: "https://www.youtube.com/@stats47jp",
  note: "https://note.com/stats47",
} as const;

/**
 * フッターコンポーネント
 * シンプルな著作権表示とリンクを提供
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="w-full bg-background border-t border-border pt-4 pb-[calc(1rem+var(--safe-area-bottom))]"
      suppressHydrationWarning
    >
      <div className="px-4 sm:px-5.5 mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          {/* 著作権表示 */}
          <div className="text-center sm:text-left">
            <p>© {currentYear} 統計で見る都道府県</p>
          </div>

          <div className="flex items-center gap-6 flex-wrap justify-center">
            {/* リンク */}
            <div className="flex items-center gap-4 flex-wrap justify-center">
              {FOOTER_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* SNSアイコンリンク */}
            <div className="flex items-center gap-3">
              <a
                href={EXTERNAL_LINKS.x}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="X (Twitter)"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href={EXTERNAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-[#E1306C] transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href={EXTERNAL_LINKS.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-[#FF0000] transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="h-5 w-5" />
              </a>
              <a
                href={EXTERNAL_LINKS.note}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-[#41C9B4] transition-colors"
                aria-label="note"
              >
                <PenLine className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
