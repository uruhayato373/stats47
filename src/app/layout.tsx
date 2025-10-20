import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import Script from "next/script";
import "./globals.css";
import { JotaiProvider } from "@/lib/providers";
// import { SessionProvider } from "next-auth/react"; // 無効化: Auth.js機能を一時的に無効化
import { Header } from "@/components/organisms/layout/Header";
import { Sidebar } from "@/components/organisms/layout/Sidebar";

export const metadata: Metadata = {
  title: "CMS Dashboard",
  description:
    "A modern CMS dashboard for managing posts, members, and site content with ease.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${GeistSans.variable} ${GeistMono.variable} relative min-h-full light`}
    >
      <head>
        {/* ブロッキングスクリプト: レンダリング前にテーマを適用してFOUCを防止 */}
        <Script
          id="theme-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // localStorage からテーマを取得（Jotai の atomWithStorage と同じキー）
                  const savedTheme = localStorage.getItem('theme');

                  // システム設定を取得
                  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const systemTheme = systemPrefersDark ? 'dark' : 'light';

                  // 初期テーマを決定（localStorage 優先、デフォルトは light）
                  let theme = 'light';
                  if (savedTheme) {
                    try {
                      // atomWithStorage が JSON.stringify する可能性があるため、両方のフォーマットに対応
                      const parsed = JSON.parse(savedTheme);
                      theme = parsed || 'light';
                    } catch {
                      theme = savedTheme === 'dark' ? 'dark' : 'light';
                    }
                  }
                  // localStorage がない場合はデフォルトで light を使用
                  // システムテーマは初回訪問時のみ参考にし、必ずしも適用しない

                  // HTML と body にテーマクラスを即座に適用
                  // 既存のテーマクラスを削除してから新しいテーマを追加
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add(theme);

                  // body にもクラスを適用
                  document.body.classList.remove('light', 'dark');
                  document.body.classList.add(theme);
                } catch (e) {
                  // エラー時はライトモードをデフォルトとする
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add('light');
                  document.body.classList.remove('light', 'dark');
                  document.body.classList.add('light');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${GeistSans.className} bg-gray-100 dark:bg-neutral-900 antialiased light`}
      >
        <JotaiProvider>
          <Header />
          <Sidebar />
          <main className="lg:ps-60 pt-16">{children}</main>
        </JotaiProvider>
      </body>
    </html>
  );
}
